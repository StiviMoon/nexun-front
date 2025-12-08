'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Users } from 'lucide-react';

interface MeetingHeaderProps {
  meetingName: string;
  meetingCode: string;
  currentTime: string;
  onInviteClick?: () => void;
}

export function MeetingHeader({
  meetingName,
  meetingCode,
  currentTime,
  onInviteClick,
}: MeetingHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(meetingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando código:', err);
    }
  };


  return (
    <header className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 bg-zinc-950 border-b border-zinc-800">
      {/* Left - Logo & Meeting Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
          <Image
            src="/LOGO_SOLO.svg"
            alt="Nexun"
            width={28}
            height={28}
            className="w-7 h-7 lg:w-8 lg:h-8"
            priority
          />
          <span className="text-cyan-400 font-semibold text-sm lg:text-base">NEXUN</span>
        </div>
        <div className="w-px h-6 bg-zinc-700" />
        <span className="text-white text-sm lg:text-base truncate">{meetingName}</span>
      </div>

      {/* Center - Meeting Code with Copy Button */}
      <div className="hidden lg:flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
          <span className="text-zinc-400 text-xs lg:text-sm">Código:</span>
          <span className="text-white text-sm lg:text-base font-mono font-medium">{meetingCode}</span>
          <button
            onClick={handleCopyCode}
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
            title="Copiar código"
            aria-label="Copiar código"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        </div>
        {onInviteClick && (
          <button
            onClick={onInviteClick}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors text-sm font-medium"
            title="Invitar participantes"
            aria-label="Invitar participantes"
          >
            <Users className="w-4 h-4" />
            <span className="hidden xl:inline">Invitar</span>
          </button>
        )}
      </div>

      {/* Mobile - Meeting Code */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 rounded border border-zinc-800"
          title="Copiar código"
          aria-label="Copiar código"
        >
          <span className="text-white text-xs font-mono">{meetingCode.slice(0, 8)}...</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>
      </div>

      {/* Right - Time */}
      <div className="text-zinc-400 text-sm lg:text-base shrink-0 ml-2 lg:ml-4">
        {currentTime}
      </div>
    </header>
  );
}