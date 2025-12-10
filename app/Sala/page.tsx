'use client';

import { useState, useEffect } from 'react';
import { MeetingHeader } from '@/components/ui/Sala/MeetingHeader';
import { VideoGrid } from '@/components/ui/Sala/VideoGrid';
import { Sidebar } from '@/components/ui/Sala/Sidebar';
import { ControlBar } from '@/components/ui/Sala/ControlBar';
import { useMeetingRoom } from '@/hooks/useMeetingRoom';

/**
 * Props de la página de sala de reunión.
 * @interface PageProps
 */
interface PageProps {
  /** Parámetros de la ruta, incluyendo el ID de la sala */
  params: { id: string };
}

/**
 * Página principal de la sala de reunión de video.
 * 
 * Esta página gestiona la interfaz de usuario para las reuniones de video,
 * incluyendo el header con información de la reunión, la cuadrícula de videos
 * de los participantes, la barra lateral con participantes y chat, y la barra
 * de controles para gestionar audio, video, pantalla compartida y salir.
 * 
 * El layout es responsive: en móviles, la barra de controles está fija en la
 * parte inferior y la barra lateral se muestra como un overlay deslizable.
 * En desktop, todo se muestra en un layout de columnas.
 * 
 * @param {PageProps} props - Props del componente
 * @param {PageProps.params} props.params - Parámetros de la ruta
 * @param {string} props.params.id - ID de la sala de reunión
 * 
 * @returns {JSX.Element} Componente de la página de sala
 */
export default function SalaPage({ params }: PageProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [meetingName, setMeetingName] = useState<string>('Nombre de la reunión');

  const {
    participants,
    activeTab,
    setActiveTab,
    isMuted,
    isCameraOff,
    isScreenSharing,
    activeSpeakerId,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    leaveRoom,
    messages,
    sendMessage,
    localVideoRef,
  } = useMeetingRoom({ roomId: params.id });

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
      const raw = sessionStorage.getItem(`meeting:${params.id}`);
      if (raw) {
        const payload = JSON.parse(raw);
        if (payload.title) setMeetingName(payload.title);
      }
    } catch {
      // sessionStorage no disponible o JSON inválido
    }
  }, [params.id]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-900">
      {/* Header */}
      <MeetingHeader
        meetingName={meetingName}
        meetingCode="ID REUNIÓN"
        currentTime={currentTime}
      />

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Video Area - Full width on mobile, flex-1 on desktop */}
        <div className="flex-1 flex flex-col min-h-0 order-2 lg:order-1">
          <VideoGrid
            participants={participants}
            activeSpeakerId={activeSpeakerId || (participants[0] && participants[0].id) || undefined}
            localVideoRef={localVideoRef}
          />
        </div>

        {/* Right column: Sidebar + ControlBar - Hidden on mobile, shown on desktop */}
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
              isScreenSharing={isScreenSharing}
              onToggleMute={toggleMute}
              onToggleCamera={toggleCamera}
              onToggleScreenShare={toggleScreenShare}
              onLeave={leaveRoom}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar - ControlBar always visible on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800">
        <ControlBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={toggleScreenShare}
          onLeave={leaveRoom}
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
        />
      </div>
    </div>
  );
}