'use client';

import { MicOff, Mic, VideoOff, Video } from 'lucide-react';
import { MediaStatus } from '@/types/meetings';

interface MediaStatusIndicatorProps {
  status: MediaStatus;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  interactive?: boolean;
}

export function MediaStatusIndicator({
  status,
  onToggleMic,
  onToggleCamera,
  interactive = false,
}: MediaStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={interactive ? onToggleMic : undefined}
        disabled={!interactive}
        className={`
          p-2 rounded-lg transition-all
          ${interactive ? 'hover:bg-zinc-700 cursor-pointer' : 'cursor-default'}
          ${status.micEnabled ? 'text-cyan-400' : 'text-zinc-500'}
        `}
        title={status.micEnabled ? 'Micrófono activado' : 'Micrófono desactivado'}
      >
        {status.micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      <button
        type="button"
        onClick={interactive ? onToggleCamera : undefined}
        disabled={!interactive}
        className={`
          p-2 rounded-lg transition-all
          ${interactive ? 'hover:bg-zinc-700 cursor-pointer' : 'cursor-default'}
          ${status.cameraEnabled ? 'text-cyan-400' : 'text-zinc-500'}
        `}
        title={status.cameraEnabled ? 'Cámara activada' : 'Cámara desactivada'}
      >
        {status.cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>
    </div>
  );
}
