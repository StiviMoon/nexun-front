"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = "",
}) => {
  const { currentUser } = useAuthWithQuery();
  const userName = currentUser?.displayName || currentUser?.email || "Usuario";
  const userAvatar = currentUser?.photoURL;

  const handleNotificationClick = () => {
    console.log("Notificaciones clickeadas");
    // TODO: Implementar notificaciones
  };

  return (
    <header
      className={`
        flex items-center justify-between
        py-3 sm:py-4 lg:py-6 px-3 sm:px-4 lg:px-6 border-b border-zinc-800/50
        bg-zinc-950/50 backdrop-blur-sm
        ${className}
      `}
      role="banner"
    >
      <div className="flex-1 min-w-0 pr-2 sm:pr-4">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 truncate hidden sm:block">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Notification Bell */}
        <button
          onClick={handleNotificationClick}
          className="relative p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800/50 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          title="Notificaciones"
          aria-label="Ver notificaciones"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span> */}
        </button>

        {/* User Avatar */}
        <Link
          href="/perfil"
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-full"
          aria-label="Ir a mi perfil"
        >
          {userAvatar ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-zinc-700/50 hover:ring-cyan-500/50 transition-all">
              <Image
                src={userAvatar}
                alt={userName}
                width={36}
                height={36}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center ring-2 ring-zinc-700/50 hover:ring-cyan-500/50 transition-all">
              <span className="text-xs font-semibold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>
      </div>
    </header>
  );
};

