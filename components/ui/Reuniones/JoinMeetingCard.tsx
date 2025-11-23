'use client';

import { useState } from 'react';
import { MediaStatusIndicator } from './MediaStatusIndicator';
import { MediaStatus } from '@/types/meetings';
import { redirect } from "next/navigation";

interface JoinMeetingCardProps {
  onJoin: (codeOrUrl: string, mediaStatus: MediaStatus) => void;
  isJoining?: boolean;
}

export function JoinMeetingCard({ onJoin, isJoining = false }: JoinMeetingCardProps) {
  const [codeOrUrl, setCodeOrUrl] = useState('');
  const [mediaStatus, setMediaStatus] = useState<MediaStatus>({
    micEnabled: false,
    cameraEnabled: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeOrUrl.trim()) {
      onJoin(codeOrUrl.trim(), mediaStatus);
    }
  };

  const toggleMic = () => {
    setMediaStatus((prev) => ({ ...prev, micEnabled: !prev.micEnabled }));
  };

  const toggleCamera = () => {
    setMediaStatus((prev) => ({ ...prev, cameraEnabled: !prev.cameraEnabled }));
  };

  return (
    <section className="space-y-4">
      <h2 className="text-white text-base font-normal">
        Únete con un código o enlace
      </h2>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={codeOrUrl}
            onChange={(e) => setCodeOrUrl(e.target.value)}
            placeholder="Ingresa el código o enlace de la reunión..."
            className="
              flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3
              text-white text-sm placeholder-zinc-600
              focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40
              transition-all
            "
          />
          <button
            type="submit"
            disabled={!codeOrUrl.trim() || isJoining}
            className="
              px-6 py-3 bg-zinc-600 hover:bg-purple-500
              text-white text-sm font-medium rounded-xl
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors min-w-[100px]
            "
          >
            {isJoining ? 'Uniendo...' : 'Unirse'}
          </button>
        </form>

        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-zinc-500">
            Tu cámara y micrófono están desactivados. Puedes activarlos dentro de la reunión.
          </p>

          <MediaStatusIndicator
            status={mediaStatus}
            onToggleMic={toggleMic}
            onToggleCamera={toggleCamera}
            interactive
          />
        </div>
      </div>
    </section>
  );
}
