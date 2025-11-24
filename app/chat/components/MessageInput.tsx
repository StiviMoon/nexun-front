/** #documentation
 * MessageInput Component
 * ----------------------
 * This component provides a controlled textarea input for composing and sending chat messages.
 * It supports features such as dynamic height adjustment, keyboard shortcuts, disabled states,
 * and a visual loading indicator when a message is being sent.
 *
 * Key Responsibilities:
 * - Allow users to type messages and submit them via the send button or by pressing Enter.
 * - Automatically resize the textarea based on content up to a max height.
 * - Disable input and controls while a message is being sent.
 * - Provide accessibility-friendly placeholder and interaction behavior.
 *
 * Behavioral Notes:
 * - Pressing Enter without Shift triggers the send action.
 * - Pressing Shift + Enter inserts a new line for multi-line messages.
 * - The component adjusts the textarea height smoothly without layout jumps.
 * - Prevents sending empty or whitespace-only messages.
 *
 * Performance Considerations:
 * - Uses a ref to manipulate the textarea height efficiently without excessive re-renders.
 *
 * Accessibility:
 * - Button and textarea reflect disabled state visually and functionally.
 * - Automatically restores height after sending a message.
 */

"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** #documentation
 * MessageInputProps Interface
 * ---------------------------
 * Defines the properties used to configure the MessageInput component.
 *
 * Properties:
 * - onSend:        Function triggered when the user submits the message.
 * - disabled:      Disables the input entirely (e.g., when offline).
 * - isSending:     Indicates whether a message is currently being sent.
 * - placeholder:   Custom placeholder text for the textarea.
 * - className:     Optional className for external styling.
 */
interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
  className?: string;
}

/** #documentation
 * MessageInput Component
 * ----------------------
 * Renders an adjustable textarea for writing messages, along with a send button.
 * Handles input validation, dynamic height adjustment, and keyboard submit behavior.
 */
export const MessageInput = ({
  onSend,
  disabled = false,
  isSending = false,
  placeholder = "Escribe un mensaje...",
  className
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** #documentation
   * handleSend
   * ----------
   * Validates and submits the message.
   * Steps:
   * - Prevents sending empty or whitespace-only messages.
   * - Avoids sending while disabled or already processing.
   * - Clears the input after successful submission.
   * - Resets textarea height to default.
   */
  const handleSend = () => {
    if (!message.trim() || disabled || isSending) {
      return;
    }

    onSend(message.trim());
    setMessage("");
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  /** #documentation
   * handleKeyPress
   * --------------
   * Captures keyboard events within the textarea.
   * - Enter submits message.
   * - Shift + Enter creates a newline.
   */
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** #documentation
   * useEffect - Dynamic Height Adjustment
   * -------------------------------------
   * Automatically adjusts the textarea height based on its scrollHeight.
   * Behavior:
   * - Resets height before recalculating to ensure consistency.
   * - Restricts expansion to a maximum height of 120px.
   * - Enables vertical scrolling only when necessary.
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Toggle vertical scrollbar based on overflow
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }
    };

    adjustHeight();
  }, [message]);

  return (
    <div className={cn("px-6 py-4 border-t border-border/50 bg-background/50 backdrop-blur-sm", className)}>
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className={cn(
              "w-full min-h-[44px] max-h-[120px] px-4 py-3",
              "rounded-2xl border border-border/50 bg-background/50",
              "resize-none",
              "text-sm placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:bg-background",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all",
              "scrollbar-thin"
            )}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isSending}
          className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            "bg-foreground text-background",
            "hover:opacity-90 active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
            "transition-all"
          )}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};
