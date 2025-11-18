import { io, Socket } from "socket.io-client";
import { getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "@/config/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const VIDEO_SERVICE_URL = process.env.NEXT_PUBLIC_VIDEO_SERVICE_URL || "http://localhost:3003";

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

export interface VideoRoom {
  id: string;
  name: string;
  description?: string;
  maxParticipants: number;
  createdAt: Date;
  participants: string[];
}

export interface WebRTCOffer {
  type: "offer";
  sdp: string;
}

export interface WebRTCAnswer {
  type: "answer";
  sdp: string;
}

export interface RTCIceCandidate {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
}

export class VideoService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private useGateway: boolean;

  constructor(useGateway = false) {
    this.useGateway = useGateway;
    this.baseUrl = useGateway ? API_BASE_URL : VIDEO_SERVICE_URL;
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
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to video service");
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from video service");
    });

    this.socket.on("error", (error) => {
      console.error("Video socket error:", error);
    });

    // Listen for token expiration
    this.socket.on("auth:error", async () => {
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

  // Create a video room
  createRoom(name: string, description?: string, maxParticipants = 50): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:room:create", {
      name,
      description,
      maxParticipants,
    });
  }

  // Join a video room
  joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:room:join", { roomId });
  }

  // Leave a video room
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("video:room:leave", { roomId });
  }

  // WebRTC signaling events - Listeners
  onOffer(callback: (data: { roomId: string; offer: WebRTCOffer; from: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:offer", callback);
  }

  onAnswer(callback: (data: { roomId: string; answer: WebRTCAnswer; from: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:answer", callback);
  }

  onIceCandidate(callback: (data: { roomId: string; candidate: RTCIceCandidate; from: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:ice-candidate", callback);
  }

  // WebRTC signaling events - Emitters
  sendOffer(roomId: string, offer: WebRTCOffer): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:offer", { roomId, offer });
  }

  sendAnswer(roomId: string, answer: WebRTCAnswer): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:answer", { roomId, answer });
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidate): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:ice-candidate", { roomId, candidate });
  }

  // Room events
  onRoomCreated(callback: (room: VideoRoom) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:created", callback);
  }

  onRoomJoined(callback: (data: { roomId: string; room: VideoRoom }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:joined", callback);
  }

  onRoomLeft(callback: (data: { roomId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:left", callback);
  }

  onParticipantJoined(callback: (data: { roomId: string; userId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:participant:joined", callback);
  }

  onParticipantLeft(callback: (data: { roomId: string; userId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:participant:left", callback);
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

