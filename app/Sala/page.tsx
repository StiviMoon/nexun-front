'use client';

import { useState, useEffect } from 'react';
import { MeetingHeader } from '@/components/ui/Sala/MeetingHeader';
import { VideoGrid } from '@/components/ui/Sala/VideoGrid';
import { Sidebar } from '@/components/ui/Sala/Sidebar';
import { ControlBar } from '@/components/ui/Sala/ControlBar';
import { useMeetingRoom } from '@/hooks/useMeetingRoom';
import { Participant } from '@/types/meetingRoom';

interface PageProps {
  params: { id: string };
}

export default function SalaPage({ params }: PageProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [meetingName, setMeetingName] = useState('Nombre de la reunion');

  // estado de participantes
  const [participants, setParticipants] = useState<Participant[]>([]);

  // estado del stream local
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const {
    activeTab,
    setActiveTab,
    isMuted,
    isCameraOff,
    activeSpeakerId,
    toggleMute,
    toggleCamera,
    leaveRoom,
    messages,
    sendMessage,
  } = useMeetingRoom({ roomId: params.id });

  // reloj
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

  // solicitar camara y microfono
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
      })
      .catch(err => {
        console.error('error al acceder a la camara/microfono:', err);
      });
  }, []);

  // actualizar el participante local
  useEffect(() => {
    setParticipants(prev => {
      const others = prev.filter(p => p.id !== 'local-user');

      return [
        {
          id: 'local-user',
          name: 'tu',
          isMuted: isMuted,
          isCameraOff: isCameraOff,
          isHost: true,
          stream: localStream || undefined,
        },
        ...others,
      ];
    });
  }, [isMuted, isCameraOff, localStream]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-900">
      {/* Header */}
      <MeetingHeader
        meetingName={meetingName}
        meetingCode={params.id}
        currentTime={currentTime}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* zona de video */}
        <div className="flex-1 flex flex-col min-h-0 order-2 lg:order-1">
          <VideoGrid
            participants={participants}
            activeSpeakerId={activeSpeakerId || 'local-user'}
            localStream={localStream}
          />
        </div>

        {/* sidebar escritorio */}
        <div className="hidden lg:flex w-64 flex-col min-h-0 order-1 lg:order-2">
          <div className="flex-1 min-h-0 overflow-auto">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              participants={participants}
              messages={messages}
              onSendMessage={sendMessage}
            />
          </div>

          <div>
            <ControlBar
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              onToggleMute={toggleMute}
              onToggleCamera={toggleCamera}
              onLeave={leaveRoom}
            />
          </div>
        </div>
      </div>

      {/* barra inferior mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800">
        <ControlBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onLeave={leaveRoom}
        />
      </div>

      {/* sidebar mobile */}
      <div className="lg:hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          participants={participants}
          messages={messages}
          onSendMessage={sendMessage}
        />
      </div>
    </div>
  );
}
