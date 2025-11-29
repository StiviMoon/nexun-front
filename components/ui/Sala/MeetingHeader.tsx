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

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/Sala/${meetingCode}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando enlace:', err);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 lg:px-4 lg:py-3 bg-zinc-950 border-b border-zinc-800">
      {/* Left - Logo & Meeting Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
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

      {/* Center - Meeting Code with Copy Button */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
          <span className="text-zinc-400 text-xs">Código:</span>
          <span className="text-white text-sm font-mono font-medium">{meetingCode}</span>
          <button
            onClick={handleCopyCode}
            className="p-1 hover:bg-zinc-800 rounded transition-colors"
            title="Copiar código"
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
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors text-sm font-medium"
            title="Invitar participantes"
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
          className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 rounded border border-zinc-800"
          title="Copiar código"
        >
          <span className="text-white text-xs font-mono">{meetingCode.slice(0, 8)}...</span>
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3 text-zinc-400" />
          )}
        </button>
      </div>

      {/* Right - Time */}
      <div className="text-zinc-400 text-sm shrink-0">
        {currentTime}
      </div>
    </header>
  );
}