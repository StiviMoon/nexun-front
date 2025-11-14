"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  ChatMessage,
  ChatRoom,
  JoinRoomData,
  SendMessageData,
  CreateRoomData,
  ChatError
} from "@/types/chat";
import { getAuthToken } from "@/utils/chat/getAuthToken";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface UseChatReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: ChatError | null;

  // Data
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>; // roomId -> messages
  currentRoom: ChatRoom | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string, type?: "text" | "image" | "file") => void;
  createRoom: (data: CreateRoomData) => void;
  getRoom: (roomId: string) => void;
  getMessages: (roomId: string, limit?: number, lastMessageId?: string) => void;
  setCurrentRoom: (room: ChatRoom | null) => void;
}

export const useChat = (): UseChatReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);

  // Connect to Socket.IO server
  const connect = useCallback(async () => {
    if (socketRef.current?.connected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error("No authentication token available");
      }

      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Create new socket connection
      const socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socketRef.current = socket;

      // Connection events
      socket.on("connect", () => {
        console.log("✅ Connected to chat server");
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from chat server:", reason);
        setIsConnected(false);
        setIsConnecting(false);
      });

      socket.on("connect_error", (err) => {
        console.error("Connection error:", err);
        setIsConnecting(false);
        
        // Handle authentication errors specifically
        if (err.message?.includes("auth") || err.message?.includes("unauthorized")) {
          setError({
            message: "Authentication failed. Please log in again.",
            code: "AUTH_ERROR"
          });
        } else {
          setError({
            message: err.message || "Failed to connect to chat server",
            code: "CONNECTION_ERROR"
          });
        }
      });

      // Room events
      socket.on("rooms:list", (receivedRooms: ChatRoom[]) => {
        console.log("📋 Received rooms list:", receivedRooms);
        setRooms(receivedRooms);
      });

      socket.on("room:joined", (data: { roomId: string; room: ChatRoom }) => {
        console.log("✅ Joined room:", data.roomId);
        setRooms((prev) => {
          const exists = prev.find((r) => r.id === data.roomId);
          if (exists) {
            return prev;
          }
          return [...prev, data.room];
        });
      });

      socket.on("room:left", (data: { roomId: string }) => {
        console.log("👋 Left room:", data.roomId);
        setCurrentRoom((prev) => (prev?.id === data.roomId ? null : prev));
      });

      socket.on("room:created", (room: ChatRoom) => {
        console.log("🏠 Room created:", room.id);
        setRooms((prev) => [...prev, room]);
        setCurrentRoom(room);
      });

      socket.on("room:details", (room: ChatRoom) => {
        console.log("📝 Room details:", room.id);
        setRooms((prev) => {
          const index = prev.findIndex((r) => r.id === room.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = room;
            return updated;
          }
          return [...prev, room];
        });
      });

      socket.on("room:user-joined", (data: { roomId: string; userId: string; userName?: string }) => {
        console.log(`👤 User ${data.userName || data.userId} joined room ${data.roomId}`);
      });

      socket.on("room:user-left", (data: { roomId: string; userId: string; userName?: string }) => {
        console.log(`👋 User ${data.userName || data.userId} left room ${data.roomId}`);
      });

      // Message events
      socket.on("message:new", (message: ChatMessage) => {
        console.log("💬 New message:", message);
        setMessages((prev) => {
          const roomMessages = prev[message.roomId] || [];
          // Avoid duplicates
          if (roomMessages.some((m) => m.id === message.id)) {
            return prev;
          }
          return {
            ...prev,
            [message.roomId]: [...roomMessages, message]
          };
        });
      });

      socket.on("messages:list", (data: { roomId: string; messages: ChatMessage[] }) => {
        console.log(`📨 Received ${data.messages.length} messages for room ${data.roomId}`);
        setMessages((prev) => ({
          ...prev,
          [data.roomId]: data.messages
        }));
      });

      // User status events
      socket.on("user:online", (data: { userId: string }) => {
        console.log(`🟢 User ${data.userId} is online`);
      });

      socket.on("user:offline", (data: { userId: string }) => {
        console.log(`🔴 User ${data.userId} is offline`);
      });

      // Error handling
      socket.on("error", (err: ChatError | unknown) => {
        // Log full error details for debugging
        console.error("Chat error received:", {
          error: err,
          type: typeof err,
          isObject: err && typeof err === "object",
          keys: err && typeof err === "object" ? Object.keys(err) : []
        });
        
        // Normalize error object
        let normalizedError: ChatError;
        
        if (err && typeof err === "object") {
          const errorObj = err as Partial<ChatError> & Record<string, unknown>;
          
          // Check if object is empty
          if (Object.keys(errorObj).length === 0) {
            normalizedError = {
              message: "An error occurred on the server",
              code: "SERVER_ERROR"
            };
          } else {
            normalizedError = {
              message: 
                (errorObj.message as string) || 
                (errorObj.error as string) || 
                (errorObj.msg as string) ||
                "An error occurred",
              code: (errorObj.code as string) || "UNKNOWN_ERROR"
            };
          }
        } else if (typeof err === "string") {
          normalizedError = {
            message: err,
            code: "UNKNOWN_ERROR"
          };
        } else {
          normalizedError = {
            message: "An unknown error occurred",
            code: "UNKNOWN_ERROR"
          };
        }
        
        console.error("Normalized error:", normalizedError);
        setError(normalizedError);
      });
    } catch (err) {
      console.error("Failed to connect:", err);
      setIsConnecting(false);
      setError({
        message: err instanceof Error ? err.message : "Failed to connect",
        code: "CONNECTION_FAILED"
      });
    }
  }, []);

  // Disconnect from server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setRooms([]);
    setMessages({});
    setCurrentRoom(null);
  }, []);

  // Join a room
  const joinRoom = useCallback(
    (roomId: string) => {
      if (!socketRef.current?.connected) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      const data: JoinRoomData = { roomId };
      socketRef.current.emit("room:join", data);
    },
    []
  );

  // Leave a room
  const leaveRoom = useCallback(
    (roomId: string) => {
      if (!socketRef.current?.connected) {
        return;
      }

      const data: JoinRoomData = { roomId };
      socketRef.current.emit("room:leave", data);
    },
    []
  );

  // Send a message
  const sendMessage = useCallback(
    (roomId: string, content: string, type: "text" | "image" | "file" = "text") => {
      if (!socketRef.current?.connected) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      if (!content.trim()) {
        return;
      }

      const data: SendMessageData = {
        roomId,
        content: content.trim(),
        type
      };

      socketRef.current.emit("message:send", data);
    },
    []
  );

  // Create a room
  const createRoom = useCallback(
    (data: CreateRoomData) => {
      if (!socketRef.current?.connected) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      socketRef.current.emit("room:create", data);
    },
    []
  );

  // Get room details
  const getRoom = useCallback(
    (roomId: string) => {
      if (!socketRef.current?.connected) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      socketRef.current.emit("room:get", roomId);
    },
    []
  );

  // Get messages for a room
  const getMessages = useCallback(
    (roomId: string, limit = 50, lastMessageId?: string) => {
      if (!socketRef.current?.connected) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      socketRef.current.emit("messages:get", { roomId, limit, lastMessageId });
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

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
    leaveRoom,
    sendMessage,
    createRoom,
    getRoom,
    getMessages,
    setCurrentRoom
  };
};

