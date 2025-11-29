'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, MicOff, VideoOff } from 'lucide-react';
import { Participant } from '@/types/meetingRoom';

interface ParticipantListItemProps {
  participant: Participant;
}

export function ParticipantListItem({ participant }: ParticipantListItemProps) {
  const [src, setSrc] = useState<string | undefined>(participant.avatar);

  useEffect(() => {
    setSrc(participant.avatar);
  }, [participant.avatar]);

  const handleImageLoad = (img?: HTMLImageElement | null) => {
    if (!img || img.naturalWidth === 0) {
      setSrc('/team/default.svg');
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors">
      {/* Avatar */}
      {src ? (
        <Image
          src={src}
          alt={participant.name}
          width={44}
          height={44}
          className="w-11 h-11 rounded-full ring-2 ring-zinc-700 object-cover"
          onLoadingComplete={handleImageLoad}
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-zinc-700 flex items-center justify-center ring-2 ring-zinc-700">
          <User className="w-5 h-5 text-zinc-400" />
        </div>
      )}

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{participant.name}</p>
      </div>

      {/* Status Icons */}
      <div className="flex items-center gap-1.5">
        <MicOff className={`w-4 h-4 ${participant.isMuted ? 'text-zinc-500' : 'text-zinc-700'}`} />
        <VideoOff className={`w-4 h-4 ${participant.isCameraOff ? 'text-zinc-500' : 'text-zinc-700'}`} />
      </div>
    </div>
  );
}