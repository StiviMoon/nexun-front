"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/app/hooks/useChat";
import { ChatRoom as ChatRoomType, ChatMessage } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ChatRoomProps {
  room: ChatRoomType;
}

export const ChatRoom = ({ room }: ChatRoomProps) => {
  const { messages, sendMessage, isConnected, joinRoom, leaveRoom, getMessages } = useChat();
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomMessages = messages[room.id] || [];

  useEffect(() => {
    if (isConnected) {
      joinRoom(room.id);
      getMessages(room.id, 50);
    }

    return () => {
      if (isConnected) {
        leaveRoom(room.id);
      }
    };
  }, [room.id, isConnected, joinRoom, leaveRoom, getMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      sendMessage(room.id, messageInput);
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto">
      {/* Room Header */}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-semibold">{room.name}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {room.type} • {room.participants.length} participantes
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {roomMessages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay mensajes aún. ¡Sé el primero en escribir!
          </div>
        ) : (
          roomMessages.map((message: ChatMessage) => (
            <div
              key={message.id}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                {message.senderPicture && (
                  <img
                    src={message.senderPicture}
                    alt={message.senderName || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="font-semibold text-sm">
                  {message.senderName || "Usuario"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <div className="ml-10 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-[80%]">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
        <div className="flex space-x-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            disabled={!isConnected || isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || isLoading || !messageInput.trim()}
          >
            Enviar
          </Button>
        </div>
        {!isConnected && (
          <p className="text-xs text-red-500 mt-2">
            No conectado al servidor de chat
          </p>
        )}
      </div>
    </Card>
  );
};

