'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Participant, SidebarTab } from '@/types/meetingRoom';
import { ChatMessage } from '@/types/chat';
import { useVideoCall } from '@/app/hooks/useVideoCall';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';

interface UseMeetingRoomProps {
  roomId: string;
}

export function useMeetingRoom({ roomId }: UseMeetingRoomProps) {
  const { currentUser } = useAuthWithQuery();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<SidebarTab>('participants');
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

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
    toggleAudio,
    toggleVideo,
    getLocalStream,
  } = useVideoCall(true);

  // conectar y unirse automaticamente
  useEffect(() => {
    if (!currentUser) return;

    const initializeRoom = async () => {
      try {
        if (!isConnected && !isConnecting) {
          await connect();
        }

        if (isConnected) {
          await getLocalStream();
          await joinRoom(roomId);
        }
      } catch (error) {
        console.error('error inicializando sala:', error);
      }
    };

    initializeRoom();
    return () => {
      leaveVideoRoom();
    };
  }, [
    currentUser,
    roomId,
    isConnected,
    isConnecting,
    connect,
    joinRoom,
    leaveVideoRoom,
    getLocalStream
  ]);

  // mapear participantes
  useEffect(() => {
    const mapped: Participant[] = [];

    if (currentUser && localStream) {
      mapped.push({
        id: currentUser.uid,
        name:
          currentUser.displayName ||
          (currentUser as any).firstName ||
          currentUser.email ||
          'tu',
        avatar: currentUser.photoURL || undefined,
        isMuted: !isAudioEnabled,
        isCameraOff: !isVideoEnabled,
        stream: localStream,
      });
    }

    videoParticipants.forEach((vp) => {
      const remoteStream = remoteStreams.get(vp.userId);
      mapped.push({
        id: vp.userId,
        name: vp.userName || `usuario ${vp.userId.slice(0, 8)}`,
        isMuted: !vp.isAudioEnabled,
        isCameraOff: !vp.isVideoEnabled,
        stream: remoteStream || undefined,
      });
    });

    setParticipants(mapped);
  }, [
    currentUser,
    localStream,
    videoParticipants,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled
  ]);

  // asignar stream local al video ref
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((err) => {
        console.warn('error reproduciendo video local:', err);
      });
    }
  }, [localStream]);

  // mutear microfono
  const toggleMute = useCallback(() => {
    toggleAudio(!isAudioEnabled);
  }, [toggleAudio, isAudioEnabled]);

  // encender/apagar camara usando replaceTrack
  const toggleCamera = useCallback(async () => {
    try {
      if (!localStream) {
        await getLocalStream();
      }

      const stream = localStream || (localVideoRef.current?.srcObject as MediaStream | null);
      if (!stream) {
        console.warn('[toggleCamera] no hay stream local');
        return;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        console.warn('[toggleCamera] no existe el track de video');
        return;
      }

      if (isVideoEnabled) {
        // desactivar track local
        videoTrack.enabled = false;
        toggleVideo(false);
      } else {
        // activar track local
        videoTrack.enabled = true;
        toggleVideo(true);
      }

      // If peer senders need updating, handle that inside the useVideoCall hook and expose a method;
      // keeping this hook free of direct peer connection manipulation avoids referencing pcMap here.
    } catch (err) {
      console.error('error toggling camera:', err);
    }
  }, [localStream, isVideoEnabled, toggleVideo, getLocalStream]);
  // salir de la sala
  const leaveRoom = useCallback(() => {
    leaveVideoRoom();
  }, [leaveVideoRoom]);

  // chat
  const sendMessage = useCallback(
    (content: string) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        roomId,
        senderId: currentUser?.uid || 'current-user',
        senderName:
          currentUser?.displayName ||
          (currentUser as any)?.firstName ||
          'tu',
        content,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [roomId, currentUser]
  );

  return {

    participants,
    messages,
    activeTab,
    setActiveTab,
    isMuted: !isAudioEnabled,
    isCameraOff: !isVideoEnabled,
    activeSpeakerId,
    toggleMute,
    toggleCamera,
    leaveRoom,
    sendMessage,
    localVideoRef,
  };
}
