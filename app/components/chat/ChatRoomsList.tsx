/**
 * ===========================================
 * CHAT ROOMS LIST COMPONENT
 * ===========================================
 *
 * A component that displays a list of chat rooms and allows the user to create new rooms.
 * Handles room selection, creation, and displays room type and participant count.
 *
 * Props:
 * typedef {Object} ChatRoomsListProps
 * property {(room: ChatRoom) => void} onSelectRoom - Callback when a room is selected.
 * property {string} [selectedRoomId] - The currently selected room's ID (optional).
 *
 * Usage:
 * ```tsx
 * <ChatRoomsList onSelectRoom={handleSelectRoom} selectedRoomId={currentRoomId} />
 * ```
 *
 * Features:
 * - Displays all available chat rooms.
 * - Highlights the currently selected room.
 * - Allows creation of new rooms with name, type, and visibility.
 * - Shows a message if there are no rooms available.
 * - Disables room creation if not connected.
 */
"use client";

import { useState } from "react";
import { useChat } from "@/app/hooks/useChat";
import { ChatRoom } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatRoomsListProps {
  onSelectRoom: (room: ChatRoom) => void;
  selectedRoomId?: string;
}

export const ChatRoomsList = ({ onSelectRoom, selectedRoomId }: ChatRoomsListProps) => {
  const { rooms, createRoom, isConnected } = useChat();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState<"direct" | "group" | "channel">("group");
  const [roomVisibility, setRoomVisibility] = useState<"public" | "private">("public");

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      return;
    }

    createRoom({
      name: roomName.trim(),
      type: roomType,
      visibility: roomVisibility
    });

    setRoomName("");
    setShowCreateForm(false);
  };

  return (
    <div className="w-80 border-r bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Salas de Chat</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          size="sm"
          disabled={!isConnected}
        >
          {showCreateForm ? "Cancelar" : "+ Nueva"}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-4 space-y-3">
          <Input
            placeholder="Nombre de la sala"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value as "direct" | "group" | "channel")}
            className="w-full p-2 border rounded"
          >
            <option value="group">Grupo</option>
            <option value="channel">Canal</option>
            <option value="direct">Directo</option>
          </select>
          <select
            value={roomVisibility}
            onChange={(e) => setRoomVisibility(e.target.value as "public" | "private")}
            className="w-full p-2 border rounded"
          >
            <option value="public">Pública</option>
            <option value="private">Privada</option>
          </select>
          <Button onClick={handleCreateRoom} className="w-full" size="sm">
            Crear Sala
          </Button>
        </Card>
      )}

      <div className="space-y-2">
        {rooms.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No tienes salas. ¡Crea una nueva!
          </p>
        ) : (
          rooms.map((room) => (
            <Card
              key={room.id}
              className={`p-3 cursor-pointer transition-colors ${
                selectedRoomId === room.id
                  ? "bg-blue-100 dark:bg-blue-900 border-blue-500"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => onSelectRoom(room)}
            >
              <h3 className="font-semibold">{room.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {room.type} • {room.participants.length} participantes
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
