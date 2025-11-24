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

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 min-h-0 lg:gap-4 lg:p-4 pb-20 lg:pb-4">
      {/* Main Video */}
      {mainParticipant && (
        <div className="flex-1">
          <ParticipantVideo participant={mainParticipant} isMain />
        </div>
      )}

      {/* Thumbnail Grid */}
      {otherParticipants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-3">
          {otherParticipants.slice(0, 3).map((participant) => (
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