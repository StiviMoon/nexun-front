'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MeetingHeader } from '@/components/ui/Sala/MeetingHeader';
import { VideoGrid } from '@/components/ui/Sala/VideoGrid';
import { Sidebar } from '@/components/ui/Sala/Sidebar';
import { ControlBar } from '@/components/ui/Sala/ControlBar';
import { useMeetingRoom } from '@/hooks/useMeetingRoom';
import { Participant } from '@/types/meetingRoom';

// Mock data for testing
const mockParticipants: Participant[] = [
  { id: '1', name: 'Maniaco', isMuted: false, isCameraOff: false },
  { id: '2', name: 'Bedon', isMuted: true, isCameraOff: true, isSpeaking: true },
  { id: '3', name: 'Mono', isMuted: true, isCameraOff: false },
  { id: '4', name: 'Daniels', isMuted: true, isCameraOff: true },
];

/**
 * Props for SalaPage component.
 */
interface PageProps {
  /** Route params containing meeting ID */
  params: { id: string };
}

/**
 * SalaPage component renders a meeting room interface with video grid, sidebar, and control bar.
 *
 * param {PageProps} props - Component props
 * param {string} props.params.id - The ID of the meeting room
 * returns {JSX.Element} The meeting room page
 */
export default function SalaPage({ params }: PageProps): JSX.Element {
  /** Current local time formatted as string */
  const [currentTime, setCurrentTime] = useState('');

  /** Meeting title */
  const [meetingName, setMeetingName] = useState<string>('Nombre de la reunión');

  /** List of participants in the meeting */
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);

  // Get roomId from route params (fallback to prop params)
  const routeParams = useParams();
  const roomId = (routeParams && (routeParams as any).id) || (params && params.id) || '';

  // Meeting room hook providing state and actions
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

  /**
   * Update current time every second
   */
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

  /**
   * Load meeting info from sessionStorage if available
   */
  useEffect(() => {
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
      // sessionStorage unavailable or invalid JSON
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

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Video Area */}
        <div className="flex-1 flex flex-col min-h-0 order-2 lg:order-1">
          <VideoGrid
            participants={participants}
            activeSpeakerId={activeSpeakerId || (participants[0] && participants[0].id) || '1'}
          />
        </div>

        {/* Sidebar + ControlBar for desktop */}
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
              roomId={roomId}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 safe-area-inset-bottom">
        <ControlBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onLeave={leaveRoom}
          roomId={roomId}
        />
      </div>

      {/* Mobile Sidebar */}
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
