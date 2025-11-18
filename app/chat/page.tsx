"use client";

import { useEffect, useState, useMemo } from "react";
import { useChat } from "@/app/hooks/useChat";
import { useAuth } from "@/app/hooks/useAuth";
import { ChatRoom as ChatRoomType } from "@/types/chat";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatRoom } from "./components/ChatRoom";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  const { currentUser } = useAuth();
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    error,
    rooms,
    messages,
    currentRoom,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    getMessages,
    setCurrentRoom
  } = useChat();

  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [isSending, setIsSending] = useState(false);

  const roomMessages = useMemo(() => {
    return selectedRoom ? messages[selectedRoom.id] || [] : [];
  }, [selectedRoom, messages]);

  // Conectar automáticamente cuando hay usuario
  useEffect(() => {
    if (currentUser && !isConnected && !isConnecting) {
      connect();
    }

    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [currentUser, isConnected, isConnecting, connect, disconnect]);

  // Unirse a la sala cuando se selecciona
  useEffect(() => {
    if (selectedRoom && isConnected) {
      joinRoom(selectedRoom.id);
      getMessages(selectedRoom.id, 50);
      setCurrentRoom(selectedRoom);
    }
  }, [selectedRoom, isConnected, joinRoom, getMessages, setCurrentRoom]);

  // Actualizar sala seleccionada cuando se crea una nueva
  useEffect(() => {
    if (currentRoom && !selectedRoom) {
      setSelectedRoom(currentRoom);
    }
  }, [currentRoom, selectedRoom]);

  const handleCreateRoom = (data: { name: string; description?: string; type: "direct" | "group" | "channel" }) => {
    if (!isConnected) {
      return;
    }
    createRoom(data);
  };

  const handleSelectRoom = (room: ChatRoomType) => {
    setSelectedRoom(room);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedRoom || !content.trim() || isSending || !isConnected) {
      return;
    }

    setIsSending(true);
    try {
      sendMessage(selectedRoom.id, content.trim());
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseRoom = () => {
    if (selectedRoom && isConnected) {
      leaveRoom(selectedRoom.id);
    }
    setSelectedRoom(null);
    setCurrentRoom(null);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-2xl font-light text-foreground">Inicia sesión</h1>
          <p className="text-sm text-muted-foreground">
            Necesitas autenticarte para acceder al chat
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-2.5 text-sm font-medium text-foreground bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors"
          >
            Ir a login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <ChatSidebar
        rooms={rooms}
        selectedRoomId={selectedRoom?.id}
        isConnected={isConnected}
        isConnecting={isConnecting}
        error={error}
        onCreateRoom={handleCreateRoom}
        onSelectRoom={handleSelectRoom}
        onConnect={connect}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!isConnected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-2 h-2 bg-muted-foreground/20 rounded-full mx-auto animate-pulse" />
              <p className="text-sm text-muted-foreground">
                {isConnecting ? "Conectando..." : "No conectado"}
              </p>
              {!isConnecting && (
                <button
                  onClick={connect}
                  className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                >
                  Conectar
                </button>
              )}
            </div>
          </div>
        ) : !selectedRoom ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-sm px-6">
              <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-foreground/5">
                <MessageSquare className="w-8 h-8 text-foreground/40" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-light text-foreground">Selecciona una sala</h2>
                <p className="text-sm text-muted-foreground">
                  Elige una sala de la lista o crea una nueva para comenzar
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ChatRoom
            room={selectedRoom}
            messages={roomMessages}
            isConnected={isConnected}
            isSending={isSending}
            onSendMessage={handleSendMessage}
            onClose={handleCloseRoom}
          />
        )}
      </div>
    </div>
  );
}
