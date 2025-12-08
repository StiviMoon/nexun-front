'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Participant, SidebarTab } from '@/types/meetingRoom';
import { ChatMessage } from '@/types/chat';
import { useVideoCall } from '@/app/hooks/useVideoCall';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';

/**
 * Props para el hook useMeetingRoom
 * @interface UseMeetingRoomProps
 */
interface UseMeetingRoomProps {
  /** ID de la sala de reunión */
  roomId: string;
}

/**
 * Hook para gestionar una sala de reunión de video
 * 
 * Integra useVideoCall con la UI, mapeando participantes y gestionando
 * el estado de la sala de reunión
 * 
 * @param {UseMeetingRoomProps} props - Props del hook
 * @param {string} props.roomId - ID de la sala de reunión
 * @returns {Object} Estado y funciones de la sala de reunión
 * 
 * @example
 * ```ts
 * const {
 *   participants,
 *   isMuted,
 *   isCameraOff,
 *   toggleMute,
 *   toggleCamera,
 *   toggleScreenShare
 * } = useMeetingRoom({ roomId: 'room-123' });
 * ```
 */
export function useMeetingRoom({ roomId }: UseMeetingRoomProps) {
  const { currentUser } = useAuthWithQuery();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<SidebarTab>('participants');
  const [activeSpeakerId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Usar el hook de video call que maneja WebRTC
  const {
    isConnected,
    isConnecting,
    connect,
    joinRoom,
    leaveRoom: leaveVideoRoom,
    localStream,
    remoteStreams,
    participants: videoParticipants,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    getLocalStream,
  } = useVideoCall(true); // useGateway = true

  // Conectar y unirse a la sala automáticamente
  useEffect(() => {
    if (!currentUser) return;

    const initializeRoom = async () => {
      try {
        // Conectar al servicio de video
        if (!isConnected && !isConnecting) {
          await connect();
        }

        // Esperar un momento para que la conexión se establezca
        if (isConnected) {
          // Obtener stream local
          await getLocalStream();
          
          // Unirse a la sala
          await joinRoom(roomId);
        }
      } catch (error) {
        console.error('Error inicializando sala:', error);
      }
    };

    initializeRoom();

    return () => {
      // Limpiar al desmontar
      leaveVideoRoom();
    };
  }, [currentUser, roomId, isConnected, isConnecting, connect, joinRoom, leaveVideoRoom, getLocalStream]);

  // Mapear VideoParticipant a Participant con streams
  useEffect(() => {
    const mappedParticipants: Participant[] = [];

    // Agregar participante local
    if (currentUser && localStream) {
      mappedParticipants.push({
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.firstName || currentUser.email || 'Tú',
        avatar: currentUser.photoURL || undefined,
        isMuted: !isAudioEnabled,
        isCameraOff: !isVideoEnabled,
        stream: localStream,
      });
    }

    // Agregar participantes remotos
    videoParticipants.forEach((videoParticipant) => {
      const remoteStream = remoteStreams.get(videoParticipant.userId);
      
      mappedParticipants.push({
        id: videoParticipant.userId,
        name: videoParticipant.userName || `Usuario ${videoParticipant.userId.slice(0, 8)}`,
        isMuted: !videoParticipant.isAudioEnabled,
        isCameraOff: !videoParticipant.isVideoEnabled,
        stream: remoteStream || undefined,
      });
    });

    setParticipants(mappedParticipants);
  }, [currentUser, localStream, videoParticipants, remoteStreams, isAudioEnabled, isVideoEnabled]);

  // Asignar stream local al video ref
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((err) => {
        console.warn('Error reproduciendo video local:', err);
      });
    }
  }, [localStream]);

  const toggleMute = useCallback(() => {
    toggleAudio(!isAudioEnabled);
  }, [toggleAudio, isAudioEnabled]);

  const toggleCamera = useCallback(() => {
    toggleVideo(!isVideoEnabled);
  }, [toggleVideo, isVideoEnabled]);

  const handleToggleScreenShare = useCallback(async () => {
    await toggleScreenShare(!isScreenSharing);
  }, [toggleScreenShare, isScreenSharing]);

  const leaveRoom = useCallback(() => {
    leaveVideoRoom();
  }, [leaveVideoRoom]);

  const sendMessage = useCallback((content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      roomId,
      senderId: currentUser?.uid || 'current-user',
      senderName: currentUser?.displayName || currentUser?.firstName || 'Tú',
      content,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prev) => [...prev, newMessage]);
  }, [roomId, currentUser]);

  return {
    participants,
    messages,
    activeTab,
    setActiveTab,
    isMuted: !isAudioEnabled,
    isCameraOff: !isVideoEnabled,
    isScreenSharing: isScreenSharing || false,
    activeSpeakerId,
    toggleMute,
    toggleCamera,
    toggleScreenShare: handleToggleScreenShare,
    leaveRoom,
    sendMessage,
    localVideoRef,
  };
}
