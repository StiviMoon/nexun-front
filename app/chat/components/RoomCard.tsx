"use client";

import { memo, useState } from "react";
import { ChatRoom } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Lock, Globe, Copy, Check } from "lucide-react";

interface RoomCardProps {
  room: ChatRoom;
  isSelected: boolean;
  onClick: () => void;
  unreadCount?: number;
  isParticipant?: boolean;
  onJoinPublicRoom?: (room: ChatRoom) => void;
  currentUserId?: string;
}

export const RoomCard = memo(({ 
  room, 
  isSelected, 
  onClick, 
  unreadCount = 0,
  isParticipant = false,
  onJoinPublicRoom,
  currentUserId,
}: RoomCardProps) => {
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCardClick = () => {
    // Si es pública y no es participante, mostrar opción de unirse
    if (room.visibility === "public" && !isParticipant && onJoinPublicRoom) {
      onJoinPublicRoom(room);
    } else {
      onClick();
    }
  };

  const handleCopyCode = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (room.code) {
      navigator.clipboard
        .writeText(room.code)
        .then(() => {
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Error copying code:", err);
        });
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const isPublicAndNotParticipant = room.visibility === "public" && !isParticipant;
  const isRoomCreator = currentUserId && room.createdBy === currentUserId;
  const showPrivateCode = room.visibility === "private" && room.code && isRoomCreator;

  return (
    <div
      onClick={(e) => {
        // Si el click fue en el botón de copiar, no hacer nada
        const target = e.target as HTMLElement;
        if (target.closest('[data-copy-button]')) {
          return;
        }
        handleCardClick();
      }}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "w-full text-left px-4 py-3 rounded-lg transition-all cursor-pointer",
        "hover:bg-foreground/5 active:bg-foreground/10",
        "focus:outline-none focus:ring-2 focus:ring-foreground/20",
        isSelected && "bg-foreground/10",
        isPublicAndNotParticipant && "border border-cyan-500/30"
      )}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              "font-medium text-sm truncate",
              isSelected ? "text-foreground" : "text-foreground/80"
            )}>
              {room.name}
            </h3>
            {room.visibility === "private" ? (
              <Lock className="h-3 w-3 text-purple-400 shrink-0" />
            ) : (
              <Globe className="h-3 w-3 text-cyan-400 shrink-0" />
            )}
            {unreadCount > 0 && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-foreground text-background rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {room.description && (
            <p className="text-xs text-muted-foreground/60 line-clamp-1">
              {room.description}
            </p>
          )}
          {isPublicAndNotParticipant && (
            <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
              <span>•</span>
              <span>Click para unirse</span>
            </p>
          )}
          {showPrivateCode && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20">
                <Lock className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                <code className="text-xs font-mono font-semibold text-purple-300">
                  {room.code}
                </code>
                <div
                  data-copy-button
                  onClick={handleCopyCode}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCopyCode(e);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="p-0.5 hover:bg-purple-500/20 rounded transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  title="Copiar código"
                  aria-label="Copiar código"
                >
                  {codeCopied ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-purple-400" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  );
});

RoomCard.displayName = "RoomCard";
