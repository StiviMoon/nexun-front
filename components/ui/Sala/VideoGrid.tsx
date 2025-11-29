'use client';

import { RefObject } from 'react';
import { Participant } from '@/types/meetingRoom';
import { ParticipantVideo } from './ParticipantVideo';

interface VideoGridProps {
  participants: Participant[];
  activeSpeakerId?: string | null;
  localVideoRef?: RefObject<HTMLVideoElement | null>;
}

export function VideoGrid({ participants, activeSpeakerId, localVideoRef }: VideoGridProps) {
  // Si no hay participantes, mostrar mensaje de espera
  if (participants.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-zinc-400">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-lg mb-2">Esperando participantes...</p>
          <p className="text-sm text-zinc-500">Tu video se mostrará aquí cuando otros se unan</p>
        </div>
      </div>
    );
  }

  // El primer participante siempre es el local
  const localParticipant = participants[0];
  const mainParticipant = participants.find((p) => p.id === activeSpeakerId) || localParticipant || participants[0];
  const otherParticipants = participants.filter((p) => p.id !== mainParticipant?.id);

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 min-h-0 lg:gap-4 lg:p-4 pb-20 lg:pb-4">
      {/* Main Video - Siempre mostrar el principal (usuario local si no hay otros, o el que está hablando) */}
      {mainParticipant && (
        <div className="flex-1 min-h-0">
          <ParticipantVideo 
            participant={mainParticipant} 
            isMain 
            videoRef={mainParticipant.id === localParticipant?.id ? localVideoRef : undefined}
          />
        </div>
      )}

      {/* Thumbnail Grid - Mostrar todos los demás participantes (incluyendo local si no es el principal) */}
      {otherParticipants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-3 flex-shrink-0">
          {otherParticipants.map((participant) => (
            <ParticipantVideo
              key={participant.id}
              participant={participant}
              showWaveform={participant.isCameraOff && participant.isSpeaking}
              videoRef={participant.id === localParticipant?.id ? localVideoRef : undefined}
            />
          ))}
        </div>
      )}
      
      {/* Mensaje cuando solo hay un participante (el usuario local) */}
      {participants.length === 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-zinc-400 bg-zinc-900/80 backdrop-blur-sm px-6 py-4 rounded-lg border border-zinc-800">
            <p className="text-sm">Estás solo en la reunión</p>
            <p className="text-xs text-zinc-500 mt-1">Comparte el código de la reunión para que otros se unan</p>
          </div>
        </div>
      )}
    </div>
  );
}