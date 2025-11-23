'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { MeetingHistory } from '@/types/meetings';
import { formatHistoryDate } from '@/utils/meet/dataFormatters';

interface MeetingHistoryItemProps {
  meeting: MeetingHistory;
  onClick?: (meeting: MeetingHistory) => void;
}

export function MeetingHistoryItem({ meeting, onClick }: MeetingHistoryItemProps) {
  return (
    <div
      onClick={() => onClick?.(meeting)}
      className={`
        flex items-center gap-4
        bg-zinc-900/50 border border-zinc-800 rounded-2xl
        p-4
        hover:border-zinc-700 transition-colors
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Host Avatar */}
      {meeting.hostAvatar ? (
        <Image
          src={meeting.hostAvatar}
          alt={meeting.hostName}
          width={44}
          height={44}
          className="w-11 h-11 rounded-full ring-2 ring-zinc-700 shrink-0"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center ring-2 ring-zinc-700 shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Meeting Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium truncate">
          {meeting.title}
        </h3>
        <p className="text-sm text-zinc-500 truncate">
          {formatHistoryDate(meeting.date)}
        </p>
      </div>
    </div>
  );
}
