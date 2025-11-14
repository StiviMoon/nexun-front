"use client";

import { memo } from "react";
import { ChatRoom } from "@/types/chat";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: ChatRoom;
  isSelected: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export const RoomCard = memo(({ room, isSelected, onClick, unreadCount = 0 }: RoomCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-lg transition-all",
        "hover:bg-foreground/5 active:bg-foreground/10",
        isSelected && "bg-foreground/10"
      )}
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
        </div>
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
        )}
      </div>
    </button>
  );
});

RoomCard.displayName = "RoomCard";
