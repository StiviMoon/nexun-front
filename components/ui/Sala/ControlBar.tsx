'use client';

import { useRouter } from 'next/navigation';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react';

interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing?: boolean; // nuevo prop
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare?: () => void; // nuevo prop
  onLeave: () => void;
  roomId?: string;
}

export function ControlBar({
  isMuted = true,
  isCameraOff = true,
  isScreenSharing = false,
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
        {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
      </button>

      {/* Screen Share Button */}
      {onToggleScreenShare && (
        <button
          onClick={onToggleScreenShare}
          className={`
            p-4 rounded-full transition-all duration-200
            ${isScreenSharing
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-2 border-blue-500/50'
              : 'bg-zinc-700/20 text-white hover:bg-zinc-700/30 border-2 border-zinc-600/50'
            }
          `}
          title={isScreenSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
        >
          <Monitor className="w-6 h-6" />
        </button>
      )}

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
