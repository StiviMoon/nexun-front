/**
 * ===========================================
 * MESSAGE LIST COMPONENT
 * ===========================================
 *
 * Renders a virtualized list of chat messages using `react-virtuoso`,
 * automatically managing scroll behavior and grouping messages
 * by date. It ensures optimal performance even with large datasets
 * thanks to virtualization.
 *
 * This component:
 * - Displays messages in chronological order.
 * - Automatically scrolls to the latest message when new messages arrive.
 * - Inserts date separators when messages belong to different days.
 * - Distinguishes between the current user’s messages and others.
 * - Wraps each message with the `MessageBubble` component.
 *
 * Props:
 * typedef {Object} MessageListProps
 * property {ChatMessage[]} messages - List of messages to render.
 * property {string} roomId - ID of the room/conversation (reserved for future logic).
 * property {string} [className] - Optional Tailwind class overrides for styling.
 *
 * Behavior:
 * - If no messages are present, a placeholder empty state is displayed.
 * - When messages update, the component scrolls smoothly to the bottom.
 * - Uses `Virtuoso` for efficient rendering and smooth scrolling.
 * - Dynamically checks if a date separator should be shown based on timestamps.
 *
 * Notes:
 * - `react-virtuoso` handles virtualization, improving performance for long histories.
 * - `useAuth` identifies the current user to style outgoing vs incoming messages.
 * - This component does not handle message sending; only visualization.
 */

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
