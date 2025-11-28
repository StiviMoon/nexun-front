"use client";

import { useRef, useCallback } from "react";
import Peer from "simple-peer";
import { VideoService, VideoRoom, VideoParticipant } from "@/utils/services/videoService";
import { useVideoStore } from "@/utils/videoStore";
import { getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "@/config/firebase";

// ICE Servers configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Para producción, agrega servidores TURN aquí
  ],
};

const getFirebaseAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const existingApps = getApps();
  const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  return getAuth(app);
};

const getCurrentUserId = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return auth.currentUser?.uid || null;
};

interface UseVideoCallReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: { message: string; code?: string } | null;

  // Room state
  currentRoom: VideoRoom | null;
  participants: VideoParticipant[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;

  // Media controls
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  createRoom: (name: string, description?: string, maxParticipants?: number, visibility?: "public" | "private", createChat?: boolean) => Promise<string | null>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  toggleAudio: (enabled: boolean) => void;
  toggleVideo: (enabled: boolean) => void;
  toggleScreenShare: (enabled: boolean) => Promise<void>;
  getLocalStream: () => Promise<MediaStream | null>;
}

export const useVideoCall = (useGateway = false): UseVideoCallReturn => {
  const videoServiceRef = useRef<VideoService | null>(null);
  const peersRef = useRef<Map<string, Peer.Instance>>(new Map());
  const listenersRegisteredRef = useRef(false);
  const connectingRef = useRef(false);
  const joiningRoomRef = useRef<string | null>(null);
  const processedRoomsRef = useRef<Set<string>>(new Set()); // Prevenir procesamiento duplicado

  // Store state
  const isConnected = useVideoStore((state) => state.isConnected);
  const isConnecting = useVideoStore((state) => state.isConnecting);
  const error = useVideoStore((state) => state.error);
  const currentRoom = useVideoStore((state) => state.currentRoom);
  const participants = useVideoStore((state) => state.participants);
  const localStream = useVideoStore((state) => state.localStream);
  const remoteStreams = useVideoStore((state) => state.remoteStreams);
  const isAudioEnabled = useVideoStore((state) => state.isAudioEnabled);
  const isVideoEnabled = useVideoStore((state) => state.isVideoEnabled);
  const isScreenSharing = useVideoStore((state) => state.isScreenSharing);

  // Store actions
  const setConnected = useVideoStore((state) => state.setConnected);
  const setConnecting = useVideoStore((state) => state.setConnecting);
  const setError = useVideoStore((state) => state.setError);
  const setCurrentRoom = useVideoStore((state) => state.setCurrentRoom);
  const setParticipants = useVideoStore((state) => state.setParticipants);
  const setLocalStream = useVideoStore((state) => state.setLocalStream);
  const setAudioEnabled = useVideoStore((state) => state.setAudioEnabled);
  const setVideoEnabled = useVideoStore((state) => state.setVideoEnabled);
  const setScreenSharing = useVideoStore((state) => state.setScreenSharing);
  const addRemoteStream = useVideoStore((state) => state.addRemoteStream);
  const removeRemoteStream = useVideoStore((state) => state.removeRemoteStream);
  const reset = useVideoStore((state) => state.reset);

  // Get local media stream
  const getLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      // Detener stream anterior si existe
      const currentStream = useVideoStore.getState().localStream;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Asegurar que los tracks estén habilitados según el estado actual
      const audioEnabled = useVideoStore.getState().isAudioEnabled;
      const videoEnabled = useVideoStore.getState().isVideoEnabled;

      stream.getAudioTracks().forEach((track) => {
        track.enabled = audioEnabled;
        console.log(`Audio track ${track.id} inicializado como ${audioEnabled ? 'enabled' : 'disabled'}`);
      });

      stream.getVideoTracks().forEach((track) => {
        track.enabled = videoEnabled;
        console.log(`Video track ${track.id} inicializado como ${videoEnabled ? 'enabled' : 'disabled'}`);
      });

      setLocalStream(stream);
      console.log('✅ Stream local obtenido correctamente');
      return stream;
    } catch (error) {
      console.error("❌ Error getting local stream:", error);
      setError({
        message: error instanceof Error ? error.message : "Failed to access camera/microphone",
        code: "MEDIA_ACCESS_ERROR",
      });
      return null;
    }
  }, [setLocalStream, setError]);

  // Create peer connection with SimplePeer
  const createPeerConnection = useCallback(
    async (targetUserId: string, initiator: boolean): Promise<Peer.Instance> => {
      const storeState = useVideoStore.getState();
      const currentStream = storeState.localStream;
      const room = storeState.currentRoom;
      
      if (!currentStream) {
        throw new Error("No stream available");
      }
      
      if (!room) {
        throw new Error("No room available");
      }

      // Evitar crear peers duplicados
      const existingPeer = peersRef.current.get(targetUserId);
      if (existingPeer) {
        console.log(`⚠️ Peer ya existe para ${targetUserId}`);
        return existingPeer;
      }

      console.log(`🔗 Creando peer con ${targetUserId} (initiator: ${initiator})`);

      const peer = new Peer({
        initiator,
        trickle: false,
        stream: currentStream,
        config: ICE_SERVERS,
      });

      // Guardar peer ANTES de configurar listeners para evitar condiciones de carrera
      peersRef.current.set(targetUserId, peer);

      // When SimplePeer generates signal (offer/answer)
      peer.on("signal", (data) => {
        const videoService = videoServiceRef.current;
        // Obtener room actual del store en tiempo real
        const currentRoom = useVideoStore.getState().currentRoom;
        
        if (!videoService) {
          console.error(`❌ No se puede enviar señal: videoService no disponible`);
          return;
        }
        
        if (!currentRoom) {
          console.error(`❌ No se puede enviar señal: room no disponible`);
          return;
        }

        const signalType = initiator ? "offer" : "answer";
        console.log(`📤 [SIGNAL] Enviando señal ${signalType} a ${targetUserId} en room ${currentRoom.id}`);
        console.log(`📦 [SIGNAL] Datos de la señal:`, typeof data, data ? 'presentes' : 'faltantes');
        
        try {
          videoService.sendSignal({
            type: signalType,
            roomId: currentRoom.id,
            targetUserId,
            data,
          });
          console.log(`✅ [SIGNAL] Señal ${signalType} enviada exitosamente a ${targetUserId}`);
        } catch (err) {
          console.error(`❌ [SIGNAL] Error enviando señal ${signalType} a ${targetUserId}:`, err);
        }
      });

      // When we receive remote stream
      peer.on("stream", (remoteStream) => {
        console.log(`🎥 Stream remoto recibido de ${targetUserId}`);
        console.log(`📹 Audio tracks: ${remoteStream.getAudioTracks().length}, Video tracks: ${remoteStream.getVideoTracks().length}`);
        addRemoteStream(targetUserId, remoteStream);
        
        // Asegurar que el participante esté en la lista
        const currentParticipants = useVideoStore.getState().participants;
        const safeCurrentParticipants = Array.isArray(currentParticipants) ? currentParticipants : [];
        const participantExists = safeCurrentParticipants.some(p => p.userId === targetUserId);
        
        if (!participantExists) {
          // Agregar participante si no existe
          const newParticipant: VideoParticipant = {
            userId: targetUserId,
            socketId: '',
            isAudioEnabled: remoteStream.getAudioTracks().some(t => t.enabled),
            isVideoEnabled: remoteStream.getVideoTracks().some(t => t.enabled),
            isScreenSharing: false,
            joinedAt: new Date(),
          };
          const updatedParticipants = [...safeCurrentParticipants, newParticipant];
          setParticipants(updatedParticipants);
          console.log(`✅ [STREAM] Participante agregado después de recibir stream. Total: ${updatedParticipants.length}`);
        } else {
          // Actualizar estado de audio/video del participante existente
          const updatedParticipants = safeCurrentParticipants.map(p => 
            p.userId === targetUserId
              ? {
                  ...p,
                  isAudioEnabled: remoteStream.getAudioTracks().some(t => t.enabled),
                  isVideoEnabled: remoteStream.getVideoTracks().some(t => t.enabled),
                }
              : p
          );
          setParticipants(updatedParticipants);
        }
        
        // Log cuando los tracks cambian de estado
        remoteStream.getAudioTracks().forEach(track => {
          track.onended = () => console.log(`🔴 Audio track ended para ${targetUserId}`);
          track.onmute = () => console.log(`🔇 Audio track muted para ${targetUserId}`);
          track.onunmute = () => console.log(`🔊 Audio track unmuted para ${targetUserId}`);
        });
        
        remoteStream.getVideoTracks().forEach(track => {
          track.onended = () => console.log(`🔴 Video track ended para ${targetUserId}`);
          track.onmute = () => console.log(`📹 Video track muted para ${targetUserId}`);
          track.onunmute = () => console.log(`📹 Video track unmuted para ${targetUserId}`);
        });
      });

      // Handle errors
      peer.on("error", (err) => {
        console.error(`❌ Error in peer connection with ${targetUserId}:`, err);
        const peer = peersRef.current.get(targetUserId);
        if (peer) {
          peer.destroy();
        }
        peersRef.current.delete(targetUserId);
        removeRemoteStream(targetUserId);
      });

      // Connection established
      peer.on("connect", () => {
        console.log(`✅ [PEER] Conexión establecida con ${targetUserId}`);
      });

      // Connection closed
      peer.on("close", () => {
        console.log(`🔌 [PEER] Conexión cerrada con ${targetUserId}`);
        peersRef.current.delete(targetUserId);
        removeRemoteStream(targetUserId);
      });
      
      // Ready event (when SimplePeer is ready to send/receive data)
      if (initiator) {
        // Para el iniciador, esperar a que esté listo para generar offer
        peer.on("ready", () => {
          console.log(`🟢 [PEER] Peer iniciador listo con ${targetUserId}`);
        });
      }

      return peer;
    },
    [addRemoteStream, removeRemoteStream, setParticipants]
  );

  // Connect to video service
  const connect = useCallback(async () => {
    if (videoServiceRef.current?.isConnected()) {
      setConnecting(false);
      setConnected(true);
      return;
    }

    if (connectingRef.current) {
      return;
    }

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setConnecting(false);
      setError({
        message: "Usuario no autenticado. Por favor inicia sesión.",
        code: "NOT_AUTHENTICATED",
      });
      return;
    }

    connectingRef.current = true;
    setConnecting(true);
    setError(null);

    try {
      if (!videoServiceRef.current) {
        videoServiceRef.current = new VideoService(useGateway);
      }

      const videoService = videoServiceRef.current;
      const socket = await videoService.connect();

      if (!socket.connected) {
        await new Promise<void>((resolve, reject) => {
          if (socket.connected) {
            resolve();
            return;
          }
          
          const timeout = setTimeout(() => {
            socket.off("connect", onConnect);
            socket.off("connect_error", onError);
            reject(new Error("Socket connection timeout"));
          }, 5000);
          
          const onConnect = () => {
            clearTimeout(timeout);
            socket.off("connect", onConnect);
            socket.off("connect_error", onError);
            resolve();
          };
          
          const onError = (err: Error) => {
            clearTimeout(timeout);
            socket.off("connect", onConnect);
            socket.off("connect_error", onError);
            reject(err);
          };
          
          socket.once("connect", onConnect);
          socket.once("connect_error", onError);
        });
      }

      if (!socket.connected) {
        connectingRef.current = false;
        setConnecting(false);
        setError({ message: "Socket failed to connect", code: "CONNECTION_FAILED" });
        return;
      }

      connectingRef.current = false;

      if (!listenersRegisteredRef.current) {
        console.log("📡 [CONNECT] Socket conectado, registrando listeners en socket:", socket.id);

        // Room created
        videoService.onRoomCreated((room) => {
          console.log("🏠 [CONNECT] Room created:", room.id);
          setCurrentRoom(room);
        });

        // Room joined - Registrar listener ANTES de cualquier otra operación
        console.log("📡 [CONNECT] Registrando listener para video:room:joined en socket:", socket.id);
        videoService.onRoomJoined(async ({ room, participants: roomParticipants }) => {
          console.log("🎉 [ROOM_JOINED_CALLBACK] ✅ EVENTO RECIBIDO EN CALLBACK NORMAL - Joined room:", room.id, "con", roomParticipants.length, "participantes");
          console.log("📋 [ROOM_JOINED] Nombre de la sala:", room.name);
          console.log("📋 [ROOM_JOINED] Participantes:", roomParticipants.map(p => ({ userId: p.userId, socketId: p.socketId })));
          setCurrentRoom(room);
          setParticipants(roomParticipants);

          const currentUserId = getCurrentUserId();
          if (!currentUserId) {
            console.error("❌ No se pudo obtener currentUserId");
            return;
          }

          console.log("👤 Usuario actual:", currentUserId);

          // Asegurar que tenemos stream local antes de crear peers
          let currentStream = useVideoStore.getState().localStream;
          if (!currentStream) {
            console.log("⚠️ No hay stream local, intentando obtenerlo...");
            currentStream = await getLocalStream();
            if (!currentStream) {
              console.error("❌ No se pudo obtener stream local");
              return;
            }
          }

          // Esperar un poco para asegurar que todos tienen su stream listo
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Create peer connections with existing participants
          // IMPORTANTE: El nuevo usuario NO debe crear conexiones como iniciador
          // Debe esperar a que los usuarios existentes le envíen offers
          // Los usuarios existentes crearán conexiones cuando reciban el evento "user:joined"
          console.log(`🔗 [ROOM_JOINED] Procesando ${roomParticipants.length} participantes`);
          console.log(`⏳ [ROOM_JOINED] Esperando a que los usuarios existentes inicien conexiones...`);
          
          // El nuevo usuario NO crea conexiones aquí
          // Los usuarios existentes recibirán el evento "video:user:joined" y crearán conexiones como iniciadores
          // El nuevo usuario solo responderá a los offers que reciba en onSignal
          
          console.log(`✅ [ROOM_JOINED] Procesamiento de participantes completado. Peers activos: ${peersRef.current.size}`);
        });

        // User joined - cuando otro usuario se une después de nosotros
        // IMPORTANTE: El usuario que YA está en la sala debe crear la conexión como INICIADOR
        videoService.onUserJoined(async ({ userId, userName }) => {
          console.log("👤 [USER_JOINED] User joined:", userId, userName ? `(${userName})` : '');
          const currentUserId = getCurrentUserId();
          
          if (userId === currentUserId) {
            console.log(`⏭️ [USER_JOINED] Ignorando evento de uno mismo`);
            return;
          }
          
          // Actualizar la lista de participantes inmediatamente para que la UI se actualice
          const currentParticipants = useVideoStore.getState().participants;
          const safeCurrentParticipants = Array.isArray(currentParticipants) ? currentParticipants : [];
          
          // Verificar si el participante ya existe
          const participantExists = safeCurrentParticipants.some(p => p.userId === userId);
          
          if (!participantExists) {
            // Agregar el nuevo participante a la lista
            const newParticipant: VideoParticipant = {
              userId,
              socketId: '', // Se actualizará cuando recibamos más info
              userName: userName || undefined,
              isAudioEnabled: true,
              isVideoEnabled: true,
              isScreenSharing: false,
              joinedAt: new Date(),
            };
            
            const updatedParticipants = [...safeCurrentParticipants, newParticipant];
            setParticipants(updatedParticipants);
            console.log(`✅ [USER_JOINED] Participante agregado a la lista. Total: ${updatedParticipants.length}`);
          }
          
          if (peersRef.current.has(userId)) {
            const existingPeer = peersRef.current.get(userId);
            if (existingPeer && !existingPeer.destroyed) {
              console.log(`✅ [USER_JOINED] Ya existe un peer activo para ${userId}`);
              return;
            } else {
              console.log(`🧹 [USER_JOINED] Limpiando peer destruido para ${userId}`);
              peersRef.current.delete(userId);
            }
          }
          
          const currentStream = useVideoStore.getState().localStream;
          if (!currentStream) {
            console.warn(`⚠️ [USER_JOINED] No hay stream local, obteniendo...`);
            await getLocalStream();
            const newStream = useVideoStore.getState().localStream;
            if (!newStream) {
              console.error(`❌ [USER_JOINED] No se pudo obtener stream local`);
              return;
            }
          }
          
          console.log(`🔗 [USER_JOINED] Creando conexión como INICIADOR hacia nuevo usuario ${userId}`);
          try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const peer = await createPeerConnection(userId, true);
            if (peer && !peer.destroyed) {
              console.log(`✅ [USER_JOINED] Peer creado exitosamente con ${userId}`);
              await new Promise(resolve => setTimeout(resolve, 300));
            } else {
              console.error(`❌ [USER_JOINED] Peer creado pero está destruido`);
            }
          } catch (err) {
            console.error(`❌ [USER_JOINED] Error creando peer con ${userId}:`, err);
          }
        });

        // User left
        videoService.onUserLeft(({ userId }) => {
          console.log("👋 User left:", userId);
          const peer = peersRef.current.get(userId);
          if (peer) {
            peer.destroy();
            peersRef.current.delete(userId);
          }
          removeRemoteStream(userId);
        });

        // WebRTC signal received
        videoService.onSignal(async ({ type, fromUserId, data }) => {
          console.log(`📡 [SIGNAL_RECEIVED] Señal recibida de ${fromUserId}: ${type}`);
          console.log(`📦 [SIGNAL_RECEIVED] Tipo de señal: ${type}, Datos:`, data ? 'presentes' : 'faltantes');
          
          let peer = peersRef.current.get(fromUserId);
          
          console.log(`🔍 [SIGNAL_RECEIVED] Peer existente para ${fromUserId}: ${peer ? 'sí' : 'no'}`);

          if (!peer) {
            // Create peer if it doesn't exist (when receiving offer)
            if (type === "offer") {
              const storeState = useVideoStore.getState();
              const currentStream = storeState.localStream;
              
              if (currentStream) {
                if (peersRef.current.has(fromUserId)) {
                  console.warn(`⚠️ Ya existe un peer para ${fromUserId}, limpiando antes de crear nuevo...`);
                  const oldPeer = peersRef.current.get(fromUserId);
                  if (oldPeer && !oldPeer.destroyed) {
                    oldPeer.destroy();
                  }
                  peersRef.current.delete(fromUserId);
                }
                
                console.log(`🔗 Creando peer con ${fromUserId} como NO iniciador (recibiendo offer)`);
                try {
                  peer = await createPeerConnection(fromUserId, false);
                  await new Promise(resolve => setTimeout(resolve, 150));
                  
                  if (peer && !peer.destroyed) {
                    const peerInstance = peer as Peer.Instance & { _pc?: RTCPeerConnection };
                    const pc = peerInstance._pc;
                    if (pc && pc.signalingState !== 'stable') {
                      console.warn(`⚠️ Peer no está en estado estable (${pc.signalingState}), esperando...`);
                      await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    peer.signal(data as Peer.SignalData);
                    console.log(`✅ Señal offer procesada para ${fromUserId}`);
                  }
                } catch (err) {
                  console.error(`❌ Error creando peer con ${fromUserId}:`, err);
                  if (peer && !peer.destroyed) {
                    peer.destroy();
                  }
                  peersRef.current.delete(fromUserId);
                }
              } else {
                console.warn(`⚠️ No hay stream local para responder a offer de ${fromUserId}`);
              }
            } else if (type === "answer") {
              console.warn(`⚠️ Señal answer recibida de ${fromUserId} pero no hay peer (esperamos recibir offer primero)`);
            } else {
              console.warn(`⚠️ Señal ${type} recibida de ${fromUserId} pero no hay peer (solo procesamos offers para crear peers)`);
            }
            return;
          }

          if (peer.destroyed) {
            console.warn(`⚠️ Peer con ${fromUserId} está destruido, eliminando y creando nuevo si es offer`);
            peersRef.current.delete(fromUserId);
            if (type === "offer") {
              const storeState = useVideoStore.getState();
              const currentStream = storeState.localStream;
              if (currentStream) {
                try {
                  const newPeer = await createPeerConnection(fromUserId, false);
                  await new Promise(resolve => setTimeout(resolve, 100));
                  if (newPeer && !newPeer.destroyed) {
                    newPeer.signal(data as Peer.SignalData);
                    console.log(`✅ Nuevo peer creado y señal offer procesada para ${fromUserId}`);
                  }
                } catch (err) {
                  console.error(`❌ Error recreando peer con ${fromUserId}:`, err);
                }
              }
            }
            return;
          }

          try {
            const peerInstance = peer as Peer.Instance & { _pc?: RTCPeerConnection };
            const pc = peerInstance._pc;
            
            if (pc) {
              const state = pc.signalingState;
              
              if (state === 'stable') {
                if (type === 'offer') {
                  console.warn(`⚠️ Peer de ${fromUserId} ya está estable, ignorando offer duplicado`);
                  return;
                }
                if (type === 'answer') {
                  console.warn(`⚠️ Peer de ${fromUserId} ya está estable, ignorando answer duplicado`);
                  return;
                }
              }
              
              if (state === 'have-local-offer' && type === 'offer') {
                console.warn(`⚠️ Peer de ${fromUserId} ya tiene offer local, ignorando offer duplicado`);
                return;
              }
              
              if (state === 'have-remote-offer' && type === 'answer') {
                console.warn(`⚠️ Peer de ${fromUserId} ya tiene answer, ignorando answer duplicado`);
                return;
              }
              
              if (state === 'have-local-offer' && type === 'answer') {
                console.warn(`⚠️ Peer de ${fromUserId} ya tiene offer local, no se puede procesar answer`);
                return;
              }
            }
            
            peer.signal(data as Peer.SignalData);
            console.log(`✅ Señal ${type} procesada para ${fromUserId}`);
          } catch (err) {
            if (err instanceof Error) {
              if (err.message.includes('wrong state') || err.message.includes('InvalidStateError')) {
                console.warn(`⚠️ Estado incorrecto del peer para ${fromUserId} (${type}), ignorando señal duplicada`);
                return;
              }
            }
            console.error(`❌ Error procesando señal ${type} de ${fromUserId}:`, err);
          }
        });

        // Audio/Video toggled
        videoService.onAudioToggled(({ userId, enabled }) => {
          console.log(`🔊 User ${userId} ${enabled ? "enabled" : "disabled"} audio`);
          
          // Actualizar el estado del participante en el store
          const currentParticipants = useVideoStore.getState().participants;
          if (Array.isArray(currentParticipants)) {
            const updatedParticipants = currentParticipants.map((p) =>
              p.userId === userId
                ? { ...p, isAudioEnabled: enabled }
                : p
            );
            setParticipants(updatedParticipants);
          }
          
          // Si hay un stream remoto, actualizar el track de audio
          const remoteStream = useVideoStore.getState().remoteStreams.get(userId);
          if (remoteStream) {
            const audioTracks = remoteStream.getAudioTracks();
            audioTracks.forEach((track) => {
              track.enabled = enabled;
              console.log(`🔊 Audio track ${track.id} de ${userId} ${enabled ? 'ENABLED' : 'DISABLED'}`);
            });
          }
        });

        videoService.onVideoToggled(({ userId, enabled }) => {
          console.log(`📹 User ${userId} ${enabled ? "enabled" : "disabled"} video`);
          
          // Actualizar el estado del participante en el store
          const currentParticipants = useVideoStore.getState().participants;
          if (Array.isArray(currentParticipants)) {
            const updatedParticipants = currentParticipants.map((p) =>
              p.userId === userId
                ? { ...p, isVideoEnabled: enabled }
                : p
            );
            setParticipants(updatedParticipants);
          }
          
          // Si hay un stream remoto, actualizar el track de video
          const remoteStream = useVideoStore.getState().remoteStreams.get(userId);
          if (remoteStream) {
            const videoTracks = remoteStream.getVideoTracks();
            videoTracks.forEach((track) => {
              track.enabled = enabled;
              console.log(`📹 Video track ${track.id} de ${userId} ${enabled ? 'ENABLED' : 'DISABLED'}`);
            });
          }
        });

        videoService.onScreenToggled(({ userId, enabled }) => {
          console.log(`🖥️ User ${userId} ${enabled ? "started" : "stopped"} screen sharing`);
        });

        // Room ended - usar función inline para evitar dependencia circular
        videoService.onRoomEnded(() => {
          console.log("🏁 Room ended");
          // Limpiar recursos directamente
          peersRef.current.forEach((peer) => peer.destroy());
          peersRef.current.clear();
          const stream = useVideoStore.getState().localStream;
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
          }
          setCurrentRoom(null);
          setParticipants([]);
        });

        // Errors
        videoService.onError((err) => {
          console.error("Video service error:", err);
          setError({
            message: err.message,
            code: err.code,
          });
        });

        // También registrar listener directo en el socket para debug
        const socketInstance = videoService.getSocket();
        if (socketInstance) {
          socketInstance.on("video:room:joined", (data: unknown) => {
            console.log("🔍 [SOCKET_DEBUG] Evento video:room:joined recibido directamente en socket:", data);
          });
          
          // Verificar que el listener está registrado
          console.log("✅ [CONNECT] Listeners registrados. Socket ID:", socketInstance.id);
          console.log("✅ [CONNECT] Socket conectado:", socketInstance.connected);
        }
        
        listenersRegisteredRef.current = true;
      }

      // Asegurarse de que el estado esté actualizado si ya estaba conectado
      if (socket.connected) {
        setConnected(true);
        setConnecting(false);
      }

      // Socket connection events
      socket.on("connect", () => {
        console.log("✅ Connected to video service");
        setConnected(true);
        setConnecting(false);
        setError(null);
      });

      socket.on("disconnect", () => {
        console.log("❌ Disconnected from video service");
        setConnected(false);
        setConnecting(false);
      });

      socket.on("connect_error", (err) => {
        console.error("Connection error:", err);
        setConnecting(false);
        setError({
          message: err.message || "Failed to connect",
          code: "CONNECTION_ERROR",
        });
      });
    } catch (err) {
      console.error("Failed to connect:", err);
      connectingRef.current = false;
      setConnecting(false);
      setError({
        message: err instanceof Error ? err.message : "Failed to connect",
        code: "CONNECTION_FAILED",
      });
    }
  }, [
    useGateway,
    setConnecting,
    setError,
    setConnected,
    setCurrentRoom,
    setParticipants,
    createPeerConnection,
    removeRemoteStream,
    setLocalStream,
    getLocalStream,
  ]);

  // Disconnect
  const disconnect = useCallback(() => {
    console.log(`🔌 [DISCONNECT] Desconectando video service...`);
    if (videoServiceRef.current) {
      videoServiceRef.current.disconnect();
      videoServiceRef.current = null;
    }

    // Destroy all peer connections
    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();

    listenersRegisteredRef.current = false;
    reset();
  }, [reset]);


  // Create room
  const createRoom = useCallback(
    async (name: string, description?: string, maxParticipants = 4, visibility: "public" | "private" = "public", createChat = false): Promise<string | null> => {
      if (!videoServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to video service", code: "NOT_CONNECTED" });
        return null;
      }

      // Get local stream first
      await getLocalStream();

      return new Promise((resolve, reject) => {
        const videoService = videoServiceRef.current;
        if (!videoService) {
          reject(new Error("Video service not initialized"));
          return;
        }

        const socket = videoService.getSocket();
        if (!socket) {
          reject(new Error("Socket not available"));
          return;
        }

        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            socket.off("video:room:created", tempListener);
            socket.off("error", errorListener);
            console.error(`❌ [CREATE_ROOM] Timeout esperando creación de sala después de 15 segundos`);
            reject(new Error("Timeout waiting for room creation"));
          }
        }, 15000);

        const tempListener = (room: VideoRoom) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          socket.off("video:room:created", tempListener);
          socket.off("error", errorListener);
          console.log(`✅ [CREATE_ROOM] Sala creada: ${room.id}, código: ${room.code}`);
          // Devolver el código corto en lugar del ID largo para mantener consistencia
          resolve(room.code || room.id);
        };

        const errorListener = (error: { message: string; code?: string }) => {
          if (resolved) return;
          // Solo rechazar si es un error de creación de sala
          if (error.code === "CREATE_ROOM_ERROR" || error.message?.includes("create") || error.message?.includes("room")) {
            resolved = true;
            clearTimeout(timeout);
            socket.off("video:room:created", tempListener);
            socket.off("error", errorListener);
            console.error(`❌ [CREATE_ROOM] Error del servidor:`, error);
            reject(new Error(error.message || "Failed to create room"));
          }
        };

        // Registrar listeners temporales ANTES de crear la sala
        // Usar 'once' para que se ejecute solo una vez y se limpie automáticamente
        socket.once("video:room:created", tempListener);
        socket.once("error", errorListener);

        // Crear la sala
        console.log(`📤 [CREATE_ROOM] Enviando solicitud de creación de sala: ${name} (createChat: ${createChat})`);
        try {
          videoService.createRoom(name, description, maxParticipants, visibility, createChat);
        } catch (err) {
          resolved = true;
          clearTimeout(timeout);
          socket.off("video:room:created", tempListener);
          socket.off("error", errorListener);
          reject(err instanceof Error ? err : new Error("Failed to send create room request"));
        }
      });
    },
    [getLocalStream, setError]
  );

  // Join room
  const joinRoom = useCallback(
    async (roomId: string): Promise<void> => {
      if (joiningRoomRef.current === roomId) {
        console.log(`⏭️ [JOIN_ROOM] Ya se está uniendo a la sala ${roomId}`);
        return;
      }

      if (currentRoom?.id === roomId) {
        console.log(`✅ [JOIN_ROOM] Ya estamos en la sala ${roomId}`);
        return;
      }

      console.log(`🚪 [JOIN_ROOM] Intentando unirse a sala: ${roomId}`);
      joiningRoomRef.current = roomId;
      
      if (!videoServiceRef.current || !videoServiceRef.current.isConnected()) {
        console.warn(`⚠️ [JOIN_ROOM] VideoService no inicializado o no conectado, conectando primero...`);
        
        try {
          await connect();
        } catch (err) {
          console.error(`❌ [JOIN_ROOM] Error conectando:`, err);
          joiningRoomRef.current = null;
          setError({ message: "Failed to connect to video service", code: "CONNECTION_FAILED" });
          return;
        }
        
        let attempts = 0;
        const maxAttempts = 30;
        while ((!videoServiceRef.current || !videoServiceRef.current.isConnected()) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300));
          attempts++;
          if (attempts % 5 === 0) {
            console.log(`⏳ [JOIN_ROOM] Esperando conexión... (${attempts}/${maxAttempts})`);
          }
        }
        
        if (!videoServiceRef.current || !videoServiceRef.current.isConnected()) {
          console.error(`❌ [JOIN_ROOM] No se pudo conectar al servicio de video después de ${attempts} intentos`);
          joiningRoomRef.current = null;
          setError({ message: "Not connected to video service", code: "NOT_CONNECTED" });
          return;
        }
        
        console.log(`✅ [JOIN_ROOM] Conectado exitosamente después de ${attempts} intentos`);
      }

      // Asegurar que los listeners estén registrados
      if (!listenersRegisteredRef.current) {
        console.warn(`⚠️ [JOIN_ROOM] Los listeners no están registrados aún, esto no debería pasar`);
        // Si no están registrados, intentar conectarse de nuevo para registrarlos
        await connect();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Verificar que el socket está conectado y los listeners están registrados
      const socket = videoServiceRef.current.getSocket();
      if (socket) {
        console.log(`🔍 [JOIN_ROOM] Socket ID: ${socket.id}, Conectado: ${socket.connected}`);
        console.log(`🔍 [JOIN_ROOM] Listeners registrados: ${listenersRegisteredRef.current}`);
        
        // Agregar un listener directo SOLO para logging/debugging
        // El callback normal ya maneja toda la lógica
        const debugListener = (data: { roomId: string; room: VideoRoom; participants: VideoParticipant[] }) => {
          console.log(`🔔 [DEBUG_LISTENER] Evento video:room:joined recibido directamente en socket ${socket.id}`);
          
          // Verificar si el callback normal ya procesó el evento después de 1 segundo
          setTimeout(() => {
            const currentRoomState = useVideoStore.getState().currentRoom;
            if (currentRoomState && currentRoomState.id === data.roomId) {
              console.log(`✅ [DEBUG_LISTENER] El callback normal procesó el evento correctamente`);
            } else {
              console.warn(`⚠️ [DEBUG_LISTENER] El callback normal no procesó el evento después de 1 segundo, esto puede indicar un problema`);
            }
          }, 1000);
        };
        
        socket.on("video:room:joined", debugListener);
        
        // Limpiar el debug listener después de 5 segundos (solo para logging)
        setTimeout(() => {
          socket.off("video:room:joined", debugListener);
          console.log(`🧹 [JOIN_ROOM] Debug listener removido`);
          joiningRoomRef.current = null;
        }, 5000);
      } else {
        console.error(`❌ [JOIN_ROOM] Socket no disponible`);
      }

      // Esperar un momento para asegurar que todo está listo
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get local stream first
      console.log(`📹 [JOIN_ROOM] Obteniendo stream local...`);
      await getLocalStream();

      const isCode = roomId.length === 6 && /^[A-Z0-9]+$/.test(roomId);
      console.log(`📤 [JOIN_ROOM] Enviando solicitud de unirse a sala ${roomId} (${isCode ? 'código' : 'ID'})...`);
      videoServiceRef.current.joinRoom(roomId, isCode);
      console.log(`✅ [JOIN_ROOM] Solicitud de unirse enviada. Esperando respuesta del servidor...`);
      
      // Esperar un poco más para ver si llega la respuesta
      setTimeout(() => {
        console.log(`⏰ [JOIN_ROOM] Han pasado 3 segundos desde la solicitud. ¿Llegó el evento video:room:joined?`);
        const currentRoomState = useVideoStore.getState().currentRoom;
        if (currentRoomState) {
          console.log(`✅ [JOIN_ROOM] Sala obtenida: ${currentRoomState.id} - ${currentRoomState.name}`);
        } else {
          console.error(`❌ [JOIN_ROOM] NO se recibió el evento video:room:joined después de 3 segundos`);
        }
      }, 3000);
    },
    [getLocalStream, setError, connect, currentRoom?.id]
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!videoServiceRef.current || !currentRoom) {
      return;
    }

    // Limpiar la marca de sala procesada
    processedRoomsRef.current.delete(currentRoom.id);

    // Destroy all peer connections
    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();

    // Stop local stream
    const stream = useVideoStore.getState().localStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Clear remote streams
    remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    remoteStreams.forEach((_, userId) => removeRemoteStream(userId));

    videoServiceRef.current.leaveRoom(currentRoom.id);
    setCurrentRoom(null);
    setParticipants([]);
  }, [currentRoom, setLocalStream, remoteStreams, removeRemoteStream, setCurrentRoom, setParticipants]);

  // Toggle audio
  const toggleAudio = useCallback(
    async (enabled: boolean) => {
      // Obtener el estado actual del store en tiempo real
      const storeState = useVideoStore.getState();
      const room = storeState.currentRoom;
      
      if (!videoServiceRef.current) {
        console.warn('No se puede toggle audio: servicio no disponible');
        return;
      }
      
      if (!room) {
        console.warn('No se puede toggle audio: sala no disponible aún');
        // Aún así actualizar el estado local para que el botón refleje el cambio
        setAudioEnabled(enabled);
        return;
      }

      let stream = storeState.localStream;
      
      // Si no hay stream y queremos activar, obtenerlo
      if (!stream && enabled) {
        console.log('No hay stream, obteniendo...');
        stream = await getLocalStream();
        if (!stream) {
          console.error('No se pudo obtener stream para activar audio');
          return;
        }
      }

      if (stream) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0 && enabled) {
          // Si no hay audio tracks y queremos activar, obtener nuevo stream
          console.log('No hay audio tracks, obteniendo nuevo stream...');
          stream = await getLocalStream();
          if (!stream) {
            console.error('No se pudo obtener stream con audio');
            return;
          }
        }

        stream.getAudioTracks().forEach((track) => {
          track.enabled = enabled;
          console.log(`🔊 Audio track ${track.id} ${enabled ? 'ENABLED' : 'DISABLED'} - readyState: ${track.readyState}`);
        });

        // Actualizar estado ANTES de notificar al servidor para que la UI se actualice inmediatamente
        setAudioEnabled(enabled);
        
        // Notificar al servidor solo si tenemos room
        try {
          videoServiceRef.current.toggleAudio(room.id, enabled);
        } catch (err) {
          console.error('Error notificando al servidor sobre cambio de audio:', err);
        }
        
        // Los cambios en track.enabled se propagan automáticamente a los peers
        // ya que los tracks están compartidos entre el stream local y los peers
        console.log(`📡 Audio ${enabled ? 'habilitado' : 'deshabilitado'} - se propagará a todos los peers`);
        
        console.log(`✅ Estado de audio actualizado a: ${enabled}`);
      } else {
        console.warn('No hay stream local para toggle audio');
        // Aún así actualizar el estado para que el botón refleje el cambio
        setAudioEnabled(enabled);
      }
    },
    [setAudioEnabled, getLocalStream]
  );

  // Toggle video
  const toggleVideo = useCallback(
    async (enabled: boolean) => {
      // Obtener el estado actual del store en tiempo real
      const storeState = useVideoStore.getState();
      const room = storeState.currentRoom;
      
      if (!videoServiceRef.current) {
        console.warn('No se puede toggle video: servicio no disponible');
        return;
      }
      
      if (!room) {
        console.warn('No se puede toggle video: sala no disponible aún');
        // Aún así actualizar el estado local para que el botón refleje el cambio
        setVideoEnabled(enabled);
        return;
      }

      let stream = storeState.localStream;
      
      // Si no hay stream y queremos activar, obtenerlo
      if (!stream && enabled) {
        console.log('No hay stream, obteniendo...');
        stream = await getLocalStream();
        if (!stream) {
          console.error('No se pudo obtener stream para activar video');
          return;
        }
      }

      if (stream) {
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0 && enabled) {
          // Si no hay video tracks y queremos activar, obtener nuevo stream
          console.log('No hay video tracks, obteniendo nuevo stream...');
          stream = await getLocalStream();
          if (!stream) {
            console.error('No se pudo obtener stream con video');
            return;
          }
        }

        stream.getVideoTracks().forEach((track) => {
          track.enabled = enabled;
          console.log(`📹 Video track ${track.id} ${enabled ? 'ENABLED' : 'DISABLED'} - readyState: ${track.readyState}`);
        });

        // Actualizar estado ANTES de notificar al servidor para que la UI se actualice inmediatamente
        setVideoEnabled(enabled);
        
        // Notificar al servidor solo si tenemos room
        try {
          videoServiceRef.current.toggleVideo(room.id, enabled);
        } catch (err) {
          console.error('Error notificando al servidor sobre cambio de video:', err);
        }
        
        // Los cambios en track.enabled se propagan automáticamente a los peers
        // ya que los tracks están compartidos entre el stream local y los peers
        console.log(`📡 Video ${enabled ? 'habilitado' : 'deshabilitado'} - se propagará a todos los peers`);
        
        console.log(`✅ Estado de video actualizado a: ${enabled}`);
      } else {
        console.warn('No hay stream local para toggle video');
        // Aún así actualizar el estado para que el botón refleje el cambio
        setVideoEnabled(enabled);
      }
    },
    [setVideoEnabled, getLocalStream]
  );

  // Toggle screen share
  const toggleScreenShare = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (!videoServiceRef.current || !currentRoom) {
        return;
      }

      try {
        if (enabled) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });

          const screenVideoTrack = screenStream.getVideoTracks()[0];

          // Replace video track in all peer connections
          peersRef.current.forEach((peer) => {
            const senders = (peer as Peer.Instance & { _pc: RTCPeerConnection })._pc.getSenders();
            const videoSender = senders.find((s: RTCRtpSender) => s.track && s.track.kind === "video");
            if (videoSender) {
              videoSender.replaceTrack(screenVideoTrack);
            }
          });

          screenVideoTrack.onended = () => {
            // Usar función inline para evitar dependencia circular
            const currentStream = useVideoStore.getState().localStream;
            if (currentStream) {
              navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
              }).then((cameraStream) => {
                const cameraVideoTrack = cameraStream.getVideoTracks()[0];
                peersRef.current.forEach((peer) => {
                  const senders = (peer as Peer.Instance & { _pc: RTCPeerConnection })._pc.getSenders();
                  const videoSender = senders.find((s: RTCRtpSender) => s.track && s.track.kind === "video");
                  if (videoSender) {
                    videoSender.replaceTrack(cameraVideoTrack);
                  }
                });
                setScreenSharing(false);
              });
            }
          };

          setScreenSharing(true);
          videoServiceRef.current.toggleScreen(currentRoom.id, true);
        } else {
          // Return to camera
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });

          const cameraVideoTrack = cameraStream.getVideoTracks()[0];

          peersRef.current.forEach((peer) => {
            const senders = (peer as Peer.Instance & { _pc: RTCPeerConnection })._pc.getSenders();
            const videoSender = senders.find((s: RTCRtpSender) => s.track && s.track.kind === "video");
            if (videoSender) {
              videoSender.replaceTrack(cameraVideoTrack);
            }
          });

          const currentStream = useVideoStore.getState().localStream;
          if (currentStream) {
            const oldVideoTrack = currentStream.getVideoTracks()[0];
            currentStream.removeTrack(oldVideoTrack);
            currentStream.addTrack(cameraVideoTrack);
          }

          setScreenSharing(false);
          videoServiceRef.current.toggleScreen(currentRoom.id, false);
        }
      } catch (error) {
        console.error("Error toggling screen share:", error);
        setError({
          message: error instanceof Error ? error.message : "Failed to toggle screen share",
          code: "SCREEN_SHARE_ERROR",
        });
      }
    },
    [currentRoom, setScreenSharing, setError]
  );

  // Cleanup on unmount - Solo desconectar si realmente no hay otros componentes usando el hook
  // No desconectar automáticamente porque puede haber otros componentes que lo usen
  // El cleanup lo manejará cada componente individualmente si es necesario
  // useEffect(() => {
  //   return () => {
  //     disconnect();
  //   };
  // }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    currentRoom,
    participants,
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    getLocalStream,
  };
};

