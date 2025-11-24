'use client';

import Image from 'next/image';

interface MeetingHeaderProps {
  /** The name of the current meeting */
  meetingName: string;
  /** The code of the meeting, displayed on large screens */
  meetingCode: string;
  /** The current time, typically in HH:MM format */
  currentTime: string;
}

/**
 * MeetingHeader component
 *
 * Displays the header section of a meeting interface, including:
 * - Application logo and name
 * - Current meeting name
 * - Meeting code (centered on large screens)
 * - Current time on the right
 *
 * param meetingName - The name of the current meeting
 * param meetingCode - The code of the meeting
 * param currentTime - The current time
 */
export function MeetingHeader({
  meetingName,
  meetingCode,
  currentTime,
}: MeetingHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 lg:px-4 lg:py-3 bg-zinc-950 border-b border-zinc-800">
      {/* Left - Logo & Meeting Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/LOGO_SOLO.svg"
            alt="Nexun"
            width={28}
            height={28}
            className="w-7 h-7"
            priority
          />
          <span className="text-cyan-400 font-semibold text-sm lg:text-sm">NEXUN</span>
        </div>
        <div className="w-px h-5 bg-zinc-700" />
        <span className="text-white text-sm truncate">{meetingName}</span>
      </div>

      {/* Center - Meeting Code */}
      <div className="text-zinc-400 text-sm font-medium hidden lg:block">
        {meetingCode}
      </div>

      {/* Right - Time */}
      <div className="text-zinc-400 text-sm flex-shrink-0">
        {currentTime}
      </div>
    </header>
  );
}
