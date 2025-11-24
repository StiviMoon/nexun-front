/**
 * #documentacion
 * ChatPage Component
 *
 * This component provides the full real-time chat experience, including:
 * - Connection management to the chat server
 * - Listing and selecting chat rooms
 * - Joining rooms (public and private)
 * - Rendering chat messages and sending new ones
 * - Sidebar with room controls and navigation
 *
 * It integrates multiple custom hooks:
 * - `useChat()` for real-time messaging, rooms, and connection state.
 * - `useAuthWithQuery()` to retrieve the authenticated user.
 *
 * The component automatically attempts to connect to the chat server once
 * the user is available. It also handles:
 * - Room selection and participation validation
 * - Joining rooms by code
 * - Handling UI states such as connecting, disconnected, or no room selected
 *
 * component
 * returns {JSX.Element | null} The rendered chat interface, or null if no user is authenticated.
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useChat } from "@/app/hooks/useChat";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import { ChatRoom as ChatRoomType } from "@/types/chat";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatRoom } from "./components/ChatRoom";
import { MessageSquare } from "lucide-react";
import { AppLayout } from "@/components/ui/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ChatPage() {
  const { currentUser } = useAuthWithQuery();
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
    joinRoomByCode,
    leaveRoom,
    sendMessage,
    getMessages,
    setCurrentRoom
  } = useChat();

  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [isSending, setIsSending] = useState(false);

  /**
   * Memoized list of messages for the selected room.
   * Ensures performance optimization by avoiding unnecessary recalculations.
   */
  const roomMessages = useMemo(() => {
    return selectedRoom ? messages[selectedRoom.id] || [] : [];
  }, [selectedRoom, messages]);

  /**
   * Auto-connect to chat server once a user exists.
   * Includes a small delay to ensure authentication initialization.
   */
  useEffect(() => {
    if (!currentUser || isConnected || isConnecting) {
      return;
    }

    const connectTimer = setTimeout(() => {
      if (currentUser && !isConnected && !isConnecting) {
        connect();
      }
    }, 100);

    return () => {
      clearTimeout(connectTimer);
      if (isConnected) {
        disconnect();
      }
    };
  }, [currentUser, isConnected, isConnecting, connect, disconnect]);

  /**
   * Determines if the authenticated user is a participant in the selected room.
   */
  const isParticipant = useMemo(() => {
    if (!selectedRoom || !currentUser) return false;
    return selectedRoom.participants.includes(currentUser.uid);
  }, [selectedRoom, currentUser]);

  /**
   * Automatically joins the room when selected, only if the user is a participant.
   * Also fetches the latest messages.
   */
  useEffect(() => {
    if (selectedRoom && isConnected && isParticipant) {
      const code = selectedRoom.visibility === "private" ? selectedRoom.code : undefined;
      joinRoom(selectedRoom.id, code);
      getMessages(selectedRoom.id, 50);
      setCurrentRoom(selectedRoom);
    }
  }, [selectedRoom, isConnected, isParticipant, joinRoom, getMessages, setCurrentRoom]);

  /**
   * If a newly created room becomes the current room, auto-select it.
   */
  useEffect(() => {
    if (currentRoom && !selectedRoom) {
      setSelectedRoom(currentRoom);
    }
  }, [currentRoom, selectedRoom]);

  /**
   * Logs error messages coming from the server.
   */
  useEffect(() => {
    if (error) {
      console.error("Chat error:", error);
    }
  }, [error]);

  /** Creates a new room */
  const handleCreateRoom = (data: {
    name: string;
    description?: string;
    type: "direct" | "group" | "channel";
    visibility: "public" | "private";
  }) => {
    if (!isConnected) return;
    createRoom(data);
  };

  /** Joins a room using an access code */
  const handleJoinWithCode = (code: string) => {
    if (!isConnected || !code.trim()) return;
    joinRoomByCode(code.trim().toUpperCase());
  };

  /** Selects a room from the sidebar */
  const handleSelectRoom = (room: ChatRoomType) => {
    setSelectedRoom(room);
  };

  /** Joins a public room when the user is not yet a participant */
  const handleJoinPublicRoom = (room: ChatRoomType) => {
    if (!isConnected || !currentUser) return;
    joinRoom(room.id);
    setSelectedRoom(room);
  };

  /** Sends a message to the current room */
  const handleSendMessage = async (content: string) => {
    if (!selectedRoom || !content.trim() || isSending || !isConnected) return;

    setIsSending(true);
    try {
      sendMessage(selectedRoom.id, content.trim());
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  /** Leaves the selected room */
  const handleCloseRoom = () => {
    if (selectedRoom && isConnected) {
      leaveRoom(selectedRoom.id);
    }
    setSelectedRoom(null);
    setCurrentRoom(null);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <AppLayout className="bg-background text-foreground">
      <div className="flex flex-col h-full bg-black">
        {/* Header */}
        <PageHeader
          title="Chat"
          subtitle="Comunícate en tiempo real con tu equipo"
        />

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-w-0">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden order-2 lg:order-1">
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
            ) : !isParticipant && selectedRoom.visibility === "public" ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4 max-w-sm px-6">
                  <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-foreground/5">
                    <MessageSquare className="w-8 h-8 text-foreground/40" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-light text-foreground">Unirse a {selectedRoom.name}</hh2>
                    <p className="text-sm text-muted-foreground">
                      Esta es una sala pública. Únete para participar en la conversación.
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoinPublicRoom(selectedRoom)}
                    className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
                    disabled={!isConnected || isConnecting}
                  >
                    {isConnecting ? "Conectando..." : "Unirse a la sala"}
                  </button>
                  <button
                    onClick={handleCloseRoom}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancelar
                  </button>
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
                currentUserId={currentUser?.uid}
              />
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="hidden lg:flex lg:w-80 xl:w-96 flex-shrink-0 order-1 lg:order-2 h-full">
            <ChatSidebar
              rooms={rooms}
              selectedRoomId={selectedRoom?.id}
              isConnected={isConnected}
              isConnecting={isConnecting}
              error={error}
              onCreateRoom={handleCreateRoom}
              onSelectRoom={handleSelectRoom}
              onJoinPublicRoom={handleJoinPublicRoom}
              onConnect={connect}
              onJoinWithCode={handleJoinWithCode}
              currentUserId={currentUser?.uid}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
