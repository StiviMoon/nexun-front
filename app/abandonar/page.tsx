import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MeetingLeftClient from '@/components/ui/MeetingLeftClient';

export default function MeetingLeftPage() {
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-3 w-fit">
          <Image
            src="/LOGO_SOLO.svg"
            alt="Nexun"
            width={36}
            height={36}
            className="w-9 h-9"
          />
          <span className="text-white font-semibold text-lg">NEXUN</span>
        </Link>
      </header>

      {/* Content */}
      <React.Suspense fallback={null}>
        <MeetingLeftClient />
      </React.Suspense>
      </div>
  );
}
