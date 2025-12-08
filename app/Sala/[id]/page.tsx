 'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MeetingHeader } from '@/components/ui/Sala/MeetingHeader';
import { VideoGrid } from '@/components/ui/Sala/VideoGrid';
import { Sidebar } from '@/components/ui/Sala/Sidebar';
import { ControlBar } from '@/components/ui/Sala/ControlBar';
import { InviteModal } from '@/components/ui/Sala/InviteModal';
import { useVideoCall } from '@/app/hooks/useVideoCall';
import { useChat } from '@/app/hooks/useChat';
import { useVideoStore } from '@/utils/videoStore';
import { Participant } from '@/types/meetingRoom';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/config/firebase';

interface PageProps {
  params: { id: string };
}

const getFirebaseAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const existingApps = getApps();
  const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  return getAuth(app);
};

// Helper para obtener apps de Firebase
const getFirebaseApp = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const existingApps = getApps();
  return existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
};

export default function SalaPage({ params }: PageProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [meetingName, setMeetingName] = useState<string>('Nombre de la reunión');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();

  // En componentes cliente, obtener params vía useParams()
  const routeParams = useParams();
  const roomId = (routeParams && typeof routeParams === 'object' && 'id' in routeParams && typeof routeParams.id === 'string' ? routeParams.id : '') || (params && params.id) || '';

  // Hook de video call
  const {
    connect,
    joinRoom,
    leaveRoom: leaveVideoRoom,
    localStream,
    localScreenStream,
    remoteStreams,
    remoteScreenStreams,
    currentRoom,
    participants: videoParticipants,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    isConnected,
    error: videoError,
    getLocalStream,
  } = useVideoCall();

  // Hook de chat
  const {
    connect: connectChat,
    joinRoom: joinChatRoom,
    leaveRoom: leaveChatRoom,
    sendMessage: sendChatMessage,
    getMessages: getChatMessages,
    messages: chatMessages,
    isConnected: isChatConnected,
  } = useChat();

  // Conectar al chat al montar
  useEffect(() => {
    if (!isChatConnected) {
      connectChat().catch(err => {
        console.warn('⚠️ [SALA_PAGE] No se pudo conectar al chat:', err);
      });
    }
  }, [isChatConnected, connectChat]);

  // Gestionar chat asociado a la sala de video
  useEffect(() => {
    console.log(`💬 [SALA_PAGE] Verificando chat - currentRoom:`, currentRoom);
    console.log(`💬 [SALA_PAGE] chatRoomId: ${currentRoom?.chatRoomId || 'none'}, isChatConnected: ${isChatConnected}`);
    
    if (!currentRoom?.chatRoomId || !isChatConnected) {
      if (!currentRoom?.chatRoomId) {
        console.warn(`⚠️ [SALA_PAGE] No hay chatRoomId en currentRoom. Room data:`, currentRoom);
      }
      if (!isChatConnected) {
        console.warn(`⚠️ [SALA_PAGE] Chat no está conectado`);
      }
      return;
    }

    const chatRoomId = currentRoom.chatRoomId;
    const chatRoomCode = currentRoom.chatRoomCode;

    console.log(`💬 [SALA_PAGE] Uniéndose al chat asociado: ${chatRoomId}${chatRoomCode ? ` (code: ${chatRoomCode})` : ''}`);
    joinChatRoom(chatRoomId, chatRoomCode);

    const fetchTimeout = setTimeout(() => {
      getChatMessages(chatRoomId, 50);
    }, 400);

    return () => {
      clearTimeout(fetchTimeout);
      if (chatRoomId) {
        leaveChatRoom(chatRoomId);
      }
    };
  }, [currentRoom, isChatConnected, joinChatRoom, leaveChatRoom, getChatMessages]);

  // Conectar y unirse a la sala al montar - usar ref para evitar múltiples ejecuciones
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (!roomId || hasInitializedRef.current) {
      if (hasInitializedRef.current) {
        console.log('⏭️ [SALA_PAGE] Ya inicializado, saltando...');
      }
      return;
    }

    const initializeRoom = async () => {
      console.log(`🚀 [SALA_PAGE] Inicializando sala ${roomId}...`);
      hasInitializedRef.current = true;
      try {
        if (isConnected && currentRoom?.id === roomId) {
          console.log(`✅ [SALA_PAGE] Ya estamos en la sala ${roomId}`);
          return;
        }
        
        if (!isConnected) {
          try {
            await connect();
          } catch (err) {
            console.error('❌ [SALA_PAGE] Error conectando:', err);
            hasInitializedRef.current = false;
            return;
          }
        }
        
        await getLocalStream();
        await joinRoom(roomId);
        
        // Esperar a que currentRoom se actualice con chatRoomId
        // El chat se unirá automáticamente cuando currentRoom tenga chatRoomId (ver useEffect más abajo)
      } catch (err) {
        console.error('❌ [SALA_PAGE] Error inicializando sala:', err);
        hasInitializedRef.current = false; // Permitir reintentar si falla
      }
    };

    initializeRoom();

    return () => {
      // En React Strict Mode, el componente se monta/desmonta dos veces
      // Solo limpiar si realmente estamos cambiando de sala, no en el primer unmount de Strict Mode
      const currentRoomId = currentRoom?.id;
      
      // Si estamos en la misma sala, probablemente es Strict Mode, no limpiar
      if (currentRoomId === roomId) {
        console.log(`⏭️ [SALA_PAGE] Saltando limpieza - misma sala (${roomId})`);
        return;
      }
      
      // Si estamos en una sala diferente o no hay sala, limpiar
      if (currentRoomId !== roomId) {
        console.log(`🧹 [SALA_PAGE] Limpiando sala ${roomId} (cambiando a sala ${currentRoomId || 'ninguna'})...`);
        hasInitializedRef.current = false;
        leaveVideoRoom();
        // Salir del chat asociado si existe
        const currentRoomState = useVideoStore.getState().currentRoom;
        if (currentRoomState?.chatRoomId) {
          leaveChatRoom(currentRoomState.chatRoomId);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Solo dependemos de roomId

  // Actualizar video local
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Convertir participantes del video service a formato de UI
  useEffect(() => {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    const currentUserId = currentUser?.uid || '';

    // Asegurar que videoParticipants sea un array
    const safeVideoParticipants = Array.isArray(videoParticipants) ? videoParticipants : [];

    const uiParticipants: Participant[] = [];

    // SIEMPRE agregar usuario local primero
    uiParticipants.push({
      id: currentUserId,
      name: currentUser?.displayName || currentUser?.email || 'Tú',
      avatar: currentUser?.photoURL || undefined,
      isMuted: !isAudioEnabled,
      isCameraOff: !isVideoEnabled,
      isHost: currentRoom?.hostId === currentUserId,
      isScreenSharing: isScreenSharing,
      stream: localStream || undefined,
      screenStream: localScreenStream || undefined,
    });

    // Función para obtener info del usuario (nombre y foto)
    const fetchUserInfo = async (userId: string): Promise<{ name: string; avatar?: string }> => {
      // Primero intentar obtener desde Firestore con timeout
      try {
        const app = getFirebaseApp();
        if (app) {
          const db = getFirestore(app);
          
          // Usar Promise.race para timeout de 3 segundos
          const userDocPromise = getDoc(doc(db, 'users', userId));
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          
          try {
            const userDoc = await Promise.race([userDocPromise, timeoutPromise]);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const avatar = userData.photoURL || userData.avatar || userData.profilePicture;
              return {
                name: userData.displayName || userData.name || userData.email || `Usuario ${userId.slice(0, 8)}`,
                avatar: avatar || undefined,
              };
            }
          } catch {
            // Timeout o error de permisos - continuar con fallback
            console.warn(`⚠️ [SALA_PAGE] Timeout o error obteniendo info de usuario ${userId} desde Firestore`);
          }
        }
      } catch (err) {
        // Silenciar el error de permisos - es esperado si el usuario no tiene acceso
        console.warn(`⚠️ [SALA_PAGE] No se pudo obtener info del usuario ${userId} desde Firestore:`, err);
      }
      
      // Fallback: intentar obtener desde Auth (solo funciona para el usuario actual)
      try {
        const auth = getFirebaseAuth();
        if (auth?.currentUser?.uid === userId) {
          return {
            name: auth.currentUser.displayName || auth.currentUser.email || `Usuario ${userId.slice(0, 8)}`,
            avatar: auth.currentUser.photoURL || undefined,
          };
        }
      } catch {
        // Ignorar errores de Auth
      }
      
      // Último fallback - usar nombre del participante del backend si está disponible
      const participant = safeVideoParticipants.find((p) => p.userId === userId);
      return {
        name: participant?.userName || participant?.userEmail || `Usuario ${userId.slice(0, 8)}`,
        avatar: undefined, // No hay avatar disponible sin permisos de Firestore
      };
    };

    // Obtener todos los IDs de participantes (de videoParticipants y de remoteStreams)
    const allParticipantIds = new Set<string>();
    
    // Agregar IDs de participantes del backend
    safeVideoParticipants.forEach((p) => {
      if (p.userId && p.userId !== currentUserId) {
        allParticipantIds.add(p.userId);
      }
    });
    
    // Agregar IDs de participantes con stream (cámara o pantalla)
    remoteStreams.forEach((_, userId) => {
      if (userId !== currentUserId) {
        allParticipantIds.add(userId);
      }
    });
    
    remoteScreenStreams.forEach((_, userId) => {
      if (userId !== currentUserId) {
        allParticipantIds.add(userId);
      }
    });

    // Procesar todos los participantes remotos
    Promise.all(
      Array.from(allParticipantIds).map(async (userId) => {
        const participant = safeVideoParticipants.find((p) => p.userId === userId);
        const stream = remoteStreams.get(userId);
        const screenStream = remoteScreenStreams.get(userId);
        
        // Obtener info del usuario (nombre y foto)
        const userInfo = await fetchUserInfo(userId);
        
        // Priorizar nombre del backend si está disponible
        const participantName = participant?.userName || participant?.userEmail || userInfo.name;
        
        return {
          id: userId,
          name: participantName,
          avatar: userInfo.avatar || undefined,
          isMuted: participant ? !participant.isAudioEnabled : true,
          isCameraOff: participant ? !participant.isVideoEnabled : true,
          isHost: currentRoom?.hostId === userId,
          stream: stream || undefined,
          screenStream: screenStream || undefined,
          isScreenSharing: participant?.isScreenSharing || false,
        };
      })
    ).then((remoteParticipants) => {
      // Ordenar participantes: host primero, luego por nombre
      const sortedParticipants = [...uiParticipants, ...remoteParticipants].sort((a, b) => {
        if (a.isHost && !b.isHost) return -1;
        if (!a.isHost && b.isHost) return 1;
        return a.name.localeCompare(b.name);
      });
      setParticipants(sortedParticipants);
    });
  }, [localStream, localScreenStream, remoteStreams, remoteScreenStreams, videoParticipants, isAudioEnabled, isVideoEnabled, isScreenSharing, currentRoom]);

  // Actualizar nombre de la reunión desde el room actual (prioridad al backend)
  useEffect(() => {
    if (currentRoom?.name) {
      console.log(`📝 [SALA] Actualizando nombre de reunión desde backend: ${currentRoom.name}`);
      setMeetingName(currentRoom.name);
    } else {
      // Fallback: leer datos de la reunión desde sessionStorage (solo si el backend no tiene nombre)
      try {
        const raw = sessionStorage.getItem(`meeting:${roomId}`);
        if (raw) {
          const payload = JSON.parse(raw);
          if (payload.title) {
            console.log(`📝 [SALA] Actualizando nombre de reunión desde sessionStorage: ${payload.title}`);
            setMeetingName(payload.title);
          }
        }
      } catch {
        // Ignorar errores
      }
    }
  }, [currentRoom, roomId]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Intentar leer datos creados desde la pantalla de creación de reunión
    try {
      const raw = sessionStorage.getItem(`meeting:${roomId}`);
      if (raw) {
        const payload = JSON.parse(raw);
        if (payload.title) setMeetingName(payload.title);
        if (Array.isArray(payload.participants) && payload.participants.length > 0) {
          setParticipants(payload.participants as Participant[]);
        }
      }
    } catch {
      // sessionStorage no disponible o JSON inválido
    }
  }, [roomId]);

  const handleLeave = () => {
    if (currentRoom?.chatRoomId) {
      leaveChatRoom(currentRoom.chatRoomId);
    }
    leaveVideoRoom();
    router.push('/abandonar?room=' + encodeURIComponent(roomId));
  };

  const handleToggleMute = async () => {
    try {
      await toggleAudio(!isAudioEnabled);
    } catch {
      console.error('Error toggling audio');
    }
  };

  const handleToggleCamera = async () => {
    try {
      await toggleVideo(!isVideoEnabled);
    } catch {
      console.error('Error toggling video');
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      await toggleScreenShare(!isScreenSharing);
    } catch {
      console.error('Error toggling screen share');
    }
  };

  // Estado para sidebar
  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('participants');
  const authInstance = getFirebaseAuth();
  const loggedUserId = authInstance?.currentUser?.uid || '';

  // Convertir mensajes del chat a formato de UI - usar useMemo para evitar re-renders innecesarios
  const messages = useMemo(() => {
    if (!currentRoom?.chatRoomId) {
      return [];
    }
    const roomMessages = chatMessages[currentRoom.chatRoomId] || [];
    const sorted = [...roomMessages].sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
    console.log(`💬 [SALA_PAGE] Mensajes actualizados para sala ${currentRoom.chatRoomId}: ${sorted.length} mensajes`);
    return sorted;
  }, [currentRoom?.chatRoomId, chatMessages]);

  const sendMessage = (content: string) => {
    if (currentRoom?.chatRoomId && isChatConnected) {
      sendChatMessage(currentRoom.chatRoomId, content);
    } else {
      console.warn('No se puede enviar mensaje: chat no disponible');
    }
  };

  if (!isConnected && !videoError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white">Conectando a la sala...</p>
        </div>
      </div>
    );
  }

  if (videoError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {videoError.message}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-900">
      {/* Header */}
      <MeetingHeader
        meetingName={meetingName}
        meetingCode={currentRoom?.code || roomId}
        currentTime={currentTime}
        onInviteClick={() => setShowInviteModal(true)}
      />

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        meetingCode={currentRoom?.code || roomId}
        meetingName={meetingName}
      />

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 gap-0">
        {/* Video Area - Full width on mobile, flex-1 on desktop */}
        <div className="flex-1 flex flex-col min-h-0 order-2 lg:order-1">
          <VideoGrid
            participants={participants}
            activeSpeakerId={participants[0]?.id || null}
            localVideoRef={localVideoRef}
          />
        </div>

        {/* Right column: Sidebar + ControlBar - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex w-64 flex-col min-h-0 order-1 lg:order-2 border-l border-zinc-800">
          <div className="flex-1 min-h-0 overflow-auto">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              participants={participants}
              messages={messages}
              onSendMessage={sendMessage}
              currentUserId={loggedUserId}
            />
          </div>

          <div className="border-t border-zinc-800">
            <ControlBar
              isMuted={!isAudioEnabled}
              isCameraOff={!isVideoEnabled}
              isScreenSharing={isScreenSharing}
              onToggleMute={() => handleToggleMute()}
              onToggleCamera={() => handleToggleCamera()}
              onToggleScreenShare={() => handleToggleScreenShare()}
              onLeave={handleLeave}
              roomId={roomId}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar - ControlBar always visible on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 safe-area-inset-bottom">
        <ControlBar
          isMuted={!isAudioEnabled}
          isCameraOff={!isVideoEnabled}
          isScreenSharing={isScreenSharing}
          onToggleMute={() => handleToggleMute()}
          onToggleCamera={() => handleToggleCamera()}
          onToggleScreenShare={() => handleToggleScreenShare()}
          onLeave={handleLeave}
          roomId={roomId}
        />
      </div>

      {/* Mobile Sidebar - Slide out from right */}
      <div className="lg:hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          participants={participants}
          messages={messages}
          onSendMessage={sendMessage}
          currentUserId={loggedUserId}
        />
      </div>
    </div>
  );
}
