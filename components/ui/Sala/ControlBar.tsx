 'use client';

import { useRouter } from 'next/navigation';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';

interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
  roomId?: string;
}

export function ControlBar({
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
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
    <div className="flex items-center justify-center gap-2 p-2 lg:gap-3 lg:p-3 bg-zinc-950 border-t border-zinc-800">
      {/* Mute Button */}
      <button
        onClick={onToggleMute}
        className={`
          p-2.5 rounded-full transition-all duration-200 shrink-0
          ${isMuted
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
          }
        `}
        title={isMuted ? 'Activar micrófono' : 'Silenciar'}
        aria-label={isMuted ? 'Activar micrófono' : 'Silenciar'}
      >
        {isMuted ? <MicOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Mic className="w-4 h-4 lg:w-5 lg:h-5" />}
      </button>

      {/* Camera Button */}
      <button
        onClick={onToggleCamera}
        className={`
          p-2.5 rounded-full transition-all duration-200 shrink-0
          ${isCameraOff
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
          }
        `}
        title={isCameraOff ? 'Activar cámara' : 'Desactivar cámara'}
        aria-label={isCameraOff ? 'Activar cámara' : 'Desactivar cámara'}
      >
        {isCameraOff ? (
          <VideoOff className="w-4 h-4 lg:w-5 lg:h-5" />
        ) : (
          <Video className="w-4 h-4 lg:w-5 lg:h-5" />
        )}
      </button>

      {/* Screen Share Button */}
      <button
        onClick={onToggleScreenShare}
        className={`
          p-2.5 rounded-full transition-all duration-200 shrink-0
          ${isScreenSharing
            ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50'
            : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600/50 border border-zinc-600/50'
          }
        `}
        title={isScreenSharing ? 'Detener compartir pantalla' : 'Compartir pantalla'}
        aria-label={isScreenSharing ? 'Detener compartir pantalla' : 'Compartir pantalla'}
      >
        {isScreenSharing ? (
          <MonitorOff className="w-4 h-4 lg:w-5 lg:h-5" />
        ) : (
          <Monitor className="w-4 h-4 lg:w-5 lg:h-5" />
        )}
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-zinc-700 mx-1" />

      {/* Leave Button */}
      <button
        onClick={handleLeave}
        className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
        title="Salir de la reunión"
        aria-label="Salir de la reunión"
      >
        <PhoneOff className="w-4 h-4 lg:w-5 lg:h-5" />
      </button>
    </div>
  );
}