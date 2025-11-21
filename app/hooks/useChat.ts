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

interface UseChatReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: ChatError | null;

  // Data
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  currentRoom: ChatRoom | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  joinRoom: (roomId: string, code?: string) => void;
  joinRoomByCode: (code: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string, type?: "text" | "image" | "file") => void;
  createRoom: (data: CreateRoomData) => void;
  getRoom: (roomId: string) => void;
  getMessages: (roomId: string, limit?: number, lastMessageId?: string) => void;
  setCurrentRoom: (room: ChatRoom | null) => void;
}

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

  // Connect to Socket.IO server using ChatService
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
          console.log("💬 New message:", message);
          addMessage(message);
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

  // Disconnect from server
  const disconnect = useCallback(() => {
    if (chatServiceRef.current) {
      chatServiceRef.current.disconnect();
      chatServiceRef.current = null;
    }
    listenersRegisteredRef.current = false;
    reset();
  }, [reset]);

  // Join a room (with optional code for private rooms)
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

  // Join a room by code only (searches for room with that code)
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

  // Leave a room
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

  // Send a message
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

  // Create a room
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

  // Get room details
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

  // Get messages for a room
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

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

