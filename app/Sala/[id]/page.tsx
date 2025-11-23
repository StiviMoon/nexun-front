 'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MeetingHeader } from '@/components/ui/Sala/MeetingHeader';
import { VideoGrid } from '@/components/ui/Sala/VideoGrid';
import { Sidebar } from '@/components/ui/Sala/Sidebar';
import { ControlBar } from '@/components/ui/Sala/ControlBar';
import { useMeetingRoom } from '@/hooks/useMeetingRoom';
import { Participant } from '@/types/meetingRoom';

// Mock data para pruebas
const mockParticipants: Participant[] = [
  { id: '1', name: 'Maniaco', isMuted: false, isCameraOff: false},
  { id: '2', name: 'Bedon', isMuted: true, isCameraOff: true, isSpeaking: true },
  { id: '3', name: 'Mono', isMuted: true, isCameraOff: false },
  { id: '4', name: 'Daniels', isMuted: true, isCameraOff: true },
];

interface PageProps {
  params: { id: string };
}

export default function SalaPage({ params }: PageProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [meetingName, setMeetingName] = useState<string>('Nombre de la reunión');
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);

  // En componentes cliente, obtener params vía useParams()
  const routeParams = useParams();
  const roomId = (routeParams && (routeParams as any).id) || (params && params.id) || '';

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
  } = useMeetingRoom({ roomId });

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
    } catch (e) {
      // sessionStorage no disponible o JSON inválido
    }
  }, [roomId]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-900">
      {/* Header */}
      <MeetingHeader
        meetingName={meetingName}
        meetingCode={roomId}
        currentTime={currentTime}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-auto min-h-0">
        {/* Video Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <VideoGrid
            participants={participants}
            activeSpeakerId={activeSpeakerId || (participants[0] && participants[0].id) || '1'}
          />
        </div>

        {/* Right column: Sidebar + ControlBar */}
        <div className="w-64 flex flex-col min-h-0">
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
              roomId={roomId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
