'use client';

import { Participant } from '@/types/meetingRoom';
import { ParticipantVideo } from './ParticipantVideo';

interface VideoGridProps {
  participants: Participant[];
  activeSpeakerId?: string | null;
}

export function VideoGrid({ participants, activeSpeakerId }: VideoGridProps) {
  const mainParticipant = participants.find((p) => p.id === activeSpeakerId) || participants[0];
  const otherParticipants = participants.filter((p) => p.id !== mainParticipant?.id);

  if (participants.length === 0) return null;

  // Responsive grid calculation
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 sm:grid-cols-2';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="flex-1 flex flex-col gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 min-h-0 pb-20 lg:pb-4">
      {/* Main Video */}
      {mainParticipant && (
        <div className="flex-1 min-h-0">
          <ParticipantVideo participant={mainParticipant} isMain />
        </div>
      )}

      {/* Thumbnail Grid - Responsive */}
      {otherParticipants.length > 0 && (
        <div className={`grid ${getGridCols(otherParticipants.length)} gap-2 sm:gap-3`}>
          {otherParticipants.map((participant) => (
            <ParticipantVideo
              key={participant.id}
              participant={participant}
              showWaveform={participant.isCameraOff && participant.isSpeaking}
            />
          ))}
        </div>
      )}
    </div>
  );
}