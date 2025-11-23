'use client';

import Image from 'next/image';
import { User, MicOff, VideoOff, Mic, Video } from 'lucide-react';
import { Participant } from '@/types/meetingRoom';

interface ParticipantVideoProps {
  participant: Participant;
  isMain?: boolean;
  showWaveform?: boolean;
}

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
          <div className="flex items-center gap-2">
            {isMain ? (
              // Show mic icon (on/off) for main participant
              participant.isMuted ? (
                <MicOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              ) : (
                <Mic className={`text-green-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            ) : (
              // For non-main participants show only the 'off' icon when muted
              participant.isMuted && (
                <MicOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            )}

            {isMain ? (
              // Show camera icon (on/off) for main participant
              participant.isCameraOff ? (
                <VideoOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              ) : (
                <Video className={`text-green-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            ) : (
              // For non-main participants show only the 'off' icon when camera is off
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

// Componente de onda de audio
function Waveform() {
  return (
    <div className="flex items-center gap-1">
      {[...Array(9)].map((_, i) => {
        // Deterministic height per bar to avoid SSR/Client hydration mismatch
        // Use a simple formula based on index so server and client render identical markup
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