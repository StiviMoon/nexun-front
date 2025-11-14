"use client";

import { memo } from "react";
import Image from "next/image";
import { ChatMessage } from "@/types/chat";
import { formatTime, isSameSender } from "@/utils/chat/dateUtils";
import { getMessageStatus } from "@/utils/chat/messageFormatter";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Loader2 } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  previousMessage: ChatMessage | null;
  isOwn: boolean;
  showAvatar?: boolean;
  showName?: boolean;
}

export const MessageBubble = memo(({
  message,
  previousMessage,
  isOwn,
  showAvatar = true,
  showName = true
}: MessageBubbleProps) => {
  const showSenderInfo = !previousMessage || !isSameSender(message, previousMessage);
  const status = getMessageStatus(message, isOwn);

  return (
    <div className={cn("flex flex-col gap-1.5 group", isOwn ? "items-end" : "items-start")}>
      {showSenderInfo && !isOwn && (
        <div className="flex items-center gap-2 px-1 mb-0.5">
          {showAvatar && message.senderPicture && (
            <Image
              src={message.senderPicture}
              alt={message.senderName || "User"}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full"
            />
          )}
          {showName && (
            <span className="text-xs font-medium text-muted-foreground/80">
              {message.senderName || "Usuario"}
            </span>
          )}
        </div>
      )}

      <div className={cn("flex items-end gap-2 max-w-[75%]", isOwn ? "flex-row-reverse" : "flex-row")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 transition-all",
            isOwn
              ? "bg-foreground text-background"
              : "bg-foreground/5 text-foreground",
            "hover:opacity-90"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>
        </div>

        <div className={cn(
          "flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-[10px] text-muted-foreground/60">
            {formatTime(message.timestamp)}
          </span>
          {isOwn && (
            <div className="flex items-center">
              {status.status === "sending" && (
                <Loader2 className="h-3 w-3 text-muted-foreground/60 animate-spin" />
              )}
              {status.status === "sent" && (
                <Check className="h-3 w-3 text-muted-foreground/60" />
              )}
              {status.status === "read" && (
                <CheckCheck className="h-3 w-3 text-foreground/60" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
