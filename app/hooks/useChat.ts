"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import {
  ChatMessage,
  ChatRoom,
  CreateRoomData,
  ChatError
} from "@/types/chat";
import { ChatService } from "@/utils/services/chatService";
import { useChatStore } from "@/utils/chatStore";

/**
 * Interfaz de retorno del hook useChat
 * @interface UseChatReturn
 */
interface UseChatReturn {
  /** Estado de conexión al servidor de chat */
  isConnected: boolean;
  /** Estado de conexión en progreso */
  isConnecting: boolean;
  /** Error actual, si existe */
  error: ChatError | null;

  /** Lista de salas de chat disponibles */
  rooms: ChatRoom[];
  /** Mensajes organizados por ID de sala */
  messages: Record<string, ChatMessage[]>;
  /** Sala de chat actualmente seleccionada */
  currentRoom: ChatRoom | null;

  /** Conecta al servidor de chat */
  connect: () => Promise<void>;
  /** Desconecta del servidor de chat */
  disconnect: () => void;
  /** Se une a una sala de chat (con código opcional para salas privadas) */
  joinRoom: (roomId: string, code?: string) => void;
  /** Se une a una sala de chat usando solo el código */
  joinRoomByCode: (code: string) => void;
  /** Abandona una sala de chat */
  leaveRoom: (roomId: string) => void;
  /** Envía un mensaje a una sala */
  sendMessage: (roomId: string, content: string, type?: "text" | "image" | "file") => void;
  /** Crea una nueva sala de chat */
  createRoom: (data: CreateRoomData) => void;
  /** Obtiene los detalles de una sala */
  getRoom: (roomId: string) => void;
  /** Obtiene los mensajes de una sala */
  getMessages: (roomId: string, limit?: number, lastMessageId?: string) => void;
  /** Establece la sala de chat actual */
  setCurrentRoom: (room: ChatRoom | null) => void;
}

/**
 * Hook personalizado para gestionar la conexión y operaciones de chat en tiempo real.
 * 
 * Este hook proporciona una interfaz simplificada para interactuar con el servicio de chat,
 * manejando la conexión Socket.IO, el estado de las salas, mensajes y eventos en tiempo real.
 * 
 * @param {boolean} [useGateway=false] - Si es true, usa el gateway API en lugar del servicio de chat directo
 * @returns {UseChatReturn} Objeto con el estado y funciones del chat
 * 
 * @example
 * ```tsx
 * const { 
 *   isConnected, 
 *   rooms, 
 *   messages, 
 *   connect, 
 *   sendMessage 
 * } = useChat();
 * 
 * useEffect(() => {
 *   connect();
 * }, []);
 * ```
 */
export const useChat = (useGateway = false): UseChatReturn => {
  const chatServiceRef = useRef<ChatService | null>(null);
  const listenersRegisteredRef = useRef(false);
  const rooms = useChatStore((state) => state.rooms);
  const messages = useChatStore((state) => state.messages);
  const currentRoomId = useChatStore((state) => state.currentRoomId);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);
  const error = useChatStore((state) => state.error);
  const setRooms = useChatStore((state) => state.setRooms);
  const upsertRoom = useChatStore((state) => state.upsertRoom);
  const setCurrentRoomId = useChatStore((state) => state.setCurrentRoomId);
  const setMessagesForRoom = useChatStore((state) => state.setMessagesForRoom);
  const addMessage = useChatStore((state) => state.addMessage);
  const setConnected = useChatStore((state) => state.setConnected);
  const setConnecting = useChatStore((state) => state.setConnecting);
  const setError = useChatStore((state) => state.setError);
  const reset = useChatStore((state) => state.reset);
  const currentRoom = useMemo(
    () => rooms.find((room) => room.id === currentRoomId) || null,
    [rooms, currentRoomId]
  );

  /**
   * Conecta al servidor de Socket.IO usando ChatService.
   * Registra todos los listeners de eventos necesarios y maneja la reconexión automática.
   * 
   * @returns {Promise<void>} Promesa que se resuelve cuando la conexión se establece
   * @throws {Error} Si falla la conexión o no hay token de autenticación
   */
  const connect = useCallback(async () => {
    if (chatServiceRef.current?.isConnected()) {
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      if (!chatServiceRef.current) {
        chatServiceRef.current = new ChatService(useGateway);
      }

      const chatService = chatServiceRef.current;
      const socket = await chatService.connect();

      if (!listenersRegisteredRef.current) {
        // Register event listeners only once
        chatService.onRoomsList((receivedRooms: ChatRoom[]) => {
          console.log("📋 Received rooms list:", receivedRooms);
          setRooms(receivedRooms);
        });

        chatService.onMessage((message: ChatMessage) => {
          console.log("💬 [CHAT] Nuevo mensaje recibido:", {
            id: message.id,
            roomId: message.roomId,
            senderId: message.senderId,
            content: message.content?.substring(0, 50),
            timestamp: message.timestamp
          });
          addMessage(message);
          console.log("✅ [CHAT] Mensaje agregado al store");
        });

        chatService.onRoomJoined((data: { roomId: string; room: ChatRoom }) => {
          console.log("✅ Joined room:", data.roomId);
          // Actualizar la sala con los nuevos participantes (incluyendo al usuario actual)
          upsertRoom(data.room);
          // Si esta es la sala actual, actualizar también
          const { currentRoomId } = useChatStore.getState();
          if (currentRoomId === data.roomId) {
            setCurrentRoomId(data.room.id);
          }
        });

        chatService.onRoomCreated((room: ChatRoom) => {
          console.log("🏠 Room created:", room.id);
          upsertRoom(room);
          setCurrentRoomId(room.id);
        });

        chatService.onRoomLeft((data: { roomId: string }) => {
          console.log("👋 Left room:", data.roomId);
          const { currentRoomId: activeRoomId } = useChatStore.getState();
          if (activeRoomId === data.roomId) {
            setCurrentRoomId(null);
          }
        });

        chatService.onRoomDetails((room: ChatRoom) => {
          console.log("📝 Room details:", room.id);
          upsertRoom(room);
        });

        chatService.onMessagesList((data: { roomId: string; messages: ChatMessage[] }) => {
          console.log(`📨 Received ${data.messages.length} messages for room ${data.roomId}`);
          setMessagesForRoom(data.roomId, data.messages);
        });

        chatService.onUserOnline((data: { userId: string }) => {
          console.log(`🟢 User ${data.userId} is online`);
        });

        chatService.onUserOffline((data: { userId: string }) => {
          console.log(`🔴 User ${data.userId} is offline`);
        });

        chatService.onError((err: { message: string; code?: string }) => {
          // Only set error if it has meaningful information
          if (err && err.message && err.message.length > 0) {
            console.error("Chat error:", err);
            setError({
              message: err.message,
              code: err.code || "UNKNOWN_ERROR"
            });
          }
        });

        listenersRegisteredRef.current = true;
      }

      // Register socket connection events (only once, not inside listenersRegistered check)
      // These need to be registered each time socket is created
      socket.on("connect", () => {
        console.log("✅ Connected to chat server");
        setConnected(true);
        setConnecting(false);
        setError(null);
        try {
          chatService.listRooms();
        } catch (listError) {
          console.error("Failed to request rooms list:", listError);
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from chat server:", reason);
        setConnected(false);
        setConnecting(false);
        // Don't set error on disconnect, it's normal
      });

      socket.on("connect_error", (err) => {
        console.error("Connection error:", err.message || err);
        setConnecting(false);

        // Only set error if it's not a timeout (timeouts are handled by reconnection)
        if (!err.message?.includes("timeout") && !err.message?.includes("xhr poll error")) {
          if (err.message?.includes("auth") || err.message?.includes("unauthorized")) {
            setError({
              message: "Authentication failed. Please log in again.",
              code: "AUTH_ERROR"
            });
          } else if (err.message) {
            setError({
              message: err.message,
              code: "CONNECTION_ERROR"
            });
          }
        }
      });
    } catch (err) {
      console.error("Failed to connect:", err);
      setConnecting(false);
      setError({
        message: err instanceof Error ? err.message : "Failed to connect",
        code: "CONNECTION_FAILED"
      });
    }
  }, [
    useGateway,
    addMessage,
    setRooms,
    upsertRoom,
    setCurrentRoomId,
    setMessagesForRoom,
    setConnected,
    setConnecting,
    setError
  ]);

  /**
   * Desconecta del servidor de chat y limpia todos los recursos.
   * Resetea el estado del store y elimina todas las referencias.
   */
  const disconnect = useCallback(() => {
    if (chatServiceRef.current) {
      chatServiceRef.current.disconnect();
      chatServiceRef.current = null;
    }
    listenersRegisteredRef.current = false;
    reset();
  }, [reset]);

  /**
   * Se une a una sala de chat.
   * 
   * @param {string} roomId - ID de la sala a la que unirse
   * @param {string} [code] - Código de acceso opcional para salas privadas
   * @throws {Error} Si no hay conexión o falla la operación
   */
  const joinRoom = useCallback(
    (roomId: string, code?: string) => {
      if (!chatServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      try {
        chatServiceRef.current.joinRoom(roomId, code);
        setCurrentRoomId(roomId); // Set current room in store
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to join room",
          code: "JOIN_ERROR"
        });
      }
    },
    [setError, setCurrentRoomId]
  );

  /**
   * Se une a una sala de chat usando solo el código.
   * Busca automáticamente la sala que corresponde al código proporcionado.
   * 
   * @param {string} code - Código de la sala (mínimo 6 caracteres)
   * @throws {Error} Si el código es inválido, no hay conexión o falla la operación
   */
  const joinRoomByCode = useCallback(
    (code: string) => {
      if (!chatServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      if (!code || code.trim().length < 6) {
        setError({
          message: "Código inválido (debe tener al menos 6 caracteres)",
          code: "INVALID_CODE_FORMAT"
        });
        return;
      }

      try {
        chatServiceRef.current.joinRoomByCode(code.trim().toUpperCase());
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to join room with code",
          code: "JOIN_BY_CODE_ERROR"
        });
      }
    },
    [setError]
  );

  /**
   * Abandona una sala de chat.
   * 
   * @param {string} roomId - ID de la sala a abandonar
   */
  const leaveRoom = useCallback(
    (roomId: string) => {
      if (!chatServiceRef.current?.isConnected()) {
        return;
      }

      try {
        chatServiceRef.current.leaveRoom(roomId);
      } catch (err) {
        // Silently fail on leave
        console.error("Failed to leave room:", err);
      }
    },
    []
  );

  /**
   * Envía un mensaje a una sala de chat.
   * 
   * @param {string} roomId - ID de la sala donde enviar el mensaje
   * @param {string} content - Contenido del mensaje
   * @param {"text" | "image" | "file"} [type="text"] - Tipo de mensaje
   * @throws {Error} Si no hay conexión, el contenido está vacío o falla la operación
   */
  const sendMessage = useCallback(
    (roomId: string, content: string, type: "text" | "image" | "file" = "text") => {
      if (!chatServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      if (!content.trim()) {
        return;
      }

      try {
        chatServiceRef.current.sendMessage(roomId, content.trim(), type);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to send message",
          code: "SEND_ERROR"
        });
      }
    },
    [setError]
  );

  /**
   * Crea una nueva sala de chat.
   * 
   * @param {CreateRoomData} data - Datos de la sala a crear (nombre, tipo, visibilidad, etc.)
   * @throws {Error} Si no hay conexión, faltan campos requeridos o falla la operación
   */
  const createRoom = useCallback(
    (data: CreateRoomData) => {
      if (!chatServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      // Validate required fields
      if (!data.name || !data.type || !data.visibility) {
        setError({
          message: "Nombre, tipo y visibilidad son requeridos",
          code: "VALIDATION_ERROR"
        });
        return;
      }

      try {
        chatServiceRef.current.createRoom(
          data.name,
          data.type,
          data.visibility,
          data.description,
          data.participants || []
        );
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to create room",
          code: "CREATE_ERROR"
        });
      }
    },
    [setError]
  );

  /**
   * Obtiene los detalles de una sala de chat.
   * 
   * @param {string} roomId - ID de la sala
   * @throws {Error} Si no hay conexión o falla la operación
   */
  const getRoom = useCallback(
    (roomId: string) => {
      if (!chatServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      try {
        chatServiceRef.current.getRoom(roomId);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to get room",
          code: "GET_ROOM_ERROR"
        });
      }
    },
    [setError]
  );

  /**
   * Obtiene los mensajes de una sala de chat.
   * 
   * @param {string} roomId - ID de la sala
   * @param {number} [limit=50] - Número máximo de mensajes a obtener
   * @param {string} [lastMessageId] - ID del último mensaje para paginación
   * @throws {Error} Si no hay conexión o falla la operación
   */
  const getMessages = useCallback(
    (roomId: string, limit = 50, lastMessageId?: string) => {
      if (!chatServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      try {
        chatServiceRef.current.getMessages(roomId, limit, lastMessageId || null);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to get messages",
          code: "GET_MESSAGES_ERROR"
        });
      }
    },
    [setError]
  );

  /**
   * Limpia la conexión cuando el componente se desmonta.
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  /**
   * Actualiza la sala de chat actual en el store.
   * 
   * @param {ChatRoom | null} room - Sala a establecer como actual, o null para limpiar
   */
  const updateCurrentRoom = useCallback(
    (room: ChatRoom | null) => {
      setCurrentRoomId(room?.id ?? null);
    },
    [setCurrentRoomId]
  );

  return {
    isConnected,
    isConnecting,
    error,
    rooms,
    messages,
    currentRoom,
    connect,
    disconnect,
    joinRoom,
    joinRoomByCode,
    leaveRoom,
    sendMessage,
    createRoom,
    getRoom,
    getMessages,
    setCurrentRoom: updateCurrentRoom
  };
};

