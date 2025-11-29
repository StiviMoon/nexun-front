'use client';

import { useRef, useCallback } from "react";
import Peer from "simple-peer";
import { VideoService, VideoRoom, VideoParticipant } from "@/utils/services/videoService";
import { useVideoStore } from "@/utils/videoStore";
import { getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "@/config/firebase";

// CONFIGURACIÓN MEJORADA DE ICE SERVERS
// MEJORAR la configuración de ICE_SERVERS en tu useVideoCall.ts
const ICE_SERVERS = {
  iceServers: [
    // STUN servers - mejores opciones
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    { urls: "stun:stun.voipbuster.com:3478" },
    
    // TURN servers - más confiables
    { 
      urls: "turn:relay1.expressturn.com:3478",
      username: "efFgQHrcyVrUMwTzMA",
      credential: "9YRDXbYjT6B2T5Qb"
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject", 
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject", 
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject", 
      credential: "openrelayproject"
    }
  ],
  iceCandidatePoolSize: 15, // Aumentar pool
  iceTransportPolicy: 'all' // Probar ambos: relay y host
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

  const existingStream = useVideoStore.getState().remoteStreams.get(userId);
  const streamToUse = existingStream || new MediaStream();

  stream.getVideoTracks().forEach(track => {
    if (!streamToUse.getVideoTracks().some(t => t.id === track.id)) {
      streamToUse.addTrack(track);
      log(`📹 [handleRemoteStream] Video track ${track.id} agregado al stream de ${userId}`);
    }
    if (track.readyState === 'live' && !track.enabled) {
      track.enabled = true;
    }
  });

  stream.getAudioTracks().forEach(track => {
    if (!streamToUse.getAudioTracks().some(t => t.id === track.id)) {
      streamToUse.addTrack(track);
      log(`🔊 [handleRemoteStream] Audio track ${track.id} agregado al stream de ${userId}`);
    }
    if (track.readyState === 'live' && !track.enabled) {
      track.enabled = true;
    }
  });

  addRemoteStream(userId, streamToUse);

  const currentParticipants = useVideoStore.getState().participants || [];
  const exists = currentParticipants.some(p => p.userId === userId);

  const hasVideo = streamToUse.getVideoTracks().some(t => t.enabled && t.readyState === 'live');
  const hasAudio = streamToUse.getAudioTracks().some(t => t.enabled && t.readyState === 'live');

  if (!exists) {
    const newParticipant: VideoParticipant = {
      userId,
      socketId: '',
      isAudioEnabled: hasAudio,
      isVideoEnabled: hasVideo,
      isScreenSharing: false,
      joinedAt: new Date(),
    };
    setParticipants([...currentParticipants, newParticipant]);
  } else {
    setParticipants(currentParticipants.map(p =>
      p.userId === userId
        ? { ...p, isAudioEnabled: hasAudio, isVideoEnabled: hasVideo }
        : p
    ));
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
  reconnectPeer: (userId: string) => Promise<void>;
}

export const useVideoCall = (useGateway = false): UseVideoCallReturn => {
  const videoServiceRef = useRef<VideoService | null>(null);
  const peersRef = useRef<Map<string, Peer.Instance>>(new Map());
  const listenersRegisteredRef = useRef(false);
  const connectingRef = useRef(false);
  const joiningRoomRef = useRef<string | null>(null);
  const pendingSignalsRef = useRef<Map<string, Array<{type: string, data: any}>>>(new Map());
  const connectionAttemptsRef = useRef<Map<string, number>>(new Map());

  const isConnected = useVideoStore((s) => s.isConnected);
  const isConnecting = useVideoStore((s) => s.isConnecting);
  const error = useVideoStore((s) => s.error);
  const currentRoom = useVideoStore((s) => s.currentRoom);
  const participants = useVideoStore((s) => s.participants);
  const localStream = useVideoStore((s) => s.localStream);
  const remoteStreams = useVideoStore((s) => s.remoteStreams);
  const isAudioEnabled = useVideoStore((s) => s.isAudioEnabled);
  const isVideoEnabled = useVideoStore((s) => s.isVideoEnabled);
  const isScreenSharing = useVideoStore((s) => s.isScreenSharing);

  const setConnected = useVideoStore((s) => s.setConnected);
  const setConnecting = useVideoStore((s) => s.setConnecting);
  const setError = useVideoStore((s) => s.setError);
  const setCurrentRoom = useVideoStore((s) => s.setCurrentRoom);
  const setParticipants = useVideoStore((s) => s.setParticipants);
  const setLocalStream = useVideoStore((s) => s.setLocalStream);
  const setAudioEnabled = useVideoStore((s) => s.setAudioEnabled);
  const setVideoEnabled = useVideoStore((s) => s.setVideoEnabled);
  const setScreenSharing = useVideoStore((s) => s.setScreenSharing);
  const addRemoteStream = useVideoStore((s) => s.addRemoteStream);
  const removeRemoteStream = useVideoStore((s) => s.removeRemoteStream);
  const reset = useVideoStore((s) => s.reset);

  /**
   * getLocalStream
   */
  const getLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const existing = useVideoStore.getState().localStream;
      if (existing) {
        existing.getAudioTracks().forEach(t => { t.enabled = useVideoStore.getState().isAudioEnabled; });
        existing.getVideoTracks().forEach(t => { t.enabled = useVideoStore.getState().isVideoEnabled; });
        setLocalStream(existing);
        return existing;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      const audioEnabled = useVideoStore.getState().isAudioEnabled;
      const videoEnabled = useVideoStore.getState().isVideoEnabled;
      stream.getAudioTracks().forEach((t) => { t.enabled = audioEnabled; });
      stream.getVideoTracks().forEach((t) => { t.enabled = videoEnabled; });

      setLocalStream(stream);
      return stream;
    } catch (err) {
      logError("Error getting local stream:", err);
      setError({
        message: err instanceof Error ? err.message : "Failed to access camera/microphone",
        code: "MEDIA_ACCESS_ERROR",
      });
      return null;
    }
  }, [setLocalStream, setError]);

  /**
   * addTracksToPeer
   */
  const addTracksToPeer = useCallback((peer: Peer.Instance, stream: MediaStream) => {
    try {
      const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
      if (!pc) return;

      const existingSenders = pc.getSenders();

      stream.getTracks().forEach(track => {
        const sender = existingSenders.find(s => s.track && s.track.kind === track.kind);
        if (sender && sender.replaceTrack) {
          try {
            sender.replaceTrack(track);
            log(`🔄 replaceTrack ${track.kind} -> ${track.id}`);
          } catch (err) {
            try {
              pc.addTrack(track, stream);
              log(`➕ addTrack fallback ${track.kind} -> ${track.id}`);
            } catch (e) {
              logError('Error adding track fallback:', e);
            }
          }
        } else {
          try {
            pc.addTrack(track, stream);
            log(`➕ addTrack ${track.kind} -> ${track.id}`);
          } catch (err) {
            logError('Error adding track:', err);
          }
        }
      });
    } catch (err) {
      logError('addTracksToPeer error:', err);
    }
  }, []);

  /**
   * Procesar señales pendientes
   */
  const processPendingSignals = useCallback((userId: string, peer: Peer.Instance) => {
    const pending = pendingSignalsRef.current.get(userId);
    if (pending && pending.length > 0) {
      log(`📶 Procesando ${pending.length} señales pendientes para ${userId}`);
      pending.forEach(({ type, data }) => {
        try {
          peer.signal(data);
          log(`✅ Señal ${type} pendiente procesada para ${userId}`);
        } catch (err) {
          logError(`Error procesando señal ${type} pendiente:`, err);
        }
      });
      pendingSignalsRef.current.delete(userId);
    }
  }, []);

  /**
   * CORREGIDO: createPeerConnection definida antes de reconnectPeer
   */
  const createPeerConnection = useCallback(
    async (targetUserId: string, initiator: boolean): Promise<Peer.Instance> => {
      const existingPeer = peersRef.current.get(targetUserId);
      if (existingPeer) {
        log(`⚠️ Peer ya existe para ${targetUserId}, retornando existente`);
        return existingPeer;
      }

      const storeState = useVideoStore.getState();
      let currentStream = storeState.localStream;
      const room = storeState.currentRoom;

      if (!room) throw new Error("No room available");

      if (!currentStream || currentStream.getVideoTracks().length === 0 && storeState.isVideoEnabled) {
        currentStream = await getLocalStream();
        if (!currentStream) {
          log(`⚠️ Creando peer sin stream local para ${targetUserId}`);
        }
      }

      log(`Creando peer con ${targetUserId} (initiator: ${initiator})`);

      const peer = new Peer({
        initiator,
        trickle: true,
        config: ICE_SERVERS,
        offerOptions: { 
          offerToReceiveAudio: true, 
          offerToReceiveVideo: true,
        },
        answerOptions: { 
          offerToReceiveAudio: true, 
          offerToReceiveVideo: true 
        },
      });

      // Track de estados de ICE
      setTimeout(() => {
        const pc = (peer as any)._pc;
        if (pc) {
          pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            log(`🧊 ICE state change para ${targetUserId}: ${state}`);
            
            if (state === 'failed') {
              logError(`❌ ICE connection failed con ${targetUserId}`);
              const attempts = connectionAttemptsRef.current.get(targetUserId) || 0;
              if (attempts < 3) {
                connectionAttemptsRef.current.set(targetUserId, attempts + 1);
                log(`🔄 Reintento ${attempts + 1}/3 para ${targetUserId}`);
              }
            } else if (state === 'connected') {
              log(`✅ ICE connected con ${targetUserId}`);
              connectionAttemptsRef.current.delete(targetUserId);
            }
          };
        }
      }, 100);

      if (currentStream) {
        setTimeout(() => {
          try {
            addTracksToPeer(peer, currentStream!);
          } catch (err) {
            logError(`Error agregando tracks:`, err);
          }
        }, 100);
      }

      peersRef.current.set(targetUserId, peer);

      peer.on("connect", () => {
        log(`✅ Conexión WebRTC establecida con ${targetUserId}`);
        processPendingSignals(targetUserId, peer);
        connectionAttemptsRef.current.delete(targetUserId);
      });

      peer.on("signal", (data) => {
        const videoService = videoServiceRef.current;
        const currentRoom = useVideoStore.getState().currentRoom;
        if (!videoService || !currentRoom) return;

        const signalType = initiator ? "offer" : "answer";
        try {
          videoService.sendSignal({ type: signalType, roomId: currentRoom.id, targetUserId, data });
          log(`📤 Señal ${signalType} enviada a ${targetUserId}`);
        } catch (err) {
          logError(`Error enviando señal ${signalType}:`, err);
        }
      });

      peer.on("stream", (remoteStream) => {
        log(`📹 Stream recibido de ${targetUserId}`);
        handleRemoteStream(remoteStream, targetUserId, addRemoteStream, setParticipants);
      });

      peer.on("track", (track, stream) => {
        log(`🎯 Track ${track.kind} recibido de ${targetUserId}`);
        handleRemoteStream(stream, targetUserId, addRemoteStream, setParticipants);
      });

      peer.on("error", (err) => {
        logError(`Error en peer connection con ${targetUserId}:`, err);
        const p = peersRef.current.get(targetUserId);
        if (p) {
          try { p.destroy(); } catch {}
          peersRef.current.delete(targetUserId);
          removeRemoteStream(targetUserId);
        }
      });

      peer.on("close", () => {
        log(`🔴 Peer cerrado con ${targetUserId}`);
        peersRef.current.delete(targetUserId);
        removeRemoteStream(targetUserId);
        pendingSignalsRef.current.delete(targetUserId);
      });

      return peer;
    },
    [addRemoteStream, removeRemoteStream, setParticipants, addTracksToPeer, getLocalStream, processPendingSignals]
  );

  /**
   * CORREGIDO: reconnectPeer definida DESPUÉS de createPeerConnection
   */
  const reconnectPeer = useCallback(async (userId: string) => {
    log(`🔄 Intentando reconectar peer con ${userId}`);
    
    const existingPeer = peersRef.current.get(userId);
    if (existingPeer) {
      try {
        existingPeer.destroy();
      } catch (err) {
        logError(`Error destruyendo peer existente:`, err);
      }
      peersRef.current.delete(userId);
    }
    
    pendingSignalsRef.current.delete(userId);
    connectionAttemptsRef.current.delete(userId);
    
    try {
      await createPeerConnection(userId, true);
      log(`✅ Reconexión iniciada para ${userId}`);
    } catch (err) {
      logError(`Error en reconexión con ${userId}:`, err);
    }
  }, [createPeerConnection]); // ✅ Ahora createPeerConnection ya está definida

  /**
   * connect
   */
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

      if (!listenersRegisteredRef.current) {
        videoService.onRoomCreated((room) => {
          log(`Room created: ${room.id}`);
          setCurrentRoom(room);
        });

        videoService.onRoomJoined(async ({ room, participants: roomParticipants }) => {
          log(`Room joined: ${room.id} - participants: ${roomParticipants.length}`);
          setCurrentRoom(room);
          setParticipants(roomParticipants);

          let currentStream = useVideoStore.getState().localStream;
          if (!currentStream) {
            currentStream = await getLocalStream();
            if (!currentStream) return;
          }

          peersRef.current.forEach(peer => {
            try { peer.destroy(); } catch {}
          });
          peersRef.current.clear();
          pendingSignalsRef.current.clear();
          connectionAttemptsRef.current.clear();

          setTimeout(() => {
            log(`Sala ${room.id} inicializada correctamente`);
          }, 1000);
        });

        videoService.onUserJoined(async ({ userId, userName }) => {
          const myId = getCurrentUserId();
          if (userId === myId) return;
          log(`Usuario ${userId} se unió a la sala`);

          if (peersRef.current.has(userId)) {
            log(`⚠️ Ya existe peer para ${userId}, ignorando duplicado`);
            return;
          }

          try {
            const curStream = useVideoStore.getState().localStream || await getLocalStream();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await createPeerConnection(userId, true);
          } catch (err) {
            logError(`Error creando peer con ${userId}:`, err);
          }
        });

        videoService.onUserLeft(({ userId }) => {
          log(`Usuario ${userId} salió de la sala`);
          const peer = peersRef.current.get(userId);
          if (peer) {
            try { peer.destroy(); } catch {}
            peersRef.current.delete(userId);
          }
          pendingSignalsRef.current.delete(userId);
          connectionAttemptsRef.current.delete(userId);
          removeRemoteStream(userId);
          const currentParticipants = useVideoStore.getState().participants || [];
          setParticipants(currentParticipants.filter(p => p.userId !== userId));
        });

        videoService.onSignal(({ type, fromUserId, data }) => {
          (async () => {
            let peer = peersRef.current.get(fromUserId);
            
            log(`📥 Señal ${type} recibida de ${fromUserId}`, { peerExists: !!peer });

            if (!peer && type === "offer") {
              try {
                peer = await createPeerConnection(fromUserId, false);
                if (peer) {
                  setTimeout(() => {
                    try {
                      peer!.signal(data as Peer.SignalData);
                    } catch (err) {
                      logError(`Error procesando offer:`, err);
                    }
                  }, 200);
                }
              } catch (err) {
                logError(`Error creando peer para offer:`, err);
              }
              return;
            }

            if (peer) {
              try {
                const signalingState = (peer as any)._pc?.signalingState || 'unknown';
                
                if (type === 'answer' && signalingState === 'stable') {
                  log(`⚠️ Ignorando answer - conexión estable`);
                  return;
                }

                peer.signal(data as Peer.SignalData);
                log(`✅ Señal ${type} procesada de ${fromUserId}`);
              } catch (err) {
                logError(`Error procesando señal ${type}:`, err);
              }
            } else {
              log(`⏳ Guardando señal ${type} como pendiente para ${fromUserId}`);
              if (!pendingSignalsRef.current.has(fromUserId)) {
                pendingSignalsRef.current.set(fromUserId, []);
              }
              pendingSignalsRef.current.get(fromUserId)!.push({ type, data });
            }
          })();
        });

        videoService.onAudioToggled(({ userId, enabled }) => {
          log(`Usuario ${userId} ${enabled ? 'habilitó' : 'deshabilitó'} audio`);
          const currentParticipants = useVideoStore.getState().participants || [];
          setParticipants(currentParticipants.map(p => p.userId === userId ? { ...p, isAudioEnabled: enabled } : p));
          const remoteStream = useVideoStore.getState().remoteStreams.get(userId);
          if (remoteStream) {
            remoteStream.getAudioTracks().forEach(t => t.enabled = enabled);
          }
        });

        videoService.onVideoToggled(({ userId, enabled }) => {
          log(`Usuario ${userId} ${enabled ? 'habilitó' : 'deshabilitó'} video`);
          const currentParticipants = useVideoStore.getState().participants || [];
          setParticipants(currentParticipants.map(p => p.userId === userId ? { ...p, isVideoEnabled: enabled } : p));
          const remoteStream = useVideoStore.getState().remoteStreams.get(userId);
          if (remoteStream) {
            remoteStream.getVideoTracks().forEach(t => t.enabled = enabled);
          }
        });

        videoService.onScreenToggled(({ userId, enabled }) => {
          log(`Usuario ${userId} ${enabled ? 'inició' : 'detuvo'} screen share`);
          const currentParticipants = useVideoStore.getState().participants || [];
          setParticipants(currentParticipants.map(p => p.userId === userId ? { ...p, isScreenSharing: enabled } : p));
        });

        videoService.onRoomEnded(() => {
          log(`La sala fue finalizada por el host`);
          peersRef.current.forEach(p => { try { p.destroy(); } catch {} });
          peersRef.current.clear();
          pendingSignalsRef.current.clear();
          connectionAttemptsRef.current.clear();
          const stream = useVideoStore.getState().localStream;
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
          }
          useVideoStore.getState().remoteStreams.forEach((s, id) => {
            s.getTracks().forEach(t => t.stop());
            removeRemoteStream(id);
          });
          setCurrentRoom(null);
          setParticipants([]);
        });

        videoService.onError((err) => {
          logError("Video service error:", err);
          setError({ message: err.message, code: err.code });
        });

        listenersRegisteredRef.current = true;
      }

      setConnected(true);
      setConnecting(false);

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
        setConnecting(false);
        setError({ message: err.message || "Failed to connect", code: "CONNECTION_ERROR" });
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
    useGateway, setConnecting, setError, setConnected, setCurrentRoom, setParticipants, 
    createPeerConnection, removeRemoteStream, setLocalStream, getLocalStream, reconnectPeer
  ]);

  const disconnect = useCallback(() => {
    if (videoServiceRef.current) {
      try { videoServiceRef.current.disconnect(); } catch {}
      videoServiceRef.current = null;
    }
    peersRef.current.forEach((peer) => { try { peer.destroy(); } catch {} });
    peersRef.current.clear();
    pendingSignalsRef.current.clear();
    connectionAttemptsRef.current.clear();
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
        const videoService = videoServiceRef.current!;
        const socket = videoService.getSocket();
        if (!socket) return reject(new Error("Socket not available"));

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

      await new Promise(resolve => setTimeout(resolve, 500));
      await getLocalStream();

      const isCode = roomId.length === 6 && /^[A-Z0-9]+$/.test(roomId);
      videoServiceRef.current!.joinRoom(roomId, isCode);
      joiningRoomRef.current = null;
    },
    [getLocalStream, setError, connect, currentRoom?.id]
  );

  const leaveRoom = useCallback(() => {
    if (!videoServiceRef.current || !currentRoom) return;

    peersRef.current.forEach((peer) => { try { peer.destroy(); } catch {} });
    peersRef.current.clear();
    pendingSignalsRef.current.clear();
    connectionAttemptsRef.current.clear();

    const stream = useVideoStore.getState().localStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    useVideoStore.getState().remoteStreams.forEach((s, id) => {
      s.getTracks().forEach((t) => t.stop());
      removeRemoteStream(id);
    });

    videoServiceRef.current.leaveRoom(currentRoom.id);
    setCurrentRoom(null);
    setParticipants([]);
  }, [currentRoom, setLocalStream, removeRemoteStream, setCurrentRoom, setParticipants]);

  const toggleAudio = useCallback(
    async (enabled: boolean) => {
      const storeState = useVideoStore.getState();
      const room = storeState.currentRoom;

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
          if (videoServiceRef.current && room) videoServiceRef.current.toggleAudio(room.id, enabled);
        } catch (err) {
          logError('Error notificando cambio de audio:', err);
        }

        peersRef.current.forEach((peer) => {
          try {
            const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
            if (pc) {
              const senders = pc.getSenders();
              const audioSenders = senders.filter((s: RTCRtpSender) => s.track && s.track.kind === 'audio');
              audioSenders.forEach((sender: RTCRtpSender) => {
                if (sender.track) sender.track.enabled = enabled;
              });
            }
          } catch (e) {
            logError('Error al notificar peers audio toggle:', e);
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

      let stream = storeState.localStream;

      if (enabled && (!stream || stream.getVideoTracks().length === 0)) {
        const newStream = await getLocalStream();
        if (!newStream) {
          setVideoEnabled(false);
          return;
        }
        stream = newStream;
      }

      if (stream) {
        const videoTracks = stream.getVideoTracks();

        if (videoTracks.length === 0 && enabled) {
          stream = await getLocalStream();
          if (!stream) {
            setVideoEnabled(false);
            return;
          }
        }

        videoTracks.forEach((track) => {
          try {
            track.enabled = enabled;
          } catch (e) {
            logError('Error cambiando enabled en track:', e);
          }
        });

        setVideoEnabled(enabled);

        try {
          if (videoServiceRef.current && room) videoServiceRef.current.toggleVideo(room.id, enabled);
        } catch (err) {
          logError('Error notificando cambio de video:', err);
        }

        peersRef.current.forEach((peer) => {
          try {
            const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
            if (!pc) return;
            const senders = pc.getSenders();
            const videoSenders = senders.filter((s: RTCRtpSender) => s.track && s.track.kind === 'video');

            const localVideoTrack = stream!.getVideoTracks()[0];
            if (localVideoTrack) {
              if (videoSenders.length > 0) {
                videoSenders.forEach(sender => {
                  try {
                    if (sender.replaceTrack) sender.replaceTrack(localVideoTrack);
                  } catch (e) {
                    logError('replaceTrack error:', e);
                  }
                });
              } else {
                try {
                  pc.addTrack(localVideoTrack, stream!);
                } catch (e) {
                  logError('addTrack error:', e);
                }
              }
            }
          } catch (e) {
            logError('Error actualizando senders en peers:', e);
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
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          const screenTrack = screenStream.getVideoTracks()[0];

          peersRef.current.forEach((peer) => {
            try {
              const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
              if (!pc) return;
              const senders = pc.getSenders();
              const videoSender = senders.find((s: RTCRtpSender) => s.track && s.track.kind === "video");
              if (videoSender && videoSender.replaceTrack) {
                videoSender.replaceTrack(screenTrack);
              }
            } catch (e) {
              logError('Error replacing track for screenshare:', e);
            }
          });

          setScreenSharing(true);
          videoServiceRef.current.toggleScreen(currentRoom.id, true);

          screenTrack.onended = async () => {
            try {
              const cameraStream = await getLocalStream();
              const cameraTrack = cameraStream?.getVideoTracks()[0];
              if (cameraTrack) {
                peersRef.current.forEach((peer) => {
                  try {
                    const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
                    if (!pc) return;
                    const senders = pc.getSenders();
                    const videoSender = senders.find((s: RTCRtpSender) => s.track && s.track.kind === "video");
                    if (videoSender && videoSender.replaceTrack) {
                      videoSender.replaceTrack(cameraTrack);
                    }
                  } catch (e) {
                    logError('Error restoring camera after screenshare:', e);
                  }
                });

                const cur = useVideoStore.getState().localStream;
                if (cur) {
                  const old = cur.getVideoTracks()[0];
                  if (old && old.id !== cameraTrack.id) {
                    try {
                      cur.removeTrack(old);
                    } catch {}
                    try { cur.addTrack(cameraTrack); } catch {}
                    setLocalStream(cur);
                  }
                }
              }
              setScreenSharing(false);
              videoServiceRef.current?.toggleScreen(currentRoom.id, false);
            } catch (err) {
              logError('Error handling screenTrack.onended:', err);
              setScreenSharing(false);
            }
          };
        } else {
          const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
          const cameraTrack = cameraStream.getVideoTracks()[0];
          peersRef.current.forEach((peer) => {
            try {
              const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
              if (!pc) return;
              const senders = pc.getSenders();
              const videoSender = senders.find((s: RTCRtpSender) => s.track && s.track.kind === "video");
              if (videoSender && videoSender.replaceTrack) {
                videoSender.replaceTrack(cameraTrack);
              }
            } catch (e) {
              logError('Error replacing screenshare track with camera:', e);
            }
          });

          const cur = useVideoStore.getState().localStream;
          if (cur) {
            const old = cur.getVideoTracks()[0];
            if (old && old.id !== cameraTrack.id) {
              try { cur.removeTrack(old); } catch {}
              try { cur.addTrack(cameraTrack); } catch {}
              setLocalStream(cur);
            }
          }

          setScreenSharing(false);
          videoServiceRef.current.toggleScreen(currentRoom.id, false);
        }
      } catch (err) {
        logError("Error toggling screen share:", err);
        setError({
          message: err instanceof Error ? err.message : "Failed to toggle screen share",
          code: "SCREEN_SHARE_ERROR",
        });
      }
    },
    [currentRoom, setScreenSharing, setError, getLocalStream, setLocalStream]
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
    reconnectPeer,
  };
};