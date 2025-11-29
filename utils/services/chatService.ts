import { io, Socket } from "socket.io-client";
import { getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "@/config/firebase";
import { ChatMessage, ChatRoom } from "@/types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const CHAT_SERVICE_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:3002";

const getFirebaseAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const existingApps = getApps();
  const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  return getAuth(app);
};

/**
 * Get Firebase ID token for Socket.IO authentication
 */
const getIdToken = async (forceRefresh = false): Promise<string | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      return null;
    }

    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
};

export class ChatService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private useGateway: boolean;

  // Callbacks almacenados para re-registrarlos en reconexiones
  private callbacks: {
    onMessage?: (message: ChatMessage) => void;
    onRoomsList?: (rooms: ChatRoom[]) => void;
    onRoomJoined?: (data: { roomId: string; room: ChatRoom }) => void;
    onRoomLeft?: (data: { roomId: string }) => void;
    onRoomCreated?: (room: ChatRoom) => void;
    onRoomDetails?: (room: ChatRoom) => void;
    onMessagesList?: (data: { roomId: string; messages: ChatMessage[] }) => void;
    onUserOnline?: (data: { userId: string }) => void;
    onUserOffline?: (data: { userId: string }) => void;
    onError?: (error: { message: string; code?: string }) => void;
  } = {};

  constructor(useGateway = false) {
    this.useGateway = useGateway;
    this.baseUrl = useGateway ? API_BASE_URL : CHAT_SERVICE_URL;
  }

  private registerAllListeners(): void {
    if (!this.socket) {
      console.warn("⚠️ [ChatService] No socket disponible para registrar listeners");
      return;
    }

    console.log(`🔄 [ChatService] Re-registrando todos los listeners en socket ${this.socket.id}`);

    if (this.callbacks.onMessage) {
      this.socket.off("message:new");
      this.socket.on("message:new", this.callbacks.onMessage);
      console.log(`✅ [ChatService] Listener message:new registrado`);
    }
    if (this.callbacks.onRoomsList) {
      this.socket.off("rooms:list");
      this.socket.on("rooms:list", this.callbacks.onRoomsList);
    }
    if (this.callbacks.onRoomJoined) {
      this.socket.off("room:joined");
      this.socket.on("room:joined", this.callbacks.onRoomJoined);
    }
    if (this.callbacks.onRoomLeft) {
      this.socket.off("room:left");
      this.socket.on("room:left", this.callbacks.onRoomLeft);
    }
    if (this.callbacks.onRoomCreated) {
      this.socket.off("room:created");
      this.socket.on("room:created", this.callbacks.onRoomCreated);
    }
    if (this.callbacks.onRoomDetails) {
      this.socket.off("room:details");
      this.socket.on("room:details", this.callbacks.onRoomDetails);
    }
    if (this.callbacks.onMessagesList) {
      this.socket.off("messages:list");
      this.socket.on("messages:list", this.callbacks.onMessagesList);
    }
    if (this.callbacks.onUserOnline) {
      this.socket.off("user:online");
      this.socket.on("user:online", this.callbacks.onUserOnline);
    }
    if (this.callbacks.onUserOffline) {
      this.socket.off("user:offline");
      this.socket.on("user:offline", this.callbacks.onUserOffline);
    }
    if (this.callbacks.onError) {
      this.socket.off("error");
      this.socket.on("error", this.callbacks.onError);
    }

    console.log(`✅ [ChatService] Todos los listeners registrados en socket ${this.socket.id}`);
  }

  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = await getIdToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    // Disconnect existing socket if any
    if (this.socket) {
      // Remove all listeners before disconnecting
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = io(this.baseUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to chat service");
      setTimeout(() => {
        this.registerAllListeners();
      }, 100);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from chat service:", reason);
    });

    // Only log socket errors if they have meaningful information
    this.socket.on("error", (error: unknown) => {
      // Only log if error has meaningful information
      if (error && typeof error === "object") {
        const errorObj = error as Record<string, unknown>;
        if (Object.keys(errorObj).length > 0) {
          console.error("Socket error:", error);
        }
        // Silently ignore empty errors
      } else if (error && typeof error === "string" && error.length > 0) {
        console.error("Socket error:", error);
      }
      // Silently ignore empty errors (no log)
    });

    // Listen for connection errors (more reliable than "error" event)
    this.socket.on("connect_error", (err) => {
      // This is handled by useChat hook, just log here
      if (err.message?.includes("auth") || err.message?.includes("unauthorized")) {
        console.error("Authentication error:", err.message);
      } else {
        console.error("Connection error:", err.message || err);
      }
    });

    this.socket.on("auth:error", async () => {
      console.log("🔄 Token expired, refreshing...");
      const newToken = await getIdToken(true);
      if (newToken && this.socket) {
        (this.socket.auth as { token: string }).token = newToken;
        this.socket.disconnect();
        setTimeout(() => {
          if (this.socket) {
            this.socket.connect();
          }
        }, 500);
      }
    });

    if (this.socket.connected) {
      this.registerAllListeners();
    }

    return this.socket;
  }

  // Join a room (with optional code for private rooms)
  joinRoom(roomId: string, code?: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("room:join", { roomId, code });
  }

  // Join a room by code only (searches for room with that code)
  joinRoomByCode(code: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("room:join-by-code", { code });
  }

  // Leave a room
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("room:leave", { roomId });
  }

  // Send a message
  sendMessage(roomId: string, content: string, type: "text" | "image" | "file" = "text"): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("message:send", {
      roomId,
      content,
      type,
    });
  }

  // Create a room
  // Backend expects: name, type ("direct" | "group" | "channel"), visibility ("public" | "private"), and optionally description, participants
  createRoom(
    name: string,
    type: "direct" | "group" | "channel",
    visibility: "public" | "private",
    description?: string,
    participants: string[] = []
  ): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("room:create", {
      name,
      type,
      visibility,
      description,
      participants,
    });
  }

  // Get room info
  getRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("room:get", roomId);
  }

  // Get messages
  getMessages(roomId: string, limit = 50, startAfter: string | null = null): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("messages:get", {
      roomId,
      limit,
      startAfter,
    });
  }

  // Request rooms list
  listRooms(): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("rooms:list");
  }

  onMessage(callback: (message: ChatMessage) => void): void {
    this.callbacks.onMessage = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado para registro posterior");
      return;
    }
    this.socket.off("message:new");
    this.socket.on("message:new", callback);
    console.log("✅ [ChatService] Listener message:new registrado");
  }

  onRoomsList(callback: (rooms: ChatRoom[]) => void): void {
    this.callbacks.onRoomsList = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado");
      return;
    }
    this.socket.off("rooms:list");
    this.socket.on("rooms:list", callback);
  }

  onRoomLeft(callback: (data: { roomId: string }) => void): void {
    this.callbacks.onRoomLeft = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado");
      return;
    }
    this.socket.off("room:left");
    this.socket.on("room:left", callback);
  }

  onRoomJoined(callback: (data: { roomId: string; room: ChatRoom }) => void): void {
    this.callbacks.onRoomJoined = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado");
      return;
    }
    this.socket.off("room:joined");
    this.socket.on("room:joined", callback);
  }

  onUserOnline(callback: (data: { userId: string }) => void): void {
    this.callbacks.onUserOnline = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado");
      return;
    }
    this.socket.off("user:online");
    this.socket.on("user:online", callback);
  }

  onUserOffline(callback: (data: { userId: string }) => void): void {
    this.callbacks.onUserOffline = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado");
      return;
    }
    this.socket.off("user:offline");
    this.socket.on("user:offline", callback);
  }

  onRoomCreated(callback: (room: ChatRoom) => void): void {
    this.callbacks.onRoomCreated = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado");
      return;
    }
    this.socket.off("room:created");
    this.socket.on("room:created", callback);
  }

  onRoomDetails(callback: (room: ChatRoom) => void): void {
    this.callbacks.onRoomDetails = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado");
      return;
    }
    this.socket.off("room:details");
    this.socket.on("room:details", callback);
  }

  onMessagesList(callback: (data: { roomId: string; messages: ChatMessage[] }) => void): void {
    this.callbacks.onMessagesList = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado");
      return;
    }
    this.socket.off("messages:list");
    this.socket.on("messages:list", callback);
  }

  onError(callback: (error: { message: string; code?: string }) => void): void {
    this.callbacks.onError = callback;
    if (!this.socket) {
      console.warn("⚠️ [ChatService] Socket no inicializado, callback guardado");
      return;
    }
    this.socket.off("error");
    this.socket.on("error", callback);
  }

  // Remove event listeners
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

