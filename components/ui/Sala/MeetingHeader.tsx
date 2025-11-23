'use client';

import Image from 'next/image';

interface MeetingHeaderProps {
  meetingName: string;
  meetingCode: string;
  currentTime: string;
}

export function MeetingHeader({
  meetingName,
  meetingCode,
  currentTime,
}: MeetingHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
      {/* Left - Logo & Meeting Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Image
            src="/LOGO_SOLO.svg"
            alt="Nexun"
            width={28}
            height={28}
            className="w-7 h-7"
          />
          <span className="text-cyan-400 font-semibold text-sm">NEXUN</span>
        </div>
        <div className="w-px h-5 bg-zinc-700" />
        <span className="text-white text-sm">{meetingName}</span>
      </div>

      {/* Center - Meeting Code */}
      <div className="text-zinc-400 text-sm font-medium">
        {meetingCode}
      </div>

      {/* Right - Time */}
      <div className="text-zinc-400 text-sm">
        {currentTime}
      </div>
    </header>
  );
}