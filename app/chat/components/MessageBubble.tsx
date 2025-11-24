/** #documentation
 * MessageBubble Component
 * -----------------------
 * This component represents an individual chat message bubble within a conversation.
 * It handles message layout, alignment, metadata visibility, conditional sender info,
 * and delivery/read status indicators.
 *
 * Key Responsibilities:
 * - Render a message aligned either to the left (incoming) or right (outgoing).
 * - Optionally display the sender's avatar and name when grouping conditions require it.
 * - Group consecutive messages from the same sender to avoid redundant headers.
 * - Display formatted timestamps.
 * - Show visual message status indicators: sending, sent, and read.
 *
 * Behavioral Notes:
 * - Uses React.memo to prevent unnecessary re-renders, improving performance in large chat threads.
 * - Sender info is only shown when the previous message is from a different sender.
 * - Message status icons only appear for messages authored by the current user (isOwn).
 *
 * Accessibility Considerations:
 * - Avatar images include alt text based on sender name.
 * - Time is displayed in a readable, non-ambiguous format via utility formatter.
 */

"use client";

import { memo } from "react";
import Image from "next/image";
import { ChatMessage } from "@/types/chat";
import { formatTime, isSameSender } from "@/utils/chat/dateUtils";
import { getMessageStatus } from "@/utils/chat/messageFormatter";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Loader2 } from "lucide-react";

/** #documentation
 * MessageBubbleProps Interface
 * ----------------------------
 * Defines the required and optional values for rendering a single chat message bubble.
 *
 * Properties:
 * - message:          The chat message object to display.
 * - previousMessage:  The previous message in the list, used to determine grouping and sender visibility.
 * - isOwn:            Whether the message was authored by the current user.
 * - showAvatar:       Optional flag to display the sender's profile picture. Defaults to true.
 * - showName:         Optional flag to display the sender's name. Defaults to true.
 */
interface MessageBubbleProps {
  message: ChatMessage;
  previousMessage: ChatMessage | null;
  isOwn: boolean;
  showAvatar?: boolean;
  showName?: boolean;
}

/** #documentation
 * MessageBubble Component
 * -----------------------
 * Renders the visual representation of a chat message bubble with optional sender metadata
 * and conditional UI styling depending on message ownership.
 *
 * Performance:
 * - Wrapped in React.memo to optimize rendering when message data has not changed.
 *
 * UI Logic:
 * - Messages from the same sender are visually grouped.
 * - Outgoing messages use reversed flex orientation and distinct bubble styling.
 * - Hovering over a bubble reveals timestamp and status indicators.
 */
export const MessageBubble = memo(({
  message,
  previousMessage,
  isOwn,
  showAvatar = true,
  showName = true
}: MessageBubbleProps) => {

  /** #documentation
   * showSenderInfo
   * ---------------
   * Determines whether the sender's avatar and name should be shown.
   * Shown only if:
   * - There is no previous message, OR
   * - The previous message is from a different sender.
   */
  const showSenderInfo = !previousMessage || !isSameSender(message, previousMessage);

  /** #documentation
   * status
   * -------
   * Retrieves the message delivery state based on ownership and message metadata:
   * - 'sending': still being processed
   * - 'sent': delivered to server
   * - 'read': seen by the recipient
   */
  const status = getMessageStatus(message, isOwn);

  return (
    <div className={cn("flex flex-col gap-1.5 group", isOwn ? "items-end" : "items-start")}>
      
      {/* Sender Information (avatar + name) */}
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

      {/* Message bubble + timestamp/status */}
      <div className={cn("flex items-end gap-2 max-w-[75%]", isOwn ? "flex-row-reverse" : "flex-row")}>
        
        {/* Chat message text */}
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

        {/* Timestamp + Status icons (hidden until hover) */}
        <div className={cn(
          "flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-[10px] text-muted-foreground/60">
            {formatTime(message.timestamp)}
          </span>

          {/* Status indicators shown only on the user's own messages */}
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
