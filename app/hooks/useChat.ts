"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChatMessage,
  ChatRoom,
  CreateRoomData,
  ChatError
} from "@/types/chat";
import { ChatService } from "@/utils/services/chatService";

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

export const useChat = (useGateway = false): UseChatReturn => {
  const chatServiceRef = useRef<ChatService | null>(null);
  const listenersRegisteredRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);

  // Connect to Socket.IO server using ChatService
  const connect = useCallback(async () => {
    if (chatServiceRef.current?.isConnected()) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Initialize ChatService if not already done
      if (!chatServiceRef.current) {
        chatServiceRef.current = new ChatService(useGateway);
      }

      const chatService = chatServiceRef.current;

      // Connect to the service before registering listeners
      const socket = await chatService.connect();

      if (!listenersRegisteredRef.current) {
        chatService.onRoomsList((receivedRooms: ChatRoom[]) => {
          console.log("📋 Received rooms list:", receivedRooms);
          setRooms(receivedRooms);
        });

        chatService.onMessage((message: ChatMessage) => {
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

        chatService.onRoomJoined((data: { roomId: string; room: ChatRoom }) => {
          console.log("✅ Joined room:", data.roomId);
          setRooms((prev) => {
            const exists = prev.find((r) => r.id === data.roomId);
            if (exists) {
              return prev;
            }
            return [...prev, data.room];
          });
        });

        chatService.onRoomCreated((room: ChatRoom) => {
          console.log("🏠 Room created:", room.id);
          setRooms((prev) => [...prev, room]);
          setCurrentRoom(room);
        });

        chatService.onRoomLeft((data: { roomId: string }) => {
          console.log("👋 Left room:", data.roomId);
          setCurrentRoom((prev) => (prev?.id === data.roomId ? null : prev));
        });

        chatService.onRoomDetails((room: ChatRoom) => {
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

        chatService.onMessagesList((data: { roomId: string; messages: ChatMessage[] }) => {
          console.log(`📨 Received ${data.messages.length} messages for room ${data.roomId}`);
          setMessages((prev) => ({
            ...prev,
            [data.roomId]: data.messages
          }));
        });

        chatService.onUserOnline((data: { userId: string }) => {
          console.log(`🟢 User ${data.userId} is online`);
        });

        chatService.onUserOffline((data: { userId: string }) => {
          console.log(`🔴 User ${data.userId} is offline`);
        });

        chatService.onError((err: { message: string; code?: string }) => {
          console.error("Chat error:", err);
          setError({
            message: err.message,
            code: err.code || "UNKNOWN_ERROR"
          });
        });

        listenersRegisteredRef.current = true;
      }

      // Listen to socket connection events
      socket.on("connect", () => {
        console.log("✅ Connected to chat server");
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        // Request initial rooms list
        try {
          chatService.listRooms();
        } catch (listError) {
          console.error("Failed to request rooms list:", listError);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ Disconnected from chat server");
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
    } catch (err) {
      console.error("Failed to connect:", err);
      setIsConnecting(false);
      setError({
        message: err instanceof Error ? err.message : "Failed to connect",
        code: "CONNECTION_FAILED"
      });
    }
  }, [useGateway]);

  // Disconnect from server
  const disconnect = useCallback(() => {
    if (chatServiceRef.current) {
      chatServiceRef.current.disconnect();
      chatServiceRef.current = null;
    }
    listenersRegisteredRef.current = false;
    setIsConnected(false);
    setIsConnecting(false);
    setRooms([]);
    setMessages({});
    setCurrentRoom(null);
  }, []);

  // Join a room
  const joinRoom = useCallback(
    (roomId: string) => {
      if (!chatServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      try {
        chatServiceRef.current.joinRoom(roomId);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to join room",
          code: "JOIN_ERROR"
        });
      }
    },
    []
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
    []
  );

  // Create a room
  const createRoom = useCallback(
    (data: CreateRoomData) => {
      if (!chatServiceRef.current?.isConnected()) {
        setError({ message: "Not connected to chat server", code: "NOT_CONNECTED" });
        return;
      }

      try {
        chatServiceRef.current.createRoom(data.name, data.type, data.participants);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to create room",
          code: "CREATE_ERROR"
        });
      }
    },
    []
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
    []
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

