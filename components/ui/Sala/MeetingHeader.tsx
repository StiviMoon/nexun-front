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
    <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-zinc-950 border-b border-zinc-800">
      {/* Left - Logo & Meeting Name */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Image
            src="/LOGO_SOLO.svg"
            alt="Nexun"
            width={28}
            height={28}
            className="w-6 h-6 sm:w-7 sm:h-7"
            priority
          />
          <span className="text-cyan-400 font-semibold text-xs sm:text-sm hidden xs:inline">NEXUN</span>
        </div>
        <div className="w-px h-4 sm:h-5 bg-zinc-700 hidden sm:block" />
        <span className="text-white text-xs sm:text-sm truncate ml-1 sm:ml-0">{meetingName}</span>
      </div>

      {/* Center - Meeting Code - Hidden on small screens */}
      <div className="text-zinc-400 text-xs sm:text-sm font-medium hidden md:block">
        {meetingCode}
      </div>

      {/* Right - Time */}
      <div className="text-zinc-400 text-xs sm:text-sm flex-shrink-0 ml-2">
        {currentTime}
      </div>
    </header>
  );
}