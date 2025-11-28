
'use client';

import { useState, useCallback } from 'react';
import { Participant, SidebarTab } from '@/types/meetingRoom';
import { ChatMessage } from '@/types/chat';

interface UseMeetingRoomProps {
  roomId: string;
}

export function useMeetingRoom({ roomId }: UseMeetingRoomProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<SidebarTab>('participants');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // Aquí iría la lógica real para mutear el micrófono
  }, []);

  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => !prev);
    // Aquí iría la lógica real para apagar la cámara
  }, []);

  const leaveRoom = useCallback(() => {
    // Lógica para salir de la reunión (limpieza local).
    // No realizamos redirección aquí para permitir que el consumidor
    // de la API controle la navegación (por ejemplo, mostrar una página
    // de 'abandonaste' y permitir volver a unirse).
    // Aquí iría la lógica real para desconectar media, sockets, etc.
  }, []);

  const sendMessage = useCallback((content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      roomId,
      senderId: 'current-user',
      senderName: 'Tú',
      content,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prev) => [...prev, newMessage]);
  }, [roomId]);

  return {
    participants,
    messages,
    activeTab,
    setActiveTab,
    isMuted,
    isCameraOff,
    activeSpeakerId,
    toggleMute,
    toggleCamera,
    leaveRoom,
    sendMessage,
  };
}