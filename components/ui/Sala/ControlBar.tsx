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
    } catch {
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
    <div className="flex items-center justify-center gap-4 p-4 lg:gap-4 lg:p-4 bg-zinc-950 border-t border-zinc-800">
      {/* Mute Button */}
      <button
        onClick={onToggleMute}
        className={`
          p-4 rounded-full transition-all duration-200
          ${isMuted
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-2 border-red-500/50'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-2 border-green-500/50'
          }
        `}
        title={isMuted ? 'Activar micrófono' : 'Silenciar'}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      {/* Camera Button */}
      <button
        onClick={onToggleCamera}
        className={`
          p-4 rounded-full transition-all duration-200
          ${isCameraOff
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-2 border-red-500/50'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-2 border-green-500/50'
          }
        `}
        title={isCameraOff ? 'Activar cámara' : 'Desactivar cámara'}
      >
        {isCameraOff ? (
          <VideoOff className="w-6 h-6" />
        ) : (
          <Video className="w-6 h-6" />
        )}
      </button>

      {/* Leave Button */}
      <button
        onClick={handleLeave}
        className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
        title="Salir de la reunión"
      >
        <PhoneOff className="w-6 h-6" />
      </button>
    </div>
  );
}