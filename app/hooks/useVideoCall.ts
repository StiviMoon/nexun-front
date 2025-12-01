"use client";

import { useRef, useCallback } from "react";
import Peer from "simple-peer";
import { VideoService, VideoRoom, VideoParticipant } from "@/utils/services/videoService";
import { useVideoStore } from "@/utils/videoStore";
import { getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "@/config/firebase";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  ],
  iceCandidatePoolSize: 10,
};

const getFirebaseAuth = () => {
  if (typeof window === "undefined") return null;
  const existingApps = getApps();
  const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  return getAuth(app);
};

const getCurrentUserId = (): string | null => {
  if (typeof window === "undefined") return null;
  const auth = getFirebaseAuth();
  return auth?.currentUser?.uid || null;
};

const DEBUG = process.env.NODE_ENV === 'development';

const log = (message: string, ...args: unknown[]) => {
  if (DEBUG) console.log(message, ...args);
};

const logError = (message: string, ...args: unknown[]) => {
  console.error(message, ...args);
};

const handleRemoteStream = (
  stream: MediaStream,
  userId: string,
  addRemoteStream: (userId: string, stream: MediaStream) => void,
  setParticipants: (participants: VideoParticipant[]) => void
) => {
  log(`📹 [handleRemoteStream] Procesando stream remoto de ${userId}`, {
    streamId: stream.id,
    videoTracks: stream.getVideoTracks().length,
    audioTracks: stream.getAudioTracks().length
  });

  // Obtener stream existente o crear uno nuevo
  const existingStream = useVideoStore.getState().remoteStreams.get(userId);
  const streamToUse = existingStream || new MediaStream();
  
  // Agregar todos los tracks del nuevo stream al stream consolidado
  stream.getVideoTracks().forEach(track => {
    // Verificar si el track ya existe en el stream
    const trackExists = streamToUse.getVideoTracks().some(t => t.id === track.id);
    if (!trackExists) {
      streamToUse.addTrack(track);
      log(`📹 [handleRemoteStream] Video track ${track.id} agregado al stream de ${userId}`);
    }
    
    // Asegurar que el track esté habilitado
    if (track.readyState === 'live' && !track.enabled) {
      log(`🔄 [handleRemoteStream] Habilitando video track ${track.id} de ${userId}`);
      track.enabled = true;
    }
    
    log(`📹 [handleRemoteStream] Video track ${track.id} estado:`, {
      enabled: track.enabled,
      readyState: track.readyState,
      muted: track.muted,
      kind: track.kind
    });
  });
  
  stream.getAudioTracks().forEach(track => {
    const trackExists = streamToUse.getAudioTracks().some(t => t.id === track.id);
    if (!trackExists) {
      streamToUse.addTrack(track);
      log(`🔊 [handleRemoteStream] Audio track ${track.id} agregado al stream de ${userId}`);
    }
    
    if (track.readyState === 'live' && !track.enabled) {
      log(`🔄 [handleRemoteStream] Habilitando audio track ${track.id} de ${userId}`);
      track.enabled = true;
    }
  });

  // Agregar el stream consolidado al store
  addRemoteStream(userId, streamToUse);
  log(`✅ [handleRemoteStream] Stream de ${userId} agregado al store`, {
    totalVideoTracks: streamToUse.getVideoTracks().length,
    totalAudioTracks: streamToUse.getAudioTracks().length
  });

  const currentParticipants = useVideoStore.getState().participants;
  const safeParticipants = Array.isArray(currentParticipants) ? currentParticipants : [];
  const exists = safeParticipants.some(p => p.userId === userId);

  const hasVideo = streamToUse.getVideoTracks().length > 0 && 
                   streamToUse.getVideoTracks().some(t => t.enabled && t.readyState === 'live');
  const hasAudio = streamToUse.getAudioTracks().length > 0 && 
                   streamToUse.getAudioTracks().some(t => t.enabled && t.readyState === 'live');

  if (!exists) {
    const newParticipant: VideoParticipant = {
      userId,
      socketId: '',
      isAudioEnabled: hasAudio,
      isVideoEnabled: hasVideo,
      isScreenSharing: false,
      joinedAt: new Date(),
    };
    setParticipants([...safeParticipants, newParticipant]);
    log(`👤 [handleRemoteStream] Nuevo participante ${userId} agregado`);
  } else {
    setParticipants(safeParticipants.map(p =>
      p.userId === userId
        ? { ...p, isAudioEnabled: hasAudio, isVideoEnabled: hasVideo }
        : p
    ));
    log(`🔄 [handleRemoteStream] Participante ${userId} actualizado`);
  }
};

interface UseVideoCallReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: { message: string; code?: string } | null;
  currentRoom: VideoRoom | null;
  participants: VideoParticipant[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
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
  const processedRoomsRef = useRef<Set<string>>(new Set());

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

  const getLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const currentStream = useVideoStore.getState().localStream;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      const audioEnabled = useVideoStore.getState().isAudioEnabled;
      const videoEnabled = useVideoStore.getState().isVideoEnabled;

      stream.getAudioTracks().forEach((track) => { track.enabled = audioEnabled; });
      stream.getVideoTracks().forEach((track) => { track.enabled = videoEnabled; });

      setLocalStream(stream);
      return stream;
    } catch (error) {
      logError("Error getting local stream:", error);
      setError({
        message: error instanceof Error ? error.message : "Failed to access camera/microphone",
        code: "MEDIA_ACCESS_ERROR",
      });
      return null;
    }
  }, [setLocalStream, setError]);

  const addTracksToPeer = (peer: Peer.Instance, stream: MediaStream) => {
    const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
    if (!pc) return;

    const existingSenders = pc.getSenders();
    const existingTrackIds = new Set(existingSenders.map(s => s.track?.id).filter(Boolean));

    stream.getTracks().forEach(track => {
      if (!existingTrackIds.has(track.id)) {
        try {
          pc.addTrack(track, stream);
          log(`Track ${track.kind} agregado al peer`);
        } catch (err) {
          logError(`Error agregando track ${track.kind}:`, err);
        }
      }
    });
  };

  const createPeerConnection = useCallback(
    async (targetUserId: string, initiator: boolean): Promise<Peer.Instance> => {
      const storeState = useVideoStore.getState();
      const currentStream = storeState.localStream;
      const room = storeState.currentRoom;

      if (!currentStream) throw new Error("No stream available");
      if (!room) throw new Error("No room available");

      const existingPeer = peersRef.current.get(targetUserId);
      if (existingPeer) return existingPeer;

      log(`Creando peer con ${targetUserId} (initiator: ${initiator})`);

      const peer = new Peer({
        initiator,
        trickle: false,
        config: ICE_SERVERS,
        offerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: true },
        answerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: true },
      });

      addTracksToPeer(peer, currentStream);
      setTimeout(() => addTracksToPeer(peer, currentStream), 50);

      peersRef.current.set(targetUserId, peer);

      peer.on("connect", () => {
        log(`✅ Conexión WebRTC establecida con ${targetUserId}`);
        const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
        if (!pc) {
          logError(`❌ No hay RTCPeerConnection disponible para ${targetUserId}`);
          return;
        }

        log(`📡 [Peer Connect] Revisando receivers para ${targetUserId}`);
        const receivers = pc.getReceivers();
        log(`📡 [Peer Connect] Total receivers: ${receivers.length}`);
        
        // Verificar estado de la conexión
        log(`📡 [Peer Connect] Estado de conexión:`, {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          signalingState: pc.signalingState
        });
        
        receivers.forEach((receiver, idx) => {
          if (receiver.track) {
            log(`📡 [Peer Connect] Receiver ${idx} track:`, {
              id: receiver.track.id,
              kind: receiver.track.kind,
              enabled: receiver.track.enabled,
              readyState: receiver.track.readyState,
              muted: receiver.track.muted
            });
            
            if (receiver.track.readyState === 'live') {
              const existingStream = useVideoStore.getState().remoteStreams.get(targetUserId);
              const streamToUse = existingStream || new MediaStream();
              const trackExists = streamToUse.getTracks().some(t => t.id === receiver.track!.id);
              
              if (!trackExists) {
                streamToUse.addTrack(receiver.track);
                log(`✅ [Peer Connect] Track ${receiver.track.kind} ${receiver.track.id} agregado al stream de ${targetUserId}`);
                
                // Asegurar que el track esté habilitado
                if (!receiver.track.enabled) {
                  receiver.track.enabled = true;
                  log(`🔄 [Peer Connect] Track ${receiver.track.id} habilitado`);
                }
                
                addRemoteStream(targetUserId, streamToUse);
              }
            } else {
              // Si el track no está live, esperar a que lo esté
              const handleStateChange = () => {
                if (receiver.track && receiver.track.readyState === 'live') {
                  log(`📹 [Peer Connect] Track ${receiver.track.id} ahora está live`);
                  const existingStream = useVideoStore.getState().remoteStreams.get(targetUserId);
                  const streamToUse = existingStream || new MediaStream();
                  const trackExists = streamToUse.getTracks().some(t => t.id === receiver.track!.id);
                  
                  if (!trackExists) {
                    streamToUse.addTrack(receiver.track);
                    if (!receiver.track.enabled) {
                      receiver.track.enabled = true;
                    }
                    addRemoteStream(targetUserId, streamToUse);
                  }
                  
                  receiver.track.removeEventListener('ended', handleStateChange);
                }
              };
              
              receiver.track.addEventListener('ended', handleStateChange);
            }
          }
        });

        // Agregar listener para nuevos tracks (esto es crítico para recibir tracks)
        const trackHandler = (event: RTCTrackEvent) => {
          log(`📹 [Peer Connect] Nuevo track recibido de ${targetUserId}:`, {
            trackId: event.track.id,
            kind: event.track.kind,
            enabled: event.track.enabled,
            readyState: event.track.readyState,
            streamsCount: event.streams.length
          });
          
          // Asegurar que el track esté habilitado inmediatamente
          if (event.track.readyState === 'live' && !event.track.enabled) {
            event.track.enabled = true;
            log(`🔄 [Peer Connect] Track ${event.track.id} habilitado en trackHandler`);
          }
          
          if (event.streams && event.streams.length > 0) {
            handleRemoteStream(event.streams[0], targetUserId, addRemoteStream, setParticipants);
          } else {
            const existingStream = useVideoStore.getState().remoteStreams.get(targetUserId);
            const streamToUse = existingStream || new MediaStream();
            const trackExists = streamToUse.getTracks().some(t => t.id === event.track.id);
            
            if (!trackExists) {
              streamToUse.addTrack(event.track);
              if (!event.track.enabled && event.track.readyState === 'live') {
                event.track.enabled = true;
                log(`🔄 [Peer Connect] Track ${event.track.id} habilitado en trackHandler (sin streams)`);
              }
              handleRemoteStream(streamToUse, targetUserId, addRemoteStream, setParticipants);
            }
          }
        };
        
        // Remover listener anterior si existe para evitar duplicados
        pc.removeEventListener('track', trackHandler);
        pc.addEventListener('track', trackHandler);
      });

      peer.on("signal", (data) => {
        const videoService = videoServiceRef.current;
        const currentRoom = useVideoStore.getState().currentRoom;
        if (!videoService || !currentRoom) return;

        const signalType = initiator ? "offer" : "answer";
        try {
          videoService.sendSignal({ type: signalType, roomId: currentRoom.id, targetUserId, data });
          log(`Señal ${signalType} enviada a ${targetUserId}`);
        } catch (err) {
          logError(`Error enviando señal ${signalType}:`, err);
        }
      });

      // Configurar ontrack directamente en RTCPeerConnection como respaldo
      const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
      if (pc) {
        // Remover handler anterior si existe
        pc.ontrack = null;
        
        pc.ontrack = (event) => {
          log(`📹 [ontrack] Track recibido de ${targetUserId}:`, {
            trackId: event.track.id,
            kind: event.track.kind,
            enabled: event.track.enabled,
            readyState: event.track.readyState,
            streamsCount: event.streams.length
          });
          
          // Asegurar que el track esté habilitado inmediatamente
          if (event.track.readyState === 'live' && !event.track.enabled) {
            event.track.enabled = true;
            log(`🔄 [ontrack] Track ${event.track.id} habilitado`);
          }
          
          if (event.streams && event.streams.length > 0) {
            handleRemoteStream(event.streams[0], targetUserId, addRemoteStream, setParticipants);
          } else {
            const existingStream = useVideoStore.getState().remoteStreams.get(targetUserId);
            const streamToUse = existingStream || new MediaStream();
            const trackExists = streamToUse.getTracks().some(t => t.id === event.track.id);
            
            if (!trackExists) {
              streamToUse.addTrack(event.track);
              if (!event.track.enabled && event.track.readyState === 'live') {
                event.track.enabled = true;
                log(`🔄 [ontrack] Track ${event.track.id} habilitado (sin streams)`);
              }
              handleRemoteStream(streamToUse, targetUserId, addRemoteStream, setParticipants);
            }
          }
        };
        
        // También agregar listener de eventos de conexión para debugging
        pc.addEventListener('connectionstatechange', () => {
          log(`📡 [Peer] Estado de conexión cambió para ${targetUserId}:`, {
            connectionState: pc.connectionState,
            iceConnectionState: pc.iceConnectionState
          });
        });
        
        pc.addEventListener('iceconnectionstatechange', () => {
          log(`🧊 [Peer] Estado ICE cambió para ${targetUserId}:`, {
            iceConnectionState: pc.iceConnectionState,
            connectionState: pc.connectionState
          });
        });
      }

      peer.on("stream", (remoteStream) => {
        log(`📹 [peer.on("stream")] Stream recibido de ${targetUserId}:`, {
          streamId: remoteStream.id,
          videoTracks: remoteStream.getVideoTracks().length,
          audioTracks: remoteStream.getAudioTracks().length
        });
        handleRemoteStream(remoteStream, targetUserId, addRemoteStream, setParticipants);
      });

      peer.on("error", (err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logError(`Error en peer connection con ${targetUserId}:`, err);
        
        // No destruir el peer si es un error de conexión temporal
        // Los errores de conexión pueden ser temporales y el peer puede recuperarse
        if (errorMessage.includes('Connection failed') || errorMessage.includes('ICE')) {
          log(`⚠️ [Peer Error] Error de conexión temporal con ${targetUserId}, intentando recuperar...`);
          return;
        }
        
        // Para otros errores, limpiar el peer
        const peer = peersRef.current.get(targetUserId);
        if (peer) {
          peer.destroy();
          peersRef.current.delete(targetUserId);
          removeRemoteStream(targetUserId);
        }
      });

      peer.on("close", () => {
        peersRef.current.delete(targetUserId);
        removeRemoteStream(targetUserId);
      });

      return peer;
    },
    [addRemoteStream, removeRemoteStream, setParticipants]
  );

  const connect = useCallback(async () => {
    if (videoServiceRef.current?.isConnected()) {
      setConnecting(false);
      setConnected(true);
      return;
    }

    if (connectingRef.current) return;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setConnecting(false);
      setError({ message: "Usuario no autenticado. Por favor inicia sesión.", code: "NOT_AUTHENTICATED" });
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
        videoService.onRoomCreated((room) => {
          log(`Room created: ${room.id}, chatRoomId: ${room.chatRoomId || 'none'}`);
          setCurrentRoom(room);
        });

        videoService.onRoomJoined(async ({ room, participants: roomParticipants }) => {
          log(`Room joined: ${room.id}, chatRoomId: ${room.chatRoomId || 'none'}, chatRoomCode: ${room.chatRoomCode || 'none'}`);
          log(`Participantes recibidos del backend: ${roomParticipants.length}`);
          
          setCurrentRoom(room);
          setParticipants(roomParticipants);

          let currentStream = useVideoStore.getState().localStream;
          if (!currentStream) {
            currentStream = await getLocalStream();
            if (!currentStream) return;
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          
          log(`Sala ${room.id} inicializada correctamente con ${roomParticipants.length} participantes`);
        });

        videoService.onUserJoined(async ({ userId, userName }) => {
          const currentUserId = getCurrentUserId();
          if (userId === currentUserId) {
            log(`Ignorando evento de usuario propio: ${userId}`);
            return;
          }

          log(`Usuario ${userId} se unió a la sala${userName ? ` (${userName})` : ''}`);

          const currentParticipants = useVideoStore.getState().participants;
          const safeParticipants = Array.isArray(currentParticipants) ? currentParticipants : [];
          const participantExists = safeParticipants.some(p => p.userId === userId);

          if (!participantExists) {
            const newParticipant: VideoParticipant = {
              userId,
              socketId: '',
              userName: userName || undefined,
              isAudioEnabled: true,
              isVideoEnabled: true,
              isScreenSharing: false,
              joinedAt: new Date(),
            };
            const updatedParticipants = [...safeParticipants, newParticipant];
            setParticipants(updatedParticipants);
            log(`Participante ${userId} agregado. Total participantes: ${updatedParticipants.length}`);
          } else {
            log(`Participante ${userId} ya existe en la lista`);
          }

          if (peersRef.current.has(userId)) {
            const existingPeer = peersRef.current.get(userId);
            if (existingPeer && !existingPeer.destroyed) return;
            peersRef.current.delete(userId);
          }

          const currentStream = useVideoStore.getState().localStream;
          if (!currentStream) {
            await getLocalStream();
            const newStream = useVideoStore.getState().localStream;
            if (!newStream) return;
          }

          try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const peer = await createPeerConnection(userId, true);
            if (peer && !peer.destroyed) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (err) {
            logError(`Error creando peer con ${userId}:`, err);
          }
        });

        videoService.onUserLeft(({ userId }) => {
          log(`Usuario ${userId} se salió de la sala`);
          
          // Limpiar peer connection
          const peer = peersRef.current.get(userId);
          if (peer) {
            peer.destroy();
            peersRef.current.delete(userId);
          }
          
          // Eliminar stream remoto
          removeRemoteStream(userId);
          
          // Actualizar lista de participantes - eliminar del store
          const currentParticipants = useVideoStore.getState().participants;
          const safeParticipants = Array.isArray(currentParticipants) ? currentParticipants : [];
          const updatedParticipants = safeParticipants.filter(p => p.userId !== userId);
          setParticipants(updatedParticipants);
          
          log(`Participante ${userId} eliminado. Total participantes: ${updatedParticipants.length}`);
        });

        videoService.onSignal(async ({ type, fromUserId, data }) => {
          let peer = peersRef.current.get(fromUserId);

          if (!peer && type === "offer") {
            const storeState = useVideoStore.getState();
            const currentStream = storeState.localStream;

            if (currentStream) {
              if (peersRef.current.has(fromUserId)) {
                const oldPeer = peersRef.current.get(fromUserId);
                if (oldPeer && !oldPeer.destroyed) oldPeer.destroy();
                peersRef.current.delete(fromUserId);
              }

              try {
                peer = await createPeerConnection(fromUserId, false);
                await new Promise(resolve => setTimeout(resolve, 150));

                if (peer && !peer.destroyed) {
                  const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
                  if (pc && pc.signalingState !== 'stable') {
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                  peer.signal(data as Peer.SignalData);
                }
              } catch (err) {
                logError(`Error creando peer con ${fromUserId}:`, err);
                if (peer && !peer.destroyed) {
                  peer.destroy();
                }
                peersRef.current.delete(fromUserId);
              }
            }
            return;
          }

          if (peer?.destroyed && type === "offer") {
            peersRef.current.delete(fromUserId);
            const storeState = useVideoStore.getState();
            const currentStream = storeState.localStream;
            if (currentStream) {
              try {
                const newPeer = await createPeerConnection(fromUserId, false);
                await new Promise(resolve => setTimeout(resolve, 100));
                if (newPeer && !newPeer.destroyed) {
                  newPeer.signal(data as Peer.SignalData);
                }
              } catch (err) {
                logError(`Error recreando peer con ${fromUserId}:`, err);
              }
            }
            return;
          }

          if (peer) {
            try {
              const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
              if (pc) {
                const state = pc.signalingState;
                if (state === 'stable' || 
                    (state === 'have-local-offer' && type === 'offer') ||
                    (state === 'have-remote-offer' && type === 'answer') ||
                    (state === 'have-local-offer' && type === 'answer')) {
                  return;
              }
            }
            peer.signal(data as Peer.SignalData);
          } catch (err) {
            if (err instanceof Error && (err.message.includes('wrong state') || err.message.includes('InvalidStateError'))) {
              return;
            }
            logError(`Error procesando señal ${type}:`, err);
          }
        }
      });

        videoService.onAudioToggled(({ userId, enabled }) => {
          log(`Usuario ${userId} ${enabled ? 'habilitó' : 'deshabilitó'} audio`);
          
          const currentParticipants = useVideoStore.getState().participants;
          if (Array.isArray(currentParticipants)) {
            const updatedParticipants = currentParticipants.map((p) =>
              p.userId === userId ? { ...p, isAudioEnabled: enabled } : p
            );
            setParticipants(updatedParticipants);
          }

          const remoteStream = useVideoStore.getState().remoteStreams.get(userId);
          if (remoteStream) {
            remoteStream.getAudioTracks().forEach((track) => { 
              track.enabled = enabled;
              log(`Audio track ${track.id} de ${userId} ${enabled ? 'habilitado' : 'deshabilitado'}`);
            });
          }
        });

        videoService.onVideoToggled(({ userId, enabled }) => {
          log(`Usuario ${userId} ${enabled ? 'habilitó' : 'deshabilitó'} video`);
          
          const currentParticipants = useVideoStore.getState().participants;
          if (Array.isArray(currentParticipants)) {
            const updatedParticipants = currentParticipants.map((p) =>
              p.userId === userId ? { ...p, isVideoEnabled: enabled } : p
            );
            setParticipants(updatedParticipants);
          }

          const remoteStream = useVideoStore.getState().remoteStreams.get(userId);
          if (remoteStream) {
            remoteStream.getVideoTracks().forEach((track) => { 
              track.enabled = enabled;
              log(`Video track ${track.id} de ${userId} ${enabled ? 'habilitado' : 'deshabilitado'}`);
            });
          }
        });

        videoService.onScreenToggled(() => {});

        videoService.onRoomEnded(() => {
          log(`La sala ha sido finalizada por el host`);
          
          // Limpiar todos los peers
          peersRef.current.forEach((peer) => peer.destroy());
          peersRef.current.clear();
          
          // Detener stream local
          const stream = useVideoStore.getState().localStream;
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
          }
          
          // Limpiar streams remotos
          const remoteStreams = useVideoStore.getState().remoteStreams;
          remoteStreams.forEach((stream) => {
            stream.getTracks().forEach((track) => track.stop());
          });
          remoteStreams.forEach((_, userId) => removeRemoteStream(userId));
          
          // Limpiar estado
          setCurrentRoom(null);
          setParticipants([]);
          
          log(`Sala finalizada - estado limpiado`);
        });

        videoService.onError((err) => {
          logError("Video service error:", err);
          setError({ message: err.message, code: err.code });
        });

        listenersRegisteredRef.current = true;
      }

      if (socket.connected) {
        setConnected(true);
        setConnecting(false);
      }

      socket.on("connect", () => {
        setConnected(true);
        setConnecting(false);
        setError(null);
      });

      socket.on("disconnect", () => {
        setConnected(false);
        setConnecting(false);
      });

      socket.on("connect_error", (err) => {
        logError("Socket connection error:", err);
        setConnecting(false);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError({ 
          message: errorMessage || "Error de conexión. Verifica que el servicio esté corriendo.", 
          code: "CONNECTION_ERROR" 
        });
      });
    } catch (err) {
      logError("Failed to connect:", err);
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

  const disconnect = useCallback(() => {
    if (videoServiceRef.current) {
      videoServiceRef.current.disconnect();
      videoServiceRef.current = null;
    }
    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();
    listenersRegisteredRef.current = false;
    reset();
  }, [reset]);

  const createRoom = useCallback(
    async (name: string, description?: string, maxParticipants = 10, visibility: "public" | "private" = "public", createChat = false): Promise<string | null> => {
      if (!videoServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to video service", code: "NOT_CONNECTED" });
        return null;
      }

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
            reject(new Error("Timeout waiting for room creation"));
          }
        }, 15000);

        const tempListener = (room: VideoRoom) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          socket.off("video:room:created", tempListener);
          socket.off("error", errorListener);
          resolve(room.code || room.id);
        };

        const errorListener = (error: { message: string; code?: string }) => {
          if (resolved) return;
          if (error.code === "CREATE_ROOM_ERROR" || error.message?.includes("create") || error.message?.includes("room")) {
            resolved = true;
            clearTimeout(timeout);
            socket.off("video:room:created", tempListener);
            socket.off("error", errorListener);
            reject(new Error(error.message || "Failed to create room"));
          }
        };

        socket.once("video:room:created", tempListener);
        socket.once("error", errorListener);

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

  const joinRoom = useCallback(
    async (roomId: string): Promise<void> => {
      if (joiningRoomRef.current === roomId) return;
      if (currentRoom?.id === roomId) return;

      joiningRoomRef.current = roomId;

      if (!videoServiceRef.current || !videoServiceRef.current.isConnected()) {
        try {
          await connect();
        } catch {
          joiningRoomRef.current = null;
          setError({ message: "Failed to connect to video service", code: "CONNECTION_FAILED" });
          return;
        }

        let attempts = 0;
        const maxAttempts = 30;
        while ((!videoServiceRef.current || !videoServiceRef.current.isConnected()) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300));
          attempts++;
        }

        if (!videoServiceRef.current || !videoServiceRef.current.isConnected()) {
          joiningRoomRef.current = null;
          setError({ message: "Not connected to video service", code: "NOT_CONNECTED" });
          return;
        }
      }

      if (!listenersRegisteredRef.current) {
        await connect();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      await getLocalStream();

      const isCode = roomId.length === 6 && /^[A-Z0-9]+$/.test(roomId);
      videoServiceRef.current.joinRoom(roomId, isCode);
      joiningRoomRef.current = null;
    },
    [getLocalStream, setError, connect, currentRoom?.id]
  );

  const leaveRoom = useCallback(() => {
    if (!videoServiceRef.current || !currentRoom) return;

    processedRoomsRef.current.delete(currentRoom.id);
    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();

    const stream = useVideoStore.getState().localStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    remoteStreams.forEach((_, userId) => removeRemoteStream(userId));

    videoServiceRef.current.leaveRoom(currentRoom.id);
    setCurrentRoom(null);
    setParticipants([]);
  }, [currentRoom, setLocalStream, remoteStreams, removeRemoteStream, setCurrentRoom, setParticipants]);

  const toggleAudio = useCallback(
    async (enabled: boolean) => {
      const storeState = useVideoStore.getState();
      const room = storeState.currentRoom;

      if (!videoServiceRef.current) {
        setAudioEnabled(enabled);
        return;
      }

      if (!room) {
        setAudioEnabled(enabled);
        return;
      }

      let stream = storeState.localStream;

      if (!stream && enabled) {
        stream = await getLocalStream();
        if (!stream) return;
      }

      if (stream) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0 && enabled) {
          stream = await getLocalStream();
          if (!stream) return;
        }

        stream.getAudioTracks().forEach((track) => { track.enabled = enabled; });
        setAudioEnabled(enabled);

        try {
          videoServiceRef.current.toggleAudio(room.id, enabled);
        } catch (err) {
          logError('Error notificando cambio de audio:', err);
        }

        peersRef.current.forEach((peer) => {
          const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
          if (pc) {
            const senders = pc.getSenders();
            const audioSenders = senders.filter((s: RTCRtpSender) => s.track && s.track.kind === 'audio');
            audioSenders.forEach((sender: RTCRtpSender) => {
              if (sender.track) sender.track.enabled = enabled;
            });
          }
        });
      } else {
        setAudioEnabled(enabled);
      }
    },
    [setAudioEnabled, getLocalStream]
  );

  const toggleVideo = useCallback(
    async (enabled: boolean) => {
      const storeState = useVideoStore.getState();
      const room = storeState.currentRoom;

      if (!videoServiceRef.current) {
        setVideoEnabled(enabled);
        return;
      }

      if (!room) {
        setVideoEnabled(enabled);
        return;
      }

      let stream = storeState.localStream;

      if (!stream && enabled) {
        stream = await getLocalStream();
        if (!stream) return;
      }

      if (stream) {
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0 && enabled) {
          stream = await getLocalStream();
          if (!stream) return;
        }

        stream.getVideoTracks().forEach((track) => { track.enabled = enabled; });
        setVideoEnabled(enabled);

        try {
          videoServiceRef.current.toggleVideo(room.id, enabled);
        } catch (err) {
          logError('Error notificando cambio de video:', err);
        }

        peersRef.current.forEach((peer) => {
          const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
          if (pc) {
            const senders = pc.getSenders();
            const videoSenders = senders.filter((s: RTCRtpSender) => s.track && s.track.kind === 'video');
            videoSenders.forEach((sender: RTCRtpSender) => {
              if (sender.track) sender.track.enabled = enabled;
            });
          }
        });
      } else {
        setVideoEnabled(enabled);
      }
    },
    [setVideoEnabled, getLocalStream]
  );

  const toggleScreenShare = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (!videoServiceRef.current || !currentRoom) return;

      try {
        if (enabled) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          const screenVideoTrack = screenStream.getVideoTracks()[0];

          peersRef.current.forEach((peer) => {
            const senders = (peer as Peer.Instance & { _pc: RTCPeerConnection })._pc.getSenders();
            const videoSender = senders.find((s: RTCRtpSender) => s.track && s.track.kind === "video");
            if (videoSender) {
              videoSender.replaceTrack(screenVideoTrack);
            }
          });

          screenVideoTrack.onended = () => {
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
        logError("Error toggling screen share:", error);
        setError({
          message: error instanceof Error ? error.message : "Failed to toggle screen share",
          code: "SCREEN_SHARE_ERROR",
        });
      }
    },
    [currentRoom, setScreenSharing, setError]
  );

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

