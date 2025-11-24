'use client';

import { useRouter } from 'next/navigation';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface ControlBarProps {
  /** Whether the microphone is muted */
  isMuted: boolean;

  /** Whether the camera is off */
  isCameraOff: boolean;

  /** Callback to toggle microphone */
  onToggleMute: () => void;

  /** Callback to toggle camera */
  onToggleCamera: () => void;

  /** Callback to leave the meeting */
  onLeave: () => void;

  /** Optional room ID used for redirect after leaving */
  roomId?: string;
}

/**
 * A control bar component for in-meeting actions:
 * - Toggle microphone
 * - Toggle camera
 * - Leave meeting
 *
 * Handles redirecting to a leave/exit page using roomId if provided.
 *
 * param {ControlBarProps} props
 * returns JSX.Element
 */
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
    // Redirect to leave page with optional room query
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
          p-4 rounded-full transition-colors
          ${isMuted
            ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            : 'bg-zinc-800 text-white hover:bg-zinc-700'
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
          p-4 rounded-full transition-colors
          ${isCameraOff
            ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }
        `}
        title={isCameraOff ? 'Activar cámara' : 'Desactivar cámara'}
      >
        {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
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
