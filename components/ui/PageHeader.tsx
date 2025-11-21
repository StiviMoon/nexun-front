"use client";

import React from "react";
import Image from "next/image";
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
        py-6 px-6 border-b border-zinc-800/50
        bg-zinc-950/50 backdrop-blur-sm
        ${className}
      `}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-semibold text-white truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-1 truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3 ml-4">
        {/* Notification Bell */}
        <button
          onClick={handleNotificationClick}
          className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800/50 transition-all"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span> */}
        </button>

        {/* User Avatar */}
        {userAvatar ? (
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-zinc-700/50 hover:ring-cyan-500/50 transition-all cursor-pointer">
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center ring-2 ring-zinc-700/50 hover:ring-cyan-500/50 transition-all cursor-pointer">
            <span className="text-xs font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

