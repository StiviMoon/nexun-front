"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
  className?: string;
}

export const MessageInput = ({
  onSend,
  disabled = false,
  isSending = false,
  placeholder = "Escribe un mensaje...",
  className
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Solo mostrar scrollbar si hay overflow
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
