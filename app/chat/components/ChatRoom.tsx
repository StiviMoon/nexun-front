/**
 * chat room component
 *
 * this component renders an interactive chat room interface, including:
 * - room header with name, visibility status and optional access code
 * - message list
 * - message input bar
 *
 * @#component
 *
 * @#param {object} props - component properties
 * @#param {ChatRoomType} props.room - room information (name, visibility, createdBy, code, etc.)
 * @#param {ChatMessage[]} props.messages - list of chat messages
 * @#param {boolean} props.isConnected - indicates if the user is connected to the chat server
 * @#param {boolean} props.isSending - indicates if a message is being sent
 * @#param {function} props.onSendMessage - callback triggered when the user sends a message
 * @#param {function} props.onClose - callback triggered when the room is closed
 * @#param {string} [props.currentUserId] - current user's id
 * @#param {string} [props.className] - optional extra css classes
 *
 * @#returns {JSX.Element} rendered chat room component
 */

"use client";

import { useState } from "react";
import { ChatRoom as ChatRoomType, ChatMessage } from "@/types/chat";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { X, Lock, Copy, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatRoomProps {
  room: ChatRoomType;
  messages: ChatMessage[];
  isConnected: boolean;
  isSending: boolean;
  onSendMessage: (content: string) => void;
  onClose: () => void;
  currentUserId?: string;
  className?: string;
}

export const ChatRoom = ({
  room,
  messages,
  isConnected,
  isSending,
  onSendMessage,
  onClose,
  currentUserId,
  className
}: ChatRoomProps) => {
  const [codeCopied, setCodeCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const isRoomCreator = currentUserId && room.createdBy === currentUserId;
  const isPrivateRoom = room.visibility === "private";
  const hasAccessCode = isPrivateRoom && room.code && isRoomCreator;

  const handleCopyCode = () => {
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

  const toggleShowCode = () => {
    setShowCode((prev) => !prev);
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Room Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-light text-foreground truncate">{room.name}</h2>
              {isPrivateRoom && (
                <Lock className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              )}
              
              {/* Código de acceso para salas privadas (solo creador) */}
              {hasAccessCode && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
                  <button
                    onClick={toggleShowCode}
                    className="p-0.5 hover:bg-purple-500/20 rounded transition-colors shrink-0"
                    title={showCode ? "Ocultar código" : "Mostrar código"}
                    aria-label={showCode ? "Ocultar código" : "Mostrar código"}
                  >
                    {showCode ? (
                      <EyeOff className="h-3.5 w-3.5 text-purple-400" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-purple-400" />
                    )}
                  </button>
                  {showCode && (
                    <>
                      <span className="text-xs text-purple-300 font-medium">Código:</span>
                      <code className="text-xs font-mono font-bold text-purple-200 min-w-[60px]">
                        {room.code}
                      </code>
                      <button
                        onClick={handleCopyCode}
                        className="p-0.5 hover:bg-purple-500/20 rounded transition-colors shrink-0"
                        title="Copiar código"
                        aria-label="Copiar código"
                      >
                        {codeCopied ? (
                          <Check className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-purple-400" />
                        )}
                      </button>
                    </>
                  )}
                  {!showCode && (
                    <span className="text-xs text-purple-400/60 font-medium">
                      Código oculto
                    </span>
                  )}
                </div>
              )}
            </div>
            {room.description && (
              <p className="text-xs text-muted-foreground/60 mt-1.5 truncate">
                {room.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-foreground/5 rounded-lg transition-colors text-muted-foreground/60 hover:text-foreground shrink-0"
            aria-label="Cerrar sala"
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
