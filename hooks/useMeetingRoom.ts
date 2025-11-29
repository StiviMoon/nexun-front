'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Participant, SidebarTab, ChatMessage } from '@/types/meetingRoom';

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

  // 👉 stream de audio y video real
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // referencia interna para evitar pedir permisos 2 veces
  const requestingRef = useRef(false);

  /**
   * solicitar permisos y obtener stream local
   */
  const initLocalMedia = useCallback(async () => {
    if (requestingRef.current) return;
    requestingRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);

      // dejar mic/cam encendidos inicialmente
      setIsMuted(false);
      setIsCameraOff(false);

      // 👉 Aquí en el futuro: enviar este stream a Peer.js
      // backend señalización: enviar "ready-to-connect"

    } catch (err) {
      console.error('no se pudo acceder a la camara/microfono:', err);
    }
  }, []);

  /**
   * encender / apagar micro (activando track.enabled)
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newState = !prev;

      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !newState; // si está muteado → audioTrack.enabled = false
        }
      }

      return newState;
    });
  }, [localStream]);

  /**
   * encender / apagar camara
   */
  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => {
      const newState = !prev;

      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !newState;
        }
      }

      return newState;
    });
  }, [localStream]);

  /**
   * cleanup al salir
   */
  const leaveRoom = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    // 👉 en el futuro aquí desconectas sockets / peer
  }, [localStream]);

  /**
   * enviar mensaje
   */
  const sendMessage = useCallback((content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'current-user',
      senderName: 'Tú',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);

    // 👉 en el futuro: enviar mensaje al backend vía socket
  }, []);

  /**
   * iniciar media apenas el usuario entra a la sala
   */
  useEffect(() => {
    initLocalMedia();
  }, [initLocalMedia]);

  return {
    participants,
    messages,
    activeTab,
    setActiveTab,
    isMuted,
    isCameraOff,
    activeSpeakerId,
    localStream,        // ➜ IMPORTANTÍSIMO: ahora exportamos el stream real
    toggleMute,
    toggleCamera,
    leaveRoom,
    sendMessage,
  };
}
