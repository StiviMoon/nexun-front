 'use client';

import { useRouter } from 'next/navigation';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  roomId?: string;
}

export function ControlBar({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onLeave,
  roomId,
}: ControlBarProps) {
  const router = useRouter();

  const handleLeave = () => {
    try {
      onLeave();
    } catch (e) {
      // ignore
    }
    // Redirigir a la página de abandonar
    if (typeof roomId === 'string' && roomId.trim().length > 0 && roomId !== 'undefined' && roomId !== 'null') {
      router.push(`/abandonar?room=${encodeURIComponent(roomId)}`);
    } else {
      router.push('/abandonar');
    }
  };
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 bg-zinc-950 border-t border-zinc-800 safe-area-inset-bottom">
      {/* Mute Button */}
      <button
        onClick={onToggleMute}
        className={`
          p-2.5 sm:p-3 lg:p-4 rounded-full transition-colors
          ${isMuted
            ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950
        `}
        title={isMuted ? 'Activar micrófono' : 'Silenciar'}
        aria-label={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
        aria-pressed={isMuted}
      >
        {isMuted ? (
          <MicOff className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        ) : (
          <Mic className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        )}
      </button>

      {/* Camera Button */}
      <button
        onClick={onToggleCamera}
        className={`
          p-2.5 sm:p-3 lg:p-4 rounded-full transition-colors
          ${isCameraOff
            ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950
        `}
        title={isCameraOff ? 'Activar cámara' : 'Desactivar cámara'}
        aria-label={isCameraOff ? 'Activar cámara' : 'Desactivar cámara'}
        aria-pressed={isCameraOff}
      >
        {isCameraOff ? (
          <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        ) : (
          <Video className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        )}
      </button>

      {/* Leave Button */}
      <button
        onClick={handleLeave}
        className="p-2.5 sm:p-3 lg:p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
        title="Salir de la reunión"
        aria-label="Salir de la reunión"
      >
        <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
      </button>
    </div>
  );
}