'use client';

import Image from 'next/image';
import { User, MicOff, VideoOff, Mic, Video } from 'lucide-react';
import { Participant } from '@/types/meetingRoom';

interface ParticipantVideoProps {
  /** Participant object containing name, avatar, mic/camera status */
  participant: Participant;
  /** If true, renders the participant as the main video (larger) */
  isMain?: boolean;
  /** If true, displays audio waveform instead of avatar when camera is off */
  showWaveform?: boolean;
}

/**
 * ParticipantVideo component
 *
 * Renders a participant's video tile in a meeting.
 * Displays:
 * - Video element if camera is on
 * - Avatar or waveform if camera is off
 * - Participant name and mic/camera status
 *
 * param participant - The participant data
 * param isMain - Whether this is the main participant (larger view)
 * param showWaveform - Show a waveform animation if camera is off
 */
export function ParticipantVideo({
  participant,
  isMain = false,
  showWaveform = false,
}: ParticipantVideoProps) {
  return (
    <div
      className={`
        relative bg-zinc-900 rounded-2xl overflow-hidden
        ${isMain ? 'h-full' : 'aspect-video'}
      `}
    >
      {/* Video or Avatar */}
      {participant.isCameraOff ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          {showWaveform ? (
            <Waveform />
          ) : participant.avatar ? (
            <Image
              src={participant.avatar}
              alt={participant.name}
              width={isMain ? 120 : 60}
              height={isMain ? 120 : 60}
              className={`rounded-full ${isMain ? 'w-28 h-28' : 'w-14 h-14'}`}
            />
          ) : (
            <div
              className={`
                rounded-full bg-zinc-700 flex items-center justify-center
                ${isMain ? 'w-28 h-28' : 'w-14 h-14'}
              `}
            >
              <User className={isMain ? 'w-12 h-12' : 'w-6 h-6'} />
            </div>
          )}
        </div>
      ) : (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />
      )}

      {/* Bottom Bar - Name & Status */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <span className={`text-white ${isMain ? 'text-base' : 'text-xs'} font-medium`}>
            {participant.name}
          </span>

          {/* Status Icons */}
          <div className="flex items-center gap-2">
            {/* Mic Icon */}
            {isMain ? (
              participant.isMuted ? (
                <MicOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              ) : (
                <Mic className={`text-green-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            ) : (
              participant.isMuted && (
                <MicOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            )}

            {/* Camera Icon */}
            {isMain ? (
              participant.isCameraOff ? (
                <VideoOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              ) : (
                <Video className={`text-green-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            ) : (
              participant.isCameraOff && (
                <VideoOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Waveform component
 *
 * Displays a small animated waveform to indicate audio activity
 */
function Waveform() {
  return (
    <div className="flex items-center gap-1">
      {[...Array(9)].map((_, i) => {
        // Deterministic height per bar to avoid SSR/Client hydration mismatch
        const height = 20 + ((i * 13) % 40); // range ~20-59
        return (
          <div
            key={i}
            className="w-1.5 bg-purple-500 rounded-full animate-pulse"
            style={{
              height: `${height}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        );
      })}
    </div>
  );
}
