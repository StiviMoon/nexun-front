"use client";

import { useEffect, useRef } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { formatDate, shouldShowDateSeparator } from "@/utils/chat/dateUtils";
import { useAuth } from "@/app/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: ChatMessage[];
  roomId: string;
  className?: string;
}

export const MessageList = ({ messages, roomId, className }: MessageListProps) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (messages.length > 0 && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: "smooth",
        align: "end"
      });
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground/60">No hay mensajes aún</p>
          <p className="text-xs text-muted-foreground/40">Sé el primero en escribir</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full", className)}>
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        initialTopMostItemIndex={messages.length - 1}
        followOutput="smooth"
        itemContent={(index, message) => {
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const isOwn = message.senderId === currentUser?.uid;
          const showDateSeparator = shouldShowDateSeparator(
            message.timestamp,
            previousMessage?.timestamp || null
          );

          return (
            <div className="px-6 py-1.5">
              {showDateSeparator && (
                <div className="flex items-center justify-center my-6">
                  <div className="px-3 py-1 rounded-full bg-foreground/5 text-xs text-muted-foreground/60">
                    {formatDate(message.timestamp)}
                  </div>
                </div>
              )}
              <MessageBubble
                message={message}
                previousMessage={previousMessage}
                isOwn={isOwn}
                showAvatar={!isOwn}
                showName={!isOwn}
              />
            </div>
          );
        }}
        style={{ height: "100%" }}
      />
    </div>
  );
};
