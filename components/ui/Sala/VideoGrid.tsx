'use client';

import { Participant } from '@/types/meetingRoom';
import { ParticipantVideo } from './ParticipantVideo';

interface VideoGridProps {
  participants: Participant[];
  activeSpeakerId?: string | null;
  localStream: MediaStream | null; 
}

export function VideoGrid({ participants, activeSpeakerId, localStream }: VideoGridProps) {
  if (participants.length === 0) return null;

  const mainParticipant =
    participants.find((p) => p.id === activeSpeakerId) || participants[0];

  const otherParticipants = participants.filter(
    (p) => p.id !== mainParticipant?.id
  );

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 min-h-0 lg:gap-4 lg:p-4 pb-20 lg:pb-4">
      
      {/* Main Video */}
      <div className="flex-1">
        <ParticipantVideo
          participant={mainParticipant}
          isMain
          localStream={localStream} // <--- aqui se envia el stream local propio
        />
      </div>

      {/* Other participants */}
      {otherParticipants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-3">
          {otherParticipants.slice(0, 3).map((p) => (
            <ParticipantVideo
              key={p.id}
              participant={p}
              showWaveform={p.isCameraOff && p.isSpeaking}
            />
          ))}
        </div>
      )}
    </div>
  );
}
