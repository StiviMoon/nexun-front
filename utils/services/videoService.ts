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
 * Obtiene el token de ID de Firebase para autenticación con Socket.IO.
 * 
 * @param {boolean} [forceRefresh=false] - Si es true, fuerza la renovación del token
 * @returns {Promise<string | null>} Token de ID o null si no hay usuario autenticado
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

/**
 * Servicio para gestionar la comunicación de video en tiempo real mediante Socket.IO.
 * 
 * Esta clase maneja la conexión al servidor de video, el registro de eventos,
 * y proporciona métodos para interactuar con salas de video, señales WebRTC,
 * y control de medios (audio, video, pantalla compartida).
 * 
 * @class VideoService
 * 
 * @example
 * ```typescript
 * const videoService = new VideoService(false);
 * await videoService.connect();
 * videoService.onUserJoined((data) => {
 *   console.log('Usuario unido:', data);
 * });
 * videoService.joinRoom('room-id');
 * ```
 */
export class VideoService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private useGateway: boolean;
  private callbacks: CallbackMap = {};

  /**
   * Crea una instancia del servicio de video.
   * 
   * @param {boolean} [useGateway=false] - Si es true, usa el gateway API en lugar del servicio directo
   */
  constructor(useGateway = false) {
    this.useGateway = useGateway;
    this.baseUrl = useGateway ? API_BASE_URL : VIDEO_SERVICE_URL;
  }

  /**
   * Registra todos los listeners de eventos en el socket.
   * Se llama automáticamente después de la conexión y en reconexiones.
   * 
   * @private
   */
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

  /**
   * Conecta al servidor de Socket.IO.
   * Obtiene el token de autenticación de Firebase y establece la conexión.
   * 
   * @returns {Promise<Socket>} Instancia del socket conectado
   * @throws {Error} Si no hay token de autenticación disponible
   */
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

  /**
   * Crea una nueva sala de video.
   * 
   * @param {string} name - Nombre de la sala
   * @param {string} [description] - Descripción opcional de la sala
   * @param {number} [maxParticipants=10] - Número máximo de participantes
   * @param {"public" | "private"} [visibility="private"] - Visibilidad de la sala
   * @param {boolean} [createChat=true] - Si es true, crea una sala de chat asociada
   * @throws {Error} Si no hay conexión al servicio
   */
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

  /**
   * Se une a una sala de video.
   * 
   * @param {string} roomIdOrCode - ID o código de la sala
   * @param {boolean} [isCode=false] - Si es true, roomIdOrCode se trata como código
   * @throws {Error} Si no hay conexión al servicio
   */
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

  /**
   * Abandona una sala de video.
   * 
   * @param {string} roomId - ID de la sala a abandonar
   */
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("video:room:leave", { roomId });
  }

  /**
   * Envía una señal WebRTC (offer, answer, o ice-candidate).
   * 
   * @param {VideoSignalData} data - Datos de la señal WebRTC
   * @throws {Error} Si no hay conexión al servicio
   */
  sendSignal(data: VideoSignalData): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:signal", data);
  }

  /**
   * Activa o desactiva el audio en una sala.
   * 
   * @param {string} roomId - ID de la sala
   * @param {boolean} enabled - True para activar, false para desactivar
   * @throws {Error} Si no hay conexión al servicio
   */
  toggleAudio(roomId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:toggle-audio", { roomId, enabled });
  }

  /**
   * Activa o desactiva el video en una sala.
   * 
   * @param {string} roomId - ID de la sala
   * @param {boolean} enabled - True para activar, false para desactivar
   * @throws {Error} Si no hay conexión al servicio
   */
  toggleVideo(roomId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:toggle-video", { roomId, enabled });
  }

  /**
   * Activa o desactiva la pantalla compartida en una sala.
   * 
   * @param {string} roomId - ID de la sala
   * @param {boolean} enabled - True para activar, false para desactivar
   * @throws {Error} Si no hay conexión al servicio
   */
  toggleScreen(roomId: string, enabled: boolean): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:toggle-screen", { roomId, enabled });
  }

  /**
   * Inicia la pantalla compartida en una sala.
   * 
   * @param {string} roomId - ID de la sala
   * @throws {Error} Si no hay conexión al servicio
   */
  startScreenShare(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:screen:start", { roomId });
  }

  /**
   * Detiene la pantalla compartida en una sala.
   * 
   * @param {string} roomId - ID de la sala
   * @throws {Error} Si no hay conexión al servicio
   */
  stopScreenShare(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:screen:stop", { roomId });
  }

  /**
   * Finaliza una sala de video (solo el host puede hacerlo).
   * 
   * @param {string} roomId - ID de la sala a finalizar
   * @throws {Error} Si no hay conexión al servicio
   */
  endRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to video service");
    }
    this.socket.emit("video:room:end", { roomId });
  }

  /**
   * Registra un callback para cuando se crea una nueva sala de video.
   * 
   * @param {(room: VideoRoom) => void} callback - Función a llamar cuando se crea una sala
   * @throws {Error} Si el socket no está inicializado
   */
  onRoomCreated(callback: (room: VideoRoom) => void): void {
    this.callbacks.onRoomCreated = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:created", callback);
  }

  /**
   * Registra un callback para cuando se une a una sala de video.
   * 
   * @param {(data: { roomId: string; room: VideoRoom; participants: VideoParticipant[] }) => void} callback - Función a llamar cuando se une a una sala
   */
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

  /**
   * Registra un callback para cuando se abandona una sala de video.
   * 
   * @param {(data: { roomId: string }) => void} callback - Función a llamar cuando se abandona una sala
   * @throws {Error} Si el socket no está inicializado
   */
  onRoomLeft(callback: (data: { roomId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:left", callback);
  }

  /**
   * Registra un callback para cuando un usuario se une a la sala.
   * 
   * @param {(data: { roomId: string; userId: string; userName?: string }) => void} callback - Función a llamar cuando un usuario se une
   * @throws {Error} Si el socket no está inicializado
   */
  onUserJoined(callback: (data: { roomId: string; userId: string; userName?: string }) => void): void {
    this.callbacks.onUserJoined = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:user:joined", callback);
  }

  /**
   * Registra un callback para cuando un usuario abandona la sala.
   * 
   * @param {(data: { roomId: string; userId: string }) => void} callback - Función a llamar cuando un usuario abandona
   * @throws {Error} Si el socket no está inicializado
   */
  onUserLeft(callback: (data: { roomId: string; userId: string }) => void): void {
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:user:left", callback);
  }

  /**
   * Registra un callback para cuando se recibe una señal WebRTC.
   * 
   * @param {(data: { type: string; roomId: string; fromUserId: string; data: unknown; metadata?: { isScreenSharing?: boolean; streamType?: "camera" | "screen" } }) => void} callback - Función a llamar cuando se recibe una señal
   * @throws {Error} Si el socket no está inicializado
   */
  onSignal(callback: (data: { type: string; roomId: string; fromUserId: string; data: unknown; metadata?: { isScreenSharing?: boolean; streamType?: "camera" | "screen" } }) => void): void {
    this.callbacks.onSignal = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:signal", callback);
  }

  /**
   * Registra un callback para cuando se activa/desactiva el audio de un usuario.
   * 
   * @param {(data: { roomId: string; userId: string; enabled: boolean }) => void} callback - Función a llamar cuando cambia el estado del audio
   * @throws {Error} Si el socket no está inicializado
   */
  onAudioToggled(callback: (data: { roomId: string; userId: string; enabled: boolean }) => void): void {
    this.callbacks.onAudioToggled = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:audio:toggled", callback);
  }

  /**
   * Registra un callback para cuando se activa/desactiva el video de un usuario.
   * 
   * @param {(data: { roomId: string; userId: string; enabled: boolean }) => void} callback - Función a llamar cuando cambia el estado del video
   * @throws {Error} Si el socket no está inicializado
   */
  onVideoToggled(callback: (data: { roomId: string; userId: string; enabled: boolean }) => void): void {
    this.callbacks.onVideoToggled = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:video:toggled", callback);
  }

  /**
   * Registra un callback para cuando se activa/desactiva la pantalla compartida de un usuario.
   * 
   * @param {(data: { roomId: string; userId: string; enabled: boolean }) => void} callback - Función a llamar cuando cambia el estado de la pantalla compartida
   * @throws {Error} Si el socket no está inicializado
   */
  onScreenToggled(callback: (data: { roomId: string; userId: string; enabled: boolean }) => void): void {
    this.callbacks.onScreenToggled = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:screen:toggled", callback);
  }

  /**
   * Registra un callback para cuando un usuario inicia la pantalla compartida.
   * 
   * @param {(data: { roomId: string; userId: string; userName?: string }) => void} callback - Función a llamar cuando se inicia la pantalla compartida
   * @throws {Error} Si el socket no está inicializado
   */
  onScreenStarted(callback: (data: { roomId: string; userId: string; userName?: string }) => void): void {
    this.callbacks.onScreenStarted = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:screen:started", callback);
  }

  /**
   * Registra un callback para cuando un usuario detiene la pantalla compartida.
   * 
   * @param {(data: { roomId: string; userId: string; userName?: string }) => void} callback - Función a llamar cuando se detiene la pantalla compartida
   * @throws {Error} Si el socket no está inicializado
   */
  onScreenStopped(callback: (data: { roomId: string; userId: string; userName?: string }) => void): void {
    this.callbacks.onScreenStopped = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:screen:stopped", callback);
  }

  /**
   * Registra un callback para cuando se finaliza una sala de video.
   * 
   * @param {(data: { roomId: string }) => void} callback - Función a llamar cuando se finaliza una sala
   * @throws {Error} Si el socket no está inicializado
   */
  onRoomEnded(callback: (data: { roomId: string }) => void): void {
    this.callbacks.onRoomEnded = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("video:room:ended", callback);
  }

  /**
   * Registra un callback para cuando ocurre un error.
   * 
   * @param {(error: { message: string; code?: string }) => void} callback - Función a llamar cuando ocurre un error
   * @throws {Error} Si el socket no está inicializado
   */
  onError(callback: (error: { message: string; code?: string }) => void): void {
    this.callbacks.onError = callback;
    if (!this.socket) {
      throw new Error("Socket not initialized");
    }
    this.socket.on("error", callback);
  }

  /**
   * Elimina listeners de eventos del socket.
   * 
   * @param {string} event - Nombre del evento
   * @param {(...args: unknown[]) => void} [callback] - Callback específico a eliminar (opcional)
   */
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Obtiene la instancia del socket.
   * 
   * @returns {Socket | null} Instancia del socket o null si no está conectado
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Verifica si hay una conexión activa al servidor.
   * 
   * @returns {boolean} True si está conectado, false en caso contrario
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Desconecta del servidor de video y limpia la instancia del socket.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
