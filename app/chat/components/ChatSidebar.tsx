"use client";

import { useState } from "react";
import { ChatRoom } from "@/types/chat";
import { Input } from "@/components/ui/input";
import { RoomCard } from "./RoomCard";
import { UserStatus } from "./UserStatus";
import { Plus, Search, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoomId?: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: { message: string; code?: string } | null;
  onCreateRoom: (data: { name: string; description?: string; type: "direct" | "group" | "channel" }) => void;
  onSelectRoom: (room: ChatRoom) => void;
  onConnect: () => void;
  className?: string;
}

export const ChatSidebar = ({
  rooms,
  selectedRoomId,
  isConnected,
  isConnecting,
  error,
  onCreateRoom,
  onSelectRoom,
  onConnect,
  className
}: ChatSidebarProps) => {
  const { currentUser } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomType, setRoomType] = useState<"direct" | "group" | "channel">("group");

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRoom = () => {
    if (!roomName.trim() || !isConnected) {
      return;
    }

    onCreateRoom({
      name: roomName.trim(),
      description: roomDescription.trim() || undefined,
      type: roomType
    });

    setRoomName("");
    setRoomDescription("");
    setShowCreateForm(false);
  };

  return (
    <div className={cn("w-72 bg-background/50 backdrop-blur-sm flex flex-col border-r border-border/50", className)}>
      {/* Header */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-light tracking-tight">Chat</h1>
          <UserStatus isConnected={isConnected} isConnecting={isConnecting} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground/60" />
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/10 text-destructive text-xs">
            {error.message}
          </div>
        )}

        {/* Connect button */}
        {!isConnected && !isConnecting && (
          <button
            onClick={onConnect}
            className="w-full px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors"
          >
            Conectar
          </button>
        )}

        {/* Create room button */}
        {isConnected && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              showCreateForm
                ? "text-foreground/60 hover:text-foreground/80"
                : "text-foreground/80 hover:text-foreground bg-foreground/5 hover:bg-foreground/10"
            )}
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? "Cancelar" : "Nueva sala"}
          </button>
        )}
      </div>

      {/* Create room form */}
      {showCreateForm && isConnected && (
        <div className="px-6 pb-4 space-y-3 border-b border-border/50">
          <Input
            placeholder="Nombre de la sala"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleCreateRoom();
              }
            }}
            className="h-9 bg-background/50 border-border/50"
          />
          <Input
            placeholder="Descripción (opcional)"
            value={roomDescription}
            onChange={(e) => setRoomDescription(e.target.value)}
            className="h-9 bg-background/50 border-border/50"
          />
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value as "direct" | "group" | "channel")}
            className="w-full h-9 rounded-lg border border-border/50 bg-background/50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
          >
            <option value="group">Grupo</option>
            <option value="channel">Canal</option>
            <option value="direct">Directo</option>
          </select>
          <button
            onClick={handleCreateRoom}
            disabled={!roomName.trim()}
            className="w-full px-4 py-2 text-sm font-medium text-foreground bg-foreground/10 hover:bg-foreground/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Crear
          </button>
        </div>
      )}

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/60">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {searchQuery ? "No se encontraron salas" : "No hay salas"}
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id}
              onClick={() => onSelectRoom(room)}
            />
          ))
        )}
      </div>

      {/* Footer with user info */}
      <div className="p-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground/80">
          <p className="font-medium truncate">{currentUser?.displayName || currentUser?.email}</p>
        </div>
      </div>
    </div>
  );
};
