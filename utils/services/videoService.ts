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
  hostId: string;
  participants: string[];
  maxParticipants: number;
  isRecording: boolean;
  visibility: "public" | "private";
  code?: string;
  chatRoomId?: string;
  chatRoomCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoParticipant {
  userId: string;
  socketId: string;
  userName?: string;
  userEmail?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
}

export interface VideoSignalData {
  type: "offer" | "answer" | "ice-candidate";
  roomId: string;
  targetUserId?: string;
  data: unknown;
  metadata?: {
    isScreenSharing?: boolean;
    streamType?: "camera" | "screen";
  };
}

type CallbackMap = {
  onRoomCreated?: (room: VideoRoom) => void;
  onRoomJoined?: (data: { roomId: string; room: VideoRoom; participants: VideoParticipant[] }) => void;
  onRoomLeft?: (data: { roomId: string }) => void;
  onUserJoined?: (data: { roomId: string; userId: string; userName?: string }) => void;
  onUserLeft?: (data: { roomId: string; userId: string }) => void;
  onSignal?: (data: { type: string; roomId: string; fromUserId: string; data: unknown; metadata?: { isScreenSharing?: boolean; streamType?: "camera" | "screen" } }) => void;
  onAudioToggled?: (data: { roomId: string; userId: string; enabled: boolean }) => void;
  onVideoToggled?: (data: { roomId: string; userId: string; enabled: boolean }) => void;
  onScreenToggled?: (data: { roomId: string; userId: string; enabled: boolean }) => void;
  onScreenStarted?: (data: { roomId: string; userId: string; userName?: string }) => void;
  onScreenStopped?: (data: { roomId: string; userId: string; userName?: string }) => void;
  onRoomEnded?: (data: { roomId: string }) => void;
  onError?: (error: { message: string; code?: string }) => void;
};

export class VideoService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private useGateway: boolean;
  private callbacks: CallbackMap = {};

  constructor(useGateway = false) {
    this.useGateway = useGateway;
    this.baseUrl = useGateway ? API_BASE_URL : VIDEO_SERVICE_URL;
  }

  private registerAllListeners(): void {
    if (!this.socket) return;

    const eventMap: Array<[keyof CallbackMap, string]> = [
      ['onRoomCreated', 'video:room:created'],
      ['onRoomJoined', 'video:room:joined'],
      ['onRoomLeft', 'video:room:left'],
      ['onUserJoined', 'video:user:joined'],
      ['onUserLeft', 'video:user:left'],
      ['onSignal', 'video:signal'],
      ['onAudioToggled', 'video:audio:toggled'],
      ['onVideoToggled', 'video:video:toggled'],
      ['onScreenToggled', 'video:screen:toggled'],
      ['onScreenStarted', 'video:screen:started'],
      ['onScreenStopped', 'video:screen:stopped'],
      ['onRoomEnded', 'video:room:ended'],
      ['onError', 'error'],
    ];

    eventMap.forEach(([callbackKey, eventName]) => {
      const callback = this.callbacks[callbackKey];
      if (callback) {
        this.socket!.off(eventName);
        if (callbackKey === 'onUserJoined') {
          this.socket!.on(eventName, (data) => {
            if (this.callbacks.onUserJoined) {
              this.callbacks.onUserJoined(data);
            }
          });
        } else {
          this.socket!.on(eventName, callback as (...args: unknown[]) => void);
        }
      }
    });
  }

  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = await getIdToken();
    if (!token) {
      throw new Error("No authentication token available");
    }

    if (this.socket && !this.socket.connected) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = io(this.baseUrl, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      setTimeout(() => {
        this.registerAllListeners();
      }, 100);
    });

    this.socket.on("disconnect", () => {
      // Handle disconnect if needed
    });

    this.socket.on("error", (error: { message: string; code?: string }) => {
      console.error("Video socket error:", error);
    });

    this.socket.on("auth:error", async () => {
      const newToken = await getIdToken(true);
      if (newToken && this.socket) {
        (this.socket.auth as { token: string }).token = newToken;
        this.socket.disconnect();
        this.socket.connect();
      }
    });

    if (this.socket.connected) {
      this.registerAllListeners();
    }

    return this.socket;
  }

  createRoom(name: string, description?: string, maxParticipants = 10, visibility: "public" | "private" = "private", createChat = true): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:room:create", {
      name,
      description,
      maxParticipants,
      visibility,
      createChat,
    });
  }

  joinRoom(roomIdOrCode: string, isCode = false): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    if (isCode) {
      this.socket.emit("video:room:join", { code: roomIdOrCode });
    } else {
      this.socket.emit("video:room:join", { roomId: roomIdOrCode });
    }
  }

  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("video:room:leave", { roomId });
  }

  sendSignal(data: VideoSignalData): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:signal", data);
  }

  toggleAudio(roomId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:toggle-audio", { roomId, enabled });
  }

  toggleVideo(roomId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:toggle-video", { roomId, enabled });
  }

  toggleScreen(roomId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:toggle-screen", { roomId, enabled });
  }

  startScreenShare(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:screen:start", { roomId });
  }

  stopScreenShare(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:screen:stop", { roomId });
  }

  endRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:room:end", { roomId });
  }

  onRoomCreated(callback: (room: VideoRoom) => void): void {
    this.callbacks.onRoomCreated = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:created", callback);
  }

  onRoomJoined(callback: (data: { roomId: string; room: VideoRoom; participants: VideoParticipant[] }) => void): void {
    this.callbacks.onRoomJoined = callback;
    
    if (!this.socket) {
      return;
    }

    if (!this.socket.connected) {
      return;
    }
    
    this.socket.off("video:room:joined");
    this.socket.on("video:room:joined", callback);
  }

  onRoomLeft(callback: (data: { roomId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:left", callback);
  }

  onUserJoined(callback: (data: { roomId: string; userId: string; userName?: string }) => void): void {
    this.callbacks.onUserJoined = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:user:joined", callback);
  }

  onUserLeft(callback: (data: { roomId: string; userId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:user:left", callback);
  }

  onSignal(callback: (data: { type: string; roomId: string; fromUserId: string; data: unknown; metadata?: { isScreenSharing?: boolean; streamType?: "camera" | "screen" } }) => void): void {
    this.callbacks.onSignal = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:signal", callback);
  }

  onAudioToggled(callback: (data: { roomId: string; userId: string; enabled: boolean }) => void): void {
    this.callbacks.onAudioToggled = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:audio:toggled", callback);
  }

  onVideoToggled(callback: (data: { roomId: string; userId: string; enabled: boolean }) => void): void {
    this.callbacks.onVideoToggled = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:video:toggled", callback);
  }

  onScreenToggled(callback: (data: { roomId: string; userId: string; enabled: boolean }) => void): void {
    this.callbacks.onScreenToggled = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:screen:toggled", callback);
  }

  onScreenStarted(callback: (data: { roomId: string; userId: string; userName?: string }) => void): void {
    this.callbacks.onScreenStarted = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:screen:started", callback);
  }

  onScreenStopped(callback: (data: { roomId: string; userId: string; userName?: string }) => void): void {
    this.callbacks.onScreenStopped = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:screen:stopped", callback);
  }

  onRoomEnded(callback: (data: { roomId: string }) => void): void {
    this.callbacks.onRoomEnded = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:ended", callback);
  }

  onError(callback: (error: { message: string; code?: string }) => void): void {
    this.callbacks.onError = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("error", callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

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
