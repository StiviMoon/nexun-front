"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function MeetingLeftClient() {
  const search = useSearchParams();
  const router = useRouter();
  const rawRoom = search ? search.get('room') : null;
  const room = rawRoom && rawRoom !== 'undefined' && rawRoom !== 'null' ? rawRoom : null;

  const handleRejoin = () => {
    if (room) {
      router.push(`/Sala/${room}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-12 max-w-3xl w-full text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/LOGO_SOLO.svg"
            alt="Nexun Meet"
            width={56}
            height={56}
            className="w-14 h-14"
          />
        </div>

        {/* Badge */}
        <div className="inline-block px-4 py-1.5 rounded-full border border-zinc-700 mb-6">
          <span className="text-zinc-400 text-sm tracking-widest font-medium">
            NEXUN MEET
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-white mb-8">
          Abandonaste la reunión
        </h1>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button
            onClick={handleRejoin}
            className="
              px-8 py-3 rounded-lg border border-zinc-700
              text-white font-medium
              hover:bg-zinc-800 transition-colors
            "
          >
            Volver a unirse
          </button>

          <Link
            href="/dashboard"
            className="
              px-8 py-3 rounded-lg
              bg-gradient-to-r from-cyan-500 to-purple-600
              text-white font-medium
              hover:from-cyan-400 hover:to-purple-500 transition-all
            "
          >
            Volver a la pantalla principal
          </Link>
        </div>

        {/* Feedback Link */}
        <button className="text-zinc-400 hover:text-white underline text-sm transition-colors">
          Enviar comentarios
        </button>
      </div>
    </main>
  );
}
