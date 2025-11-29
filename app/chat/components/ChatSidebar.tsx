"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChatRoom } from "@/types/chat";
import { Input } from "@/components/ui/input";
import { RoomCard } from "./RoomCard";
import { UserStatus } from "./UserStatus";
import { Plus, Search, MessageSquare, X, Lock, Globe, Copy, Check } from "lucide-react";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoomId?: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: { message: string; code?: string } | null;
  onCreateRoom: (data: { name: string; description?: string; type: "direct" | "group" | "channel"; visibility: "public" | "private" }) => void;
  onSelectRoom: (room: ChatRoom) => void;
  onJoinPublicRoom?: (room: ChatRoom) => void;
  onConnect: () => void;
  onJoinWithCode?: (code: string) => void;
  currentUserId?: string;
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
  onJoinPublicRoom,
  onConnect,
  onJoinWithCode,
  currentUserId,
  className
}: ChatSidebarProps) => {
  const { currentUser } = useAuthWithQuery();
  // Usar currentUserId del prop o del hook
  const userId = currentUserId || currentUser?.uid;
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomType, setRoomType] = useState<"direct" | "group" | "channel">("group");
  const [roomVisibility, setRoomVisibility] = useState<"public" | "private">("public");
  const [joinCode, setJoinCode] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [pendingPrivateCreation, setPendingPrivateCreation] = useState(false);
  const [lastCreatedRoomId, setLastCreatedRoomId] = useState<string | null>(null);
  // Mobile visibility state (persisted) - allows user to keep sidebar hidden on mobile
  const [mobileOpen, setMobileOpen] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return true;
      const saved = localStorage.getItem('chat-sidebar-open');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  // Buscar código de sala privada recién creada
  // Solo busca cuando hay una sala nueva creada por el usuario actual
  useEffect(() => {
    if (!pendingPrivateCreation || createdRoomCode || !userId) return;

    // Buscar sala privada recién creada con código
    const privateRoomWithCode = rooms.find(
      (r) =>
        r.visibility === "private" &&
        r.code &&
        r.createdBy === userId &&
        r.id !== lastCreatedRoomId &&
        // Sala creada en los últimos 15 segundos
        new Date(r.createdAt).getTime() > Date.now() - 15000
    );

    if (privateRoomWithCode?.code) {
      // Usar setTimeout para evitar setState en efecto directo
      setTimeout(() => {
        setCreatedRoomCode(privateRoomWithCode.code || null);
        setLastCreatedRoomId(privateRoomWithCode.id);
        setPendingPrivateCreation(false);
      }, 0);
    }
  }, [rooms, pendingPrivateCreation, createdRoomCode, userId, lastCreatedRoomId]);

  // Filtrar salas: mostrar públicas (todas) y privadas a las que el usuario pertenece
  const filteredRooms = useMemo(() => {
    if (!userId) return [];

    return rooms.filter((room) => {
      const isVideoMeetingRoom =
        room.metadata?.isVideoMeeting === true ||
        typeof room.metadata?.videoRoomId === "string" ||
        typeof room.videoRoomId === "string" ||
        (typeof room.name === "string" && room.name.endsWith(" - Chat"));
      if (isVideoMeetingRoom) {
        return false;
      }

      const matchesSearch =
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Mostrar salas públicas siempre (para que todos puedan unirse)
      if (room.visibility === "public") return true;

      // Mostrar salas privadas solo si el usuario es participante
      if (room.visibility === "private") {
        return room.participants.includes(userId);
      }

      return false;
    });
  }, [rooms, searchQuery, userId]);

  const handleCreateRoom = useCallback(() => {
    if (!roomName.trim() || !isConnected) {
      return;
    }

    const isPrivate = roomVisibility === "private";

    // Si es privada, marcar que estamos esperando el código
    if (isPrivate) {
      setPendingPrivateCreation(true);
    }

    onCreateRoom({
      name: roomName.trim(),
      description: roomDescription.trim() || undefined,
      type: roomType,
      visibility: roomVisibility,
    });

    // Limpiar campos solo si es pública
    if (!isPrivate) {
      setRoomName("");
      setRoomDescription("");
      setRoomVisibility("public");
      setShowCreateForm(false);
    }
    // Si es privada, mantenemos el formulario abierto para mostrar el código
  }, [roomName, roomVisibility, roomType, roomDescription, isConnected, onCreateRoom]);

  const handleJoinWithCode = useCallback(() => {
    if (!joinCode.trim() || !isConnected || !onJoinWithCode) {
      return;
    }
    onJoinWithCode(joinCode.trim().toUpperCase());
    setJoinCode("");
    setShowJoinForm(false);
  }, [joinCode, isConnected, onJoinWithCode]);

  const copyCodeToClipboard = useCallback(() => {
    if (createdRoomCode) {
      navigator.clipboard
        .writeText(createdRoomCode)
        .then(() => {
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Error copying to clipboard:", err);
        });
    }
  }, [createdRoomCode]);

  const handleToggleCreateForm = useCallback(() => {
    setShowCreateForm((prev) => !prev);
    setShowJoinForm(false);
    // Reset form state when closing
    if (showCreateForm) {
      setRoomName("");
      setRoomDescription("");
      setRoomVisibility("public");
      setCreatedRoomCode(null);
      setPendingPrivateCreation(false);
    }
  }, [showCreateForm]);

  // Persist mobileOpen preference
  useEffect(() => {
    try {
      localStorage.setItem('chat-sidebar-open', String(mobileOpen));
    } catch (e) {
      // ignore
    }
  }, [mobileOpen]);

  const handleToggleJoinForm = useCallback(() => {
    setShowJoinForm((prev) => !prev);
    setShowCreateForm(false);
    // Reset join form when closing
    if (showJoinForm) {
      setJoinCode("");
    }
  }, [showJoinForm]);

  // Resetear estado cuando se cierra el formulario de creación
  useEffect(() => {
    if (!showCreateForm) {
      // Resetear después de un pequeño delay para permitir la animación
      const timer = setTimeout(() => {
        setCreatedRoomCode(null);
        setCodeCopied(false);
        setPendingPrivateCreation(false);
        setLastCreatedRoomId(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showCreateForm]);

  // root classes: on mobile the sidebar is a slide-over; on lg+ it is a static aside
  const rootClasses = cn(
    'bg-background/50 backdrop-blur-sm flex flex-col border-l border-border/50',
    // sizing
    'w-full h-full flex-shrink-0',
    // mobile: fixed width, desktop: full width of container
    'lg:w-full',
    // positioning and transform for mobile
    'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:static lg:inset-auto',
    // mobile open/closed state
    mobileOpen ? 'translate-x-0' : '-translate-x-full',
    className
  );

  return (
    <>
      {/* Mobile opener button when sidebar is closed */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed bottom-15 right-4 z-50 p-3 rounded-full bg-zinc-900/80 text-white shadow-lg flex items-center justify-center"
          aria-label="Abrir chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Backdrop for mobile when open */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      <div className={rootClasses}>
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-light tracking-tight">Chat</h1>
          <div className="flex items-center gap-2">
            <UserStatus isConnected={isConnected} isConnecting={isConnecting} />
            {/* Close button on mobile to hide the sidebar */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="w-4 h-4 text-muted-foreground/80" />
            </button>
          </div>
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

        {/* Create room and Join buttons */}
        {isConnected && (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleToggleCreateForm}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                showCreateForm
                  ? "text-foreground/60 hover:text-foreground/80"
                  : "text-foreground/80 hover:text-foreground bg-foreground/5 hover:bg-foreground/10"
              )}
              aria-label={showCreateForm ? "Cancelar creación" : "Crear nueva sala"}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="truncate">{showCreateForm ? "Cancelar" : "Nueva sala"}</span>
            </button>
            <button
              onClick={handleToggleJoinForm}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                showJoinForm
                  ? "text-foreground/60 hover:text-foreground/80"
                  : "text-foreground/80 hover:text-foreground bg-foreground/5 hover:bg-foreground/10"
              )}
              title="Unirse con código"
              aria-label="Unirse a sala privada con código"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="truncate">Unirse con código</span>
            </button>
          </div>
        )}
      </div>

      {/* Join with code form */}
      {showJoinForm && isConnected && (
        <div className="px-4 pb-3 space-y-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs text-foreground/80">
            <Lock className="h-3.5 w-3.5" />
            <span>Unirse a sala privada</span>
          </div>
          <Input
            placeholder="Código de acceso"
            value={joinCode}
            onChange={(e) => {
              // Solo permitir caracteres alfanuméricos y convertir a mayúsculas
              const value = e.target.value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
              setJoinCode(value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && joinCode.trim()) {
                e.preventDefault();
                handleJoinWithCode();
              }
            }}
            className="h-9 bg-background/50 border-border/50 font-mono text-center text-base tracking-wider"
            maxLength={8}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={handleJoinWithCode}
            disabled={!joinCode.trim()}
            className="w-full px-3 py-2 text-xs font-medium text-foreground bg-foreground/10 hover:bg-foreground/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Unirse
          </button>
        </div>
      )}

      {/* Create room form */}
      {showCreateForm && isConnected && (
        <div className="px-4 pb-3 space-y-2 border-b border-border/50">
          <Input
            placeholder="Nombre de la sala"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            disabled={!!createdRoomCode}
            className="h-8 bg-background/50 border-border/50 text-sm"
          />
          <Input
            placeholder="Descripción (opcional)"
            value={roomDescription}
            onChange={(e) => setRoomDescription(e.target.value)}
            disabled={!!createdRoomCode}
            className="h-8 bg-background/50 border-border/50 text-sm"
          />
          <div className="flex flex-col gap-2">
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as "direct" | "group" | "channel")}
              disabled={!!createdRoomCode}
              className="w-full h-8 rounded-lg border border-border/50 bg-background/50 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-foreground/20"
            >
              <option value="group">Grupo</option>
              <option value="channel">Canal</option>
              <option value="direct">Directo</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setRoomVisibility("public")}
                disabled={!!createdRoomCode}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  roomVisibility === "public"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-background/50 text-foreground/60 hover:bg-background/70 border border-border/50",
                  createdRoomCode && "opacity-50 cursor-not-allowed"
                )}
              >
                <Globe className="h-3 w-3" />
                <span className="truncate">Pública</span>
              </button>
              <button
                onClick={() => setRoomVisibility("private")}
                disabled={!!createdRoomCode}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  roomVisibility === "private"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-background/50 text-foreground/60 hover:bg-background/70 border border-border/50",
                  createdRoomCode && "opacity-50 cursor-not-allowed"
                )}
              >
                <Lock className="h-3 w-3" />
                <span className="truncate">Privada</span>
              </button>
            </div>
          </div>

          {/* Mostrar código generado */}
          {createdRoomCode && (
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-purple-400 mb-1.5">Código de acceso:</p>
              <div className="flex items-center gap-1.5">
                <code className="flex-1 text-center font-mono text-sm font-bold text-white bg-black/30 px-2 py-1.5 rounded border border-purple-500/30 truncate">
                  {createdRoomCode}
                </code>
                <button
                  onClick={copyCodeToClipboard}
                  className="p-1.5 rounded hover:bg-purple-500/20 transition-colors shrink-0"
                  title="Copiar código"
                >
                  {codeCopied ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-purple-400" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-purple-400/70 mt-1.5 leading-tight">
                Comparte este código para invitar
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || !!createdRoomCode}
              className="w-full px-3 py-2 text-xs font-medium text-foreground bg-foreground/10 hover:bg-foreground/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {createdRoomCode ? "Código generado ✓" : "Crear sala"}
            </button>
            {createdRoomCode && (
              <button
                onClick={() => {
                  setShowCreateForm(false);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-foreground/60 hover:text-foreground bg-background/50 hover:bg-background/70 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 min-h-0">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/60">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {searchQuery ? "No se encontraron salas" : "No hay salas"}
            </p>
          </div>
        ) : (
                  filteredRooms.map((room) => {
                    const isParticipant = userId ? room.participants.includes(userId) : false;
                    return (
                      <RoomCard
                        key={room.id}
                        room={room}
                        isSelected={selectedRoomId === room.id}
                        onClick={() => onSelectRoom(room)}
                        isParticipant={isParticipant}
                        onJoinPublicRoom={onJoinPublicRoom}
                        currentUserId={userId}
                      />
                    );
                  })
        )}
      </div>

      {/* Footer with user info */}
      <div className="p-3 border-t border-border/50 flex-shrink-0">
        <div className="text-xs text-muted-foreground/80">
          <p className="font-medium truncate">{currentUser?.displayName || currentUser?.email}</p>
        </div>
      </div>
    </div>
    </>
  );
};
