"use client";

import { useRef, useCallback, useEffect } from "react";
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

const updateParticipantState = (
  userId: string,
  updates: Partial<VideoParticipant>,
  setParticipants: (participants: VideoParticipant[]) => void
) => {
  const currentParticipants = useVideoStore.getState().participants;
  const safeParticipants = Array.isArray(currentParticipants) ? currentParticipants : [];
  const updatedParticipants = safeParticipants.map((p) =>
    p.userId === userId ? { ...p, ...updates } : p
  );
  setParticipants(updatedParticipants);
};

const handleRemoteStream = (
  stream: MediaStream,
  userId: string,
  addRemoteStream: (userId: string, stream: MediaStream) => void,
  addRemoteScreenStream: (userId: string, stream: MediaStream) => void,
  setParticipants: (participants: VideoParticipant[]) => void
) => {
  // Detectar si es un stream de pantalla o cámara
  const videoTracks = stream.getVideoTracks();
  const isScreenStream = videoTracks.some(track => {
    const settings = track.getSettings ? track.getSettings() : {};
    return settings.displaySurface === 'monitor' || 
           settings.displaySurface === 'window' ||
           track.label?.toLowerCase().includes('screen') ||
           track.label?.toLowerCase().includes('display');
  });

  if (isScreenStream) {
    // Es un stream de pantalla compartida
    const existingScreenStream = useVideoStore.getState().remoteScreenStreams.get(userId);
    const screenStreamToUse = existingScreenStream || new MediaStream();
    
    const addTrackIfNotExists = (track: MediaStreamTrack) => {
      const trackExists = screenStreamToUse.getTracks().some(t => t.id === track.id);
      if (!trackExists) {
        screenStreamToUse.addTrack(track);
        if (track.readyState === 'live' && !track.enabled) {
          track.enabled = true;
        }
      }
    };

    stream.getVideoTracks().forEach(addTrackIfNotExists);
    stream.getAudioTracks().forEach(addTrackIfNotExists);

    addRemoteScreenStream(userId, screenStreamToUse);
    updateParticipantState(userId, { isScreenSharing: true }, setParticipants);
  } else {
    // Es un stream de cámara
    const existingStream = useVideoStore.getState().remoteStreams.get(userId);
    const streamToUse = existingStream || new MediaStream();
    
    const addTrackIfNotExists = (track: MediaStreamTrack) => {
      const trackExists = streamToUse.getTracks().some(t => t.id === track.id);
      if (!trackExists) {
        streamToUse.addTrack(track);
        if (track.readyState === 'live' && !track.enabled) {
          track.enabled = true;
        }
      }
    };

    stream.getVideoTracks().forEach(addTrackIfNotExists);
    stream.getAudioTracks().forEach(addTrackIfNotExists);

    addRemoteStream(userId, streamToUse);

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
    } else {
      updateParticipantState(userId, { isAudioEnabled: hasAudio, isVideoEnabled: hasVideo }, setParticipants);
    }
  }
};

interface UseVideoCallReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: { message: string; code?: string } | null;
  currentRoom: VideoRoom | null;
  participants: VideoParticipant[];
  localStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  remoteScreenStreams: Map<string, MediaStream>;
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

  const isConnected = useVideoStore((state) => state.isConnected);
  const isConnecting = useVideoStore((state) => state.isConnecting);
  const error = useVideoStore((state) => state.error);
  const currentRoom = useVideoStore((state) => state.currentRoom);
  const participants = useVideoStore((state) => state.participants);
  const localStream = useVideoStore((state) => state.localStream);
  const localScreenStream = useVideoStore((state) => state.localScreenStream);
  const remoteStreams = useVideoStore((state) => state.remoteStreams);
  const remoteScreenStreams = useVideoStore((state) => state.remoteScreenStreams);
  const isAudioEnabled = useVideoStore((state) => state.isAudioEnabled);
  const isVideoEnabled = useVideoStore((state) => state.isVideoEnabled);
  const isScreenSharing = useVideoStore((state) => state.isScreenSharing);

  const setConnected = useVideoStore((state) => state.setConnected);
  const setConnecting = useVideoStore((state) => state.setConnecting);
  const setError = useVideoStore((state) => state.setError);
  const setCurrentRoom = useVideoStore((state) => state.setCurrentRoom);
  const setParticipants = useVideoStore((state) => state.setParticipants);
  const setLocalStream = useVideoStore((state) => state.setLocalStream);
  const setLocalScreenStream = useVideoStore((state) => state.setLocalScreenStream);
  const setAudioEnabled = useVideoStore((state) => state.setAudioEnabled);
  const setVideoEnabled = useVideoStore((state) => state.setVideoEnabled);
  const setScreenSharing = useVideoStore((state) => state.setScreenSharing);
  const addRemoteStream = useVideoStore((state) => state.addRemoteStream);
  const removeRemoteStream = useVideoStore((state) => state.removeRemoteStream);
  const addRemoteScreenStream = useVideoStore((state) => state.addRemoteScreenStream);
  const removeRemoteScreenStream = useVideoStore((state) => state.removeRemoteScreenStream);
  const reset = useVideoStore((state) => state.reset);

  // Actualizar tracks en todos los peers cuando cambia el localStream o localScreenStream
  useEffect(() => {
    if (peersRef.current.size === 0) return;

    const updatePeers = async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const updatePromises: Promise<void>[] = [];
      peersRef.current.forEach((peer, userId) => {
        if (peer && !peer.destroyed) {
          const updatePromise = (async () => {
            if (localStream) {
              await addTracksToPeer(peer, localStream);
            }
            if (localScreenStream) {
              await addTracksToPeer(peer, localScreenStream);
            }
          })().catch(err => {
            logError(`Error actualizando tracks en peer ${userId}:`, err);
          });
          updatePromises.push(updatePromise);
        }
      });

      await Promise.all(updatePromises);
      log(`✅ Tracks actualizados en ${updatePromises.length} peers`);
    };

    updatePeers();
  }, [localStream, localScreenStream]);

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

  const addTracksToPeer = async (peer: Peer.Instance, stream: MediaStream): Promise<void> => {
    const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
    if (!pc) {
      log(`⚠️ No hay RTCPeerConnection disponible para agregar tracks`);
      return;
    }

    if (pc.signalingState === 'closed') {
      log(`⚠️ Peer connection está cerrada, no se pueden agregar tracks`);
      return;
    }

    const existingSenders = pc.getSenders();
    const existingTrackIds = new Set(existingSenders.map(s => s.track?.id).filter(Boolean));

    const trackPromises: Promise<void>[] = [];

    stream.getTracks().forEach(track => {
      if (!existingTrackIds.has(track.id)) {
        try {
          pc.addTrack(track, stream);
          log(`✅ Track ${track.kind} (${track.id}) agregado al peer`);
        } catch (err) {
          logError(`Error agregando track ${track.kind}:`, err);
        }
      } else {
        const sender = existingSenders.find(s => s.track?.id === track.id);
        if (sender) {
          if (sender.track !== track) {
            const replacePromise = sender.replaceTrack(track).then(() => {
              log(`✅ Track ${track.kind} (${track.id}) reemplazado en peer`);
            }).catch(err => {
              logError(`Error reemplazando track ${track.kind}:`, err);
            });
            trackPromises.push(replacePromise);
          }
        } else {
          try {
            pc.addTrack(track, stream);
            log(`✅ Track ${track.kind} (${track.id}) agregado al peer (sender no encontrado)`);
          } catch (err) {
            logError(`Error agregando track ${track.kind} (fallback):`, err);
          }
        }
      }
    });

    await Promise.all(trackPromises);
  };

  const setupTrackHandlers = (
    pc: RTCPeerConnection,
    targetUserId: string,
    addRemoteStream: (userId: string, stream: MediaStream) => void,
    addRemoteScreenStream: (userId: string, stream: MediaStream) => void,
    setParticipants: (participants: VideoParticipant[]) => void
  ) => {
    const trackHandler = (event: RTCTrackEvent) => {
      log(`📹 Nuevo track recibido de ${targetUserId} (trackHandler):`, {
        trackId: event.track.id,
        kind: event.track.kind,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        streamsCount: event.streams.length,
        label: event.track.label
      });

      if (event.track.readyState === 'live' && !event.track.enabled) {
        event.track.enabled = true;
        log(`🔄 Track ${event.track.id} habilitado automáticamente`);
      }

      const trackSettings = event.track.getSettings ? event.track.getSettings() : {};
      const isScreenTrack = trackSettings.displaySurface === 'monitor' || 
                           trackSettings.displaySurface === 'window' ||
                           event.track.label?.toLowerCase().includes('screen') ||
                           event.track.label?.toLowerCase().includes('display');
      
      if (isScreenTrack) {
        log(`📺 Detectado track de pantalla compartida de ${targetUserId}`);
        updateParticipantState(targetUserId, { isScreenSharing: true }, setParticipants);
      }
      
      if (event.streams && event.streams.length > 0) {
        event.streams.forEach(stream => {
          log(`📹 Procesando stream ${stream.id} de ${targetUserId} (${stream.getTracks().length} tracks)`);
          handleRemoteStream(stream, targetUserId, addRemoteStream, addRemoteScreenStream, setParticipants);
        });
      } else {
        // Si no hay stream asociado, crear uno temporal para procesar el track
        const tempStream = new MediaStream([event.track]);
        handleRemoteStream(tempStream, targetUserId, addRemoteStream, addRemoteScreenStream, setParticipants);
      }
    };

    pc.removeEventListener('track', trackHandler);
    pc.addEventListener('track', trackHandler);
    log(`✅ Track handler configurado para ${targetUserId}`);
  };

  const createPeerConnection = useCallback(
    async (targetUserId: string, initiator: boolean): Promise<Peer.Instance> => {
      const storeState = useVideoStore.getState();
      const currentStream = storeState.localStream;
      const currentScreenStream = storeState.localScreenStream;
      const room = storeState.currentRoom;

      if (!currentStream) throw new Error("No stream available");
      if (!room) throw new Error("No room available");

      const existingPeer = peersRef.current.get(targetUserId);
      if (existingPeer) return existingPeer;

      // Combinar streams de cámara y pantalla si ambos están disponibles
      const combinedStream = new MediaStream();
      currentStream.getTracks().forEach(track => combinedStream.addTrack(track));
      if (currentScreenStream) {
        currentScreenStream.getTracks().forEach(track => combinedStream.addTrack(track));
      }

      const peer = new Peer({
        initiator,
        trickle: false,
        config: ICE_SERVERS,
        stream: combinedStream,
        offerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: true },
        answerOptions: { offerToReceiveAudio: true, offerToReceiveVideo: true },
      });

      peersRef.current.set(targetUserId, peer);

      const peerPc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
      if (peerPc) {
        peerPc.addEventListener('negotiationneeded', () => {
          log(`🔄 Negotiation needed para peer ${targetUserId}`);
        });

        peerPc.addEventListener('iceconnectionstatechange', () => {
          const state = peerPc.iceConnectionState;
          log(`🧊 ICE connection state para ${targetUserId}: ${state}`);
          if (state === 'failed' || state === 'disconnected') {
            log(`⚠️ ICE connection problemática para ${targetUserId}, estado: ${state}`);
          }
        });

        peerPc.addEventListener('connectionstatechange', () => {
          const state = peerPc.connectionState;
          log(`📡 Connection state para ${targetUserId}: ${state}`);
          if (state === 'failed') {
            logError(`❌ Peer connection falló para ${targetUserId}`);
          }
        });

        peerPc.addEventListener('icecandidate', (event) => {
          if (event.candidate) {
            log(`🧊 ICE candidate generado para ${targetUserId}`);
          } else {
            log(`✅ Todos los ICE candidates generados para ${targetUserId}`);
          }
        });

        peerPc.ontrack = (event) => {
          log(`📹 Track recibido de ${targetUserId} (ontrack):`, {
            trackId: event.track.id,
            kind: event.track.kind,
            enabled: event.track.enabled,
            readyState: event.track.readyState,
            streamsCount: event.streams.length
          });

          if (event.track.readyState === 'live' && !event.track.enabled) {
            event.track.enabled = true;
            log(`🔄 Track ${event.track.id} habilitado`);
          }

          const trackSettings = event.track.getSettings ? event.track.getSettings() : {};
          const isScreenTrack = trackSettings.displaySurface === 'monitor' || 
                               trackSettings.displaySurface === 'window' ||
                               event.track.label?.toLowerCase().includes('screen') ||
                               event.track.label?.toLowerCase().includes('display');
          
          if (isScreenTrack) {
            log(`📺 Detectado track de pantalla compartida de ${targetUserId} (ontrack)`);
            updateParticipantState(targetUserId, { isScreenSharing: true }, setParticipants);
          }
          
          if (event.streams && event.streams.length > 0) {
            event.streams.forEach(stream => {
              log(`📹 Procesando stream ${stream.id} de ${targetUserId} (ontrack)`);
              handleRemoteStream(stream, targetUserId, addRemoteStream, addRemoteScreenStream, setParticipants);
            });
          } else {
            // Si no hay stream asociado, crear uno temporal para procesar el track
            const tempStream = new MediaStream([event.track]);
            handleRemoteStream(tempStream, targetUserId, addRemoteStream, addRemoteScreenStream, setParticipants);
          }
        };
      }

      // Agregar tracks de cámara
      addTracksToPeer(peer, currentStream).catch(err => {
        logError(`Error inicial agregando tracks de cámara a peer ${targetUserId}:`, err);
      });

      // Agregar tracks de pantalla si está disponible
      if (currentScreenStream) {
        addTracksToPeer(peer, currentScreenStream).catch(err => {
          logError(`Error inicial agregando tracks de pantalla a peer ${targetUserId}:`, err);
        });
      }

      peer.on("connect", () => {
        log(`✅ Peer connection establecida con ${targetUserId}`);
        const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
        if (!pc) {
          logError(`❌ No hay RTCPeerConnection disponible para ${targetUserId}`);
          return;
        }

        const receivers = pc.getReceivers();
        log(`📡 Revisando ${receivers.length} receivers para ${targetUserId}`);
        
        receivers.forEach((receiver, idx) => {
          if (receiver.track) {
            log(`📡 Receiver ${idx} para ${targetUserId}:`, {
              trackId: receiver.track.id,
              kind: receiver.track.kind,
              enabled: receiver.track.enabled,
              readyState: receiver.track.readyState
            });

            if (receiver.track.readyState === 'live') {
              const trackSettings = receiver.track.getSettings ? receiver.track.getSettings() : {};
              const isScreenTrack = trackSettings.displaySurface === 'monitor' || 
                                   trackSettings.displaySurface === 'window' ||
                                   receiver.track.label?.toLowerCase().includes('screen') ||
                                   receiver.track.label?.toLowerCase().includes('display');
              
              if (isScreenTrack) {
                const existingScreenStream = useVideoStore.getState().remoteScreenStreams.get(targetUserId);
                const screenStreamToUse = existingScreenStream || new MediaStream();
                const trackExists = screenStreamToUse.getTracks().some(t => t.id === receiver.track!.id);
                
                if (!trackExists) {
                  screenStreamToUse.addTrack(receiver.track);
                  if (!receiver.track.enabled) {
                    receiver.track.enabled = true;
                    log(`🔄 Track de pantalla habilitado`);
                  }
                  addRemoteScreenStream(targetUserId, screenStreamToUse);
                  log(`✅ Track de pantalla agregado al stream de ${targetUserId}`);
                }
              } else {
                const existingStream = useVideoStore.getState().remoteStreams.get(targetUserId);
                const streamToUse = existingStream || new MediaStream();
                const trackExists = streamToUse.getTracks().some(t => t.id === receiver.track!.id);
                
                if (!trackExists) {
                  streamToUse.addTrack(receiver.track);
                  if (!receiver.track.enabled) {
                    receiver.track.enabled = true;
                    log(`🔄 Track ${receiver.track.kind} habilitado`);
                  }
                  addRemoteStream(targetUserId, streamToUse);
                  log(`✅ Track ${receiver.track.kind} agregado al stream de ${targetUserId}`);
                }
              }
            } else {
              log(`⏳ Track ${receiver.track.kind} no está live aún (${receiver.track.readyState})`);
            }
          }
        });

        setupTrackHandlers(pc, targetUserId, addRemoteStream, addRemoteScreenStream, setParticipants);
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
        log(`📹 Stream recibido de ${targetUserId}:`, {
          streamId: remoteStream.id,
          videoTracks: remoteStream.getVideoTracks().length,
          audioTracks: remoteStream.getAudioTracks().length,
          videoTrackIds: remoteStream.getVideoTracks().map(t => t.id),
          audioTrackIds: remoteStream.getAudioTracks().map(t => t.id)
        });
        handleRemoteStream(remoteStream, targetUserId, addRemoteStream, addRemoteScreenStream, setParticipants);
      });

      peer.on("error", (err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logError(`Error en peer connection con ${targetUserId}:`, err);
        
        if (errorMessage.includes('Connection failed') || errorMessage.includes('ICE')) {
          return;
        }
        
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
    [addRemoteStream, addRemoteScreenStream, removeRemoteStream, setParticipants]
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
          setCurrentRoom(room);
        });

        videoService.onRoomJoined(async ({ room, participants: roomParticipants }) => {
          setCurrentRoom(room);
          setParticipants(roomParticipants);

          let currentStream = useVideoStore.getState().localStream;
          if (!currentStream) {
            currentStream = await getLocalStream();
            if (!currentStream) return;
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
        });

        videoService.onUserJoined(async ({ userId, userName }) => {
          const currentUserId = getCurrentUserId();
          if (userId === currentUserId) return;

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
            setParticipants([...safeParticipants, newParticipant]);
          }

          if (peersRef.current.has(userId)) {
            const existingPeer = peersRef.current.get(userId);
            if (existingPeer && !existingPeer.destroyed) {
              const currentStream = useVideoStore.getState().localStream;
              if (currentStream) {
                addTracksToPeer(existingPeer, currentStream);
              }
              return;
            }
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
          const peer = peersRef.current.get(userId);
          if (peer) {
            peer.destroy();
            peersRef.current.delete(userId);
          }
          
          removeRemoteStream(userId);
          
          const currentParticipants = useVideoStore.getState().participants;
          const safeParticipants = Array.isArray(currentParticipants) ? currentParticipants : [];
          const updatedParticipants = safeParticipants.filter(p => p.userId !== userId);
          setParticipants(updatedParticipants);
        });

        videoService.onSignal(async ({ type, fromUserId, data, metadata }) => {
          if (metadata?.isScreenSharing) {
            log(`📺 Señal de screen sharing recibida de ${fromUserId}`);
            updateParticipantState(fromUserId, { isScreenSharing: true }, setParticipants);
          } else if (metadata?.streamType === 'camera') {
            log(`📹 Señal de cámara recibida de ${fromUserId}`);
            updateParticipantState(fromUserId, { isScreenSharing: false }, setParticipants);
          }
          
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
          updateParticipantState(userId, { isAudioEnabled: enabled }, setParticipants);

          const remoteStream = useVideoStore.getState().remoteStreams.get(userId);
          if (remoteStream) {
            remoteStream.getAudioTracks().forEach((track) => { 
              track.enabled = enabled;
            });
          }
        });

        videoService.onVideoToggled(({ userId, enabled }) => {
          updateParticipantState(userId, { isVideoEnabled: enabled }, setParticipants);

          const remoteStream = useVideoStore.getState().remoteStreams.get(userId);
          if (remoteStream) {
            remoteStream.getVideoTracks().forEach((track) => { 
              track.enabled = enabled;
            });
          }
        });

        videoService.onScreenToggled(({ userId, enabled }) => {
          updateParticipantState(userId, { isScreenSharing: enabled }, setParticipants);
        });

        videoService.onScreenStarted(({ userId }) => {
          updateParticipantState(userId, { isScreenSharing: true }, setParticipants);
        });

        videoService.onScreenStopped(({ userId }) => {
          updateParticipantState(userId, { isScreenSharing: false }, setParticipants);
        });

        videoService.onRoomEnded(() => {
          peersRef.current.forEach((peer) => peer.destroy());
          peersRef.current.clear();
          
          const stream = useVideoStore.getState().localStream;
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
          }
          
          const remoteStreams = useVideoStore.getState().remoteStreams;
          remoteStreams.forEach((stream) => {
            stream.getTracks().forEach((track) => track.stop());
          });
          remoteStreams.forEach((_, userId) => removeRemoteStream(userId));
          
          setCurrentRoom(null);
          setParticipants([]);
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

      if (!videoServiceRef.current || !room) {
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

      if (!videoServiceRef.current || !room) {
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
      if (!videoServiceRef.current || !currentRoom) {
        logError("No video service or room available for screen sharing");
        return;
      }

      const handleStopScreenShare = async () => {
        try {
          log("🛑 Deteniendo screen sharing...");
          
          const currentScreenStream = useVideoStore.getState().localScreenStream;
          if (currentScreenStream) {
            // Detener todos los tracks del stream de pantalla
            currentScreenStream.getTracks().forEach(track => {
              track.stop();
            });
            setLocalScreenStream(null);
            log("✅ Stream de pantalla detenido");
          }

          // Remover tracks de pantalla de todos los peers
          const removePromises: Promise<void>[] = [];
          peersRef.current.forEach((peer, userId) => {
            if (peer.destroyed) return;

            const pc = (peer as Peer.Instance & { _pc?: RTCPeerConnection })._pc;
            if (!pc || pc.signalingState === 'closed') return;

            const senders = pc.getSenders();
            senders.forEach((sender: RTCRtpSender) => {
              if (sender.track) {
                const settings = sender.track.getSettings ? sender.track.getSettings() : {};
                const isScreenTrack = settings.displaySurface === 'monitor' || 
                                     settings.displaySurface === 'window' ||
                                     sender.track.label?.toLowerCase().includes('screen') ||
                                     sender.track.label?.toLowerCase().includes('display');
                
                if (isScreenTrack) {
                  const removePromise = sender.replaceTrack(null).then(() => {
                    log(`✅ Track de pantalla removido de peer ${userId}`);
                  }).catch(err => {
                    logError(`Error removiendo track de pantalla de peer ${userId}:`, err);
                  });
                  removePromises.push(removePromise);
                }
              }
            });
          });

          await Promise.all(removePromises);
          
          // Limpiar streams remotos de pantalla
          const currentUserId = getCurrentUserId();
          const remoteScreenStreams = useVideoStore.getState().remoteScreenStreams;
          remoteScreenStreams.forEach((_, userId) => {
            if (userId !== currentUserId) {
              removeRemoteScreenStream(userId);
            }
          });
          
          setScreenSharing(false);
          
          if (videoServiceRef.current && currentRoom) {
            videoServiceRef.current.stopScreenShare(currentRoom.id);
            log("📡 Notificación de detención enviada al servidor");
          }
        } catch (err) {
          logError("Error deteniendo screen share:", err);
          setScreenSharing(false);
        }
      };

      try {
        if (enabled) {
          log("📺 Iniciando screen sharing...");
          
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { 
              width: { ideal: 1920 }, 
              height: { ideal: 1080 },
              frameRate: { ideal: 30 }
            }, 
            audio: true 
          });
          
          const screenVideoTrack = screenStream.getVideoTracks()[0];
          if (!screenVideoTrack) {
            throw new Error("No se pudo obtener el track de video de la pantalla");
          }

          log("✅ Stream de pantalla obtenido");

          screenVideoTrack.onended = () => {
            log("📺 Usuario detuvo screen sharing desde el navegador");
            handleStopScreenShare();
          };

          // Crear un stream separado para la pantalla
          const newScreenStream = new MediaStream([screenVideoTrack]);
          if (screenStream.getAudioTracks().length > 0) {
            newScreenStream.addTrack(screenStream.getAudioTracks()[0]);
          }
          setLocalScreenStream(newScreenStream);

          // Agregar tracks de pantalla a todos los peers
          const addPromises: Promise<void>[] = [];
          peersRef.current.forEach((peer, userId) => {
            if (peer.destroyed) return;
            const addPromise = addTracksToPeer(peer, newScreenStream).catch(err => {
              logError(`Error agregando tracks de pantalla a peer ${userId}:`, err);
            });
            addPromises.push(addPromise);
          });

          await Promise.all(addPromises);
          log("✅ Track de pantalla agregado a todos los peers");

          setScreenSharing(true);
          
          if (videoServiceRef.current && currentRoom) {
            videoServiceRef.current.startScreenShare(currentRoom.id);
            log("📡 Notificación de inicio enviada al servidor");
          }
        } else {
          await handleStopScreenShare();
        }
      } catch (error) {
        logError("Error toggling screen share:", error);
        
        if (error instanceof Error && error.name === "NotAllowedError") {
          setError({
            message: "Permiso denegado para compartir pantalla",
            code: "PERMISSION_DENIED",
          });
        } else {
          setError({
            message: error instanceof Error ? error.message : "Failed to toggle screen share",
            code: "SCREEN_SHARE_ERROR",
          });
        }
        setScreenSharing(false);
      }
    },
    [currentRoom, setScreenSharing, setError, setLocalScreenStream, removeRemoteScreenStream]
  );

  return {
    isConnected,
    isConnecting,
    error,
    currentRoom,
    participants,
    localStream,
    localScreenStream,
    remoteStreams,
    remoteScreenStreams,
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
