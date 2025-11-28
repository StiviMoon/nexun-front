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
  hostId: string;
  participants: string[];
  maxParticipants: number;
  isRecording: boolean;
  visibility: "public" | "private";
  code?: string;
  chatRoomId?: string;
  chatRoomCode?: string; // Código del chat asociado (para salas privadas)
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoParticipant {
  userId: string;
  socketId: string;
  userName?: string; // Nombre del usuario (opcional)
  userEmail?: string; // Email del usuario (opcional)
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
}

export class VideoService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private useGateway: boolean;

  constructor(useGateway = false) {
    this.useGateway = useGateway;
    this.baseUrl = useGateway ? API_BASE_URL : VIDEO_SERVICE_URL;
  }

  // Callbacks almacenados para re-registrarlos en reconexiones
  private callbacks: {
    onRoomCreated?: (room: VideoRoom) => void;
    onRoomJoined?: (data: { roomId: string; room: VideoRoom; participants: VideoParticipant[] }) => void;
    onRoomLeft?: (data: { roomId: string }) => void;
    onUserJoined?: (data: { roomId: string; userId: string; userName?: string }) => void;
    onUserLeft?: (data: { roomId: string; userId: string }) => void;
    onSignal?: (data: { type: string; roomId: string; fromUserId: string; data: unknown }) => void;
    onAudioToggled?: (data: { roomId: string; userId: string; enabled: boolean }) => void;
    onVideoToggled?: (data: { roomId: string; userId: string; enabled: boolean }) => void;
    onScreenToggled?: (data: { roomId: string; userId: string; enabled: boolean }) => void;
    onRoomEnded?: (data: { roomId: string }) => void;
    onError?: (error: { message: string; code?: string }) => void;
  } = {};

  private registerAllListeners(): void {
    if (!this.socket) {
      console.warn("⚠️ [VideoService] No socket disponible para registrar listeners");
      return;
    }

    console.log(`🔄 [VideoService] Re-registrando todos los listeners en socket ${this.socket.id}`);

    // Re-registrar todos los callbacks almacenados (usar off primero para evitar duplicados)
    if (this.callbacks.onRoomCreated) {
      this.socket.off("video:room:created");
      this.socket.on("video:room:created", this.callbacks.onRoomCreated);
    }
    if (this.callbacks.onRoomJoined) {
      this.socket.off("video:room:joined");
      this.socket.on("video:room:joined", this.callbacks.onRoomJoined);
      console.log(`✅ [VideoService] Listener video:room:joined registrado en socket ${this.socket.id}`);
    }
    if (this.callbacks.onRoomLeft) {
      this.socket.off("video:room:left");
      this.socket.on("video:room:left", this.callbacks.onRoomLeft);
    }
    if (this.callbacks.onUserJoined) {
      this.socket.off("video:user:joined");
      this.socket.on("video:user:joined", (data) => {
        if (this.callbacks.onUserJoined) this.callbacks.onUserJoined(data);
      });
    }
    if (this.callbacks.onUserLeft) {
      this.socket.off("video:user:left");
      this.socket.on("video:user:left", this.callbacks.onUserLeft);
    }
    if (this.callbacks.onSignal) {
      this.socket.off("video:signal");
      this.socket.on("video:signal", this.callbacks.onSignal);
    }
    if (this.callbacks.onAudioToggled) {
      this.socket.off("video:audio:toggled");
      this.socket.on("video:audio:toggled", this.callbacks.onAudioToggled);
    }
    if (this.callbacks.onVideoToggled) {
      this.socket.off("video:video:toggled");
      this.socket.on("video:video:toggled", this.callbacks.onVideoToggled);
    }
    if (this.callbacks.onScreenToggled) {
      this.socket.off("video:screen:toggled");
      this.socket.on("video:screen:toggled", this.callbacks.onScreenToggled);
    }
    if (this.callbacks.onRoomEnded) {
      this.socket.off("video:room:ended");
      this.socket.on("video:room:ended", this.callbacks.onRoomEnded);
    }
    if (this.callbacks.onError) {
      this.socket.off("error");
      this.socket.on("error", this.callbacks.onError);
    }
    
    console.log(`✅ [VideoService] Todos los listeners registrados en socket ${this.socket.id}`);
  }

  async connect(): Promise<Socket> {
    // Si ya hay un socket conectado, reutilizarlo en lugar de desconectar
    if (this.socket?.connected) {
      console.log(`♻️ [VideoService] Reutilizando socket existente: ${this.socket.id}`);
      return this.socket;
    }

    const token = await getIdToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    // Solo desconectar si hay un socket que NO está conectado
    if (this.socket && !this.socket.connected) {
      console.log(`🧹 [VideoService] Desconectando socket antiguo no conectado`);
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
      console.log(`✅ Connected to video service (socket: ${this.socket?.id})`);
      // Re-registrar todos los listeners cuando se reconecta
      // Esperar un poco para asegurar que el socket esté completamente listo
      setTimeout(() => {
        this.registerAllListeners();
      }, 100);
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`❌ Disconnected from video service (reason: ${reason})`);
    });

    this.socket.on("error", (error: { message: string; code?: string }) => {
      console.error("Video socket error:", error);
    });

    // Listen for token expiration
    this.socket.on("auth:error", async () => {
      const newToken = await getIdToken(true);
      if (newToken && this.socket) {
        (this.socket.auth as { token: string }).token = newToken;
        this.socket.disconnect();
        this.socket.connect();
      }
    });

    // Si el socket ya está conectado, registrar listeners inmediatamente
    // Si no, se registrarán en el evento "connect"
    if (this.socket.connected) {
      this.registerAllListeners();
    }

    return this.socket;
  }

  // Create a video room
  createRoom(name: string, description?: string, maxParticipants = 50, visibility: "public" | "private" = "private", createChat = true): void {
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

      // Join a video room by ID or code
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

  // Leave a video room
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("video:room:leave", { roomId });
  }

  // Send WebRTC signal (compatible with SimplePeer)
  sendSignal(data: VideoSignalData): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:signal", data);
  }

  // Toggle audio
  toggleAudio(roomId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:toggle-audio", { roomId, enabled });
  }

  // Toggle video
  toggleVideo(roomId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:toggle-video", { roomId, enabled });
  }

  // Toggle screen sharing
  toggleScreen(roomId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:toggle-screen", { roomId, enabled });
  }

  // End room (host only)
  endRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:room:end", { roomId });
  }

  // Room events - Listeners
  onRoomCreated(callback: (room: VideoRoom) => void): void {
    // Guardar callback para re-registrarlo en reconexiones
    this.callbacks.onRoomCreated = callback;
    
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:created", callback);
  }

  onRoomJoined(callback: (data: { roomId: string; room: VideoRoom; participants: VideoParticipant[] }) => void): void {
    // Guardar callback para re-registrarlo en reconexiones
    this.callbacks.onRoomJoined = callback;
    
    if (!this.socket) {
      console.warn("⚠️ [VideoService] Socket no inicializado, callback guardado para registro posterior");
      return;
    }

    if (!this.socket.connected) {
      console.warn(`⚠️ [VideoService] Socket no conectado (ID: ${this.socket.id}), callback guardado para registro posterior`);
      return;
    }
    
    // Remover listener anterior si existe para evitar duplicados
    this.socket.off("video:room:joined");
    
    console.log(`📡 [VideoService] Registrando listener video:room:joined en socket ${this.socket.id}`);
    
    const wrappedCallback = (data: { roomId: string; room: VideoRoom; participants: VideoParticipant[] }) => {
      console.log(`🔔 [VideoService] Evento video:room:joined recibido en callback registrado, socket ${this.socket?.id}`);
      console.log(`📦 [VideoService] Datos del evento:`, data);
      try {
        callback(data);
        console.log(`✅ [VideoService] Callback ejecutado exitosamente`);
      } catch (error) {
        console.error(`❌ [VideoService] Error ejecutando callback:`, error);
      }
    };
    
    this.socket.on("video:room:joined", wrappedCallback);
    console.log(`✅ [VideoService] Listener video:room:joined registrado correctamente`);
  }

  onRoomLeft(callback: (data: { roomId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:left", callback);
  }

  onUserJoined(callback: (data: { roomId: string; userId: string; userName?: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:user:joined", (data: { roomId: string; userId: string; userName?: string }) => {
      callback(data);
    });
  }

  onUserLeft(callback: (data: { roomId: string; userId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:user:left", callback);
  }

  // WebRTC signal listener (compatible with SimplePeer)
  onSignal(callback: (data: { type: string; roomId: string; fromUserId: string; data: unknown }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:signal", callback);
  }

  // Audio/Video toggle events
  onAudioToggled(callback: (data: { roomId: string; userId: string; enabled: boolean }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:audio:toggled", callback);
  }

  onVideoToggled(callback: (data: { roomId: string; userId: string; enabled: boolean }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:video:toggled", callback);
  }

  onScreenToggled(callback: (data: { roomId: string; userId: string; enabled: boolean }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:screen:toggled", callback);
  }

  onRoomEnded(callback: (data: { roomId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:ended", callback);
  }

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

