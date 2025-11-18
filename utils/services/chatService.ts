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

  constructor(useGateway = false) {
    this.useGateway = useGateway;
    this.baseUrl = useGateway ? API_BASE_URL : CHAT_SERVICE_URL;
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
    });

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Connected to chat service");
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from chat service");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Listen for token expiration
    this.socket.on("auth:error", async () => {
      // Refresh token and reconnect
      const newToken = await getIdToken(true);
      if (newToken && this.socket) {
        // Update auth token and reconnect
        (this.socket.auth as { token: string }).token = newToken;
        this.socket.disconnect();
        this.socket.connect();
      }
    });

    return this.socket;
  }

  // Join a room
  joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("room:join", { roomId });
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
  // Note: Backend expects "private" | "group", but we accept all types for flexibility
  createRoom(name: string, type: "private" | "group" | "direct" | "channel", participants: string[] = []): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    // Map frontend types to backend types
    const backendType = type === "direct" || type === "channel" ? "group" : type;
    this.socket.emit("room:create", {
      name,
      type: backendType,
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

  // Listen for new messages
  onMessage(callback: (message: ChatMessage) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("message:new", callback);
  }

  // Listen for rooms list
  onRoomsList(callback: (rooms: ChatRoom[]) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("rooms:list", callback);
  }

  // Listen for room left events
  onRoomLeft(callback: (data: { roomId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("room:left", callback);
  }

  // Listen for room updates
  onRoomJoined(callback: (data: { roomId: string; room: ChatRoom }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("room:joined", callback);
  }

  // Listen for user status
  onUserOnline(callback: (data: { userId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("user:online", callback);
  }

  onUserOffline(callback: (data: { userId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("user:offline", callback);
  }

  // Listen for room created
  onRoomCreated(callback: (room: ChatRoom) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("room:created", callback);
  }

  // Listen for room details
  onRoomDetails(callback: (room: ChatRoom) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("room:details", callback);
  }

  // Listen for messages list
  onMessagesList(callback: (data: { roomId: string; messages: ChatMessage[] }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("messages:list", callback);
  }

  // Listen for errors
  onError(callback: (error: { message: string; code?: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
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

