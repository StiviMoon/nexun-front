"use client";

import { ChatRoom as ChatRoomType, ChatMessage } from "@/types/chat";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatRoomProps {
  room: ChatRoomType;
  messages: ChatMessage[];
  isConnected: boolean;
  isSending: boolean;
  onSendMessage: (content: string) => void;
  onClose: () => void;
  className?: string;
}

export const ChatRoom = ({
  room,
  messages,
  isConnected,
  isSending,
  onSendMessage,
  onClose,
  className
}: ChatRoomProps) => {
  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Room Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-light text-foreground truncate">{room.name}</h2>
            {room.description && (
              <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                {room.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-foreground/5 rounded-lg transition-colors text-muted-foreground/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} roomId={room.id} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={onSendMessage}
        disabled={!isConnected}
        isSending={isSending}
      />
    </div>
  );
};
