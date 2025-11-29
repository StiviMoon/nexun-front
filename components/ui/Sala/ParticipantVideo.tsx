'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { User, MicOff, VideoOff, Mic, Video } from 'lucide-react';
import { Participant } from '@/types/meetingRoom';

interface ParticipantVideoProps {
  participant: Participant;
  isMain?: boolean;
  showWaveform?: boolean;
  localStream?: MediaStream | null; // <-- ok
}

/**
 * ParticipantVideo actualizada para mostrar cámara real del usuario local
 */
export function ParticipantVideo({
  participant,
  isMain = false,
  showWaveform = false,
  localStream,
}: ParticipantVideoProps) {
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isLocalUser = participant.id === 'local-user';
  const cameraOff = participant.isCameraOff;

  /**
   * asignar el stream local solo si:
   * - es el participante local
   * - hay stream
   */
  useEffect(() => {
    if (isLocalUser && localStream && videoRef.current) {
      // solo reasignar si el stream realmente cambió
      if (videoRef.current.srcObject !== localStream) {
        videoRef.current.srcObject = localStream;
      }
    }
  }, [isLocalUser, localStream]);

  return (
    <div
      className={`
        relative bg-zinc-900 rounded-2xl overflow-hidden
        ${isMain ? 'h-full' : 'aspect-video'}
      `}
    >
      {/* VIDEO O AVATAR */}
      {!cameraOff ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted={isLocalUser}
        />
      ) : (
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
      )}

      {/* BARRA INFERIOR */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <span className={`text-white ${isMain ? 'text-base' : 'text-xs'} font-medium`}>
            {isLocalUser ? 'Tú' : participant.name}
          </span>

          {/* ICONOS */}
          <div className="flex items-center gap-2">
            {participant.isMuted ? (
              <MicOff className={`${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-zinc-400`} />
            ) : (
              <Mic className={`${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-green-400`} />
            )}

            {participant.isCameraOff ? (
              <VideoOff className={`${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-zinc-400`} />
            ) : (
              <Video className={`${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-green-400`} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Waveform */
function Waveform() {
  return (
    <div className="flex items-center gap-1">
      {[...Array(9)].map((_, i) => {
        const height = 20 + ((i * 13) % 40);
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
