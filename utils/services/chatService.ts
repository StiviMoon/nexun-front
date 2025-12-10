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

/**
 * Servicio para gestionar la comunicación de chat en tiempo real mediante Socket.IO.
 * 
 * Esta clase maneja la conexión al servidor de chat, el registro de eventos,
 * y proporciona métodos para interactuar con salas y mensajes.
 * 
 * @class ChatService
 * 
 * @example
 * ```typescript
 * const chatService = new ChatService(false);
 * await chatService.connect();
 * chatService.onMessage((message) => {
 *   console.log('Nuevo mensaje:', message);
 * });
 * chatService.joinRoom('room-id', 'optional-code');
 * ```
 */
export class ChatService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private useGateway: boolean;

  /**
   * Callbacks almacenados para re-registrarlos en reconexiones.
   * @private
   */
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

  /**
   * Crea una instancia del servicio de chat.
   * 
   * @param {boolean} [useGateway=false] - Si es true, usa el gateway API en lugar del servicio directo
   */
  constructor(useGateway = false) {
    this.useGateway = useGateway;
    this.baseUrl = useGateway ? API_BASE_URL : CHAT_SERVICE_URL;
  }

  /**
   * Registra todos los listeners de eventos en el socket.
   * Se llama automáticamente después de la conexión y en reconexiones.
   * 
   * @private
   */
  private registerAllListeners(): void {
    if (!this.socket) return;

    const eventMap: Array<[keyof typeof this.callbacks, string]> = [
      ['onMessage', 'message:new'],
      ['onRoomsList', 'rooms:list'],
      ['onRoomJoined', 'room:joined'],
      ['onRoomLeft', 'room:left'],
      ['onRoomCreated', 'room:created'],
      ['onRoomDetails', 'room:details'],
      ['onMessagesList', 'messages:list'],
      ['onUserOnline', 'user:online'],
      ['onUserOffline', 'user:offline'],
      ['onError', 'error'],
    ];

    eventMap.forEach(([callbackKey, eventName]) => {
      const callback = this.callbacks[callbackKey];
      if (callback) {
        this.socket!.off(eventName);
        this.socket!.on(eventName, callback as (...args: unknown[]) => void);
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
      setTimeout(() => {
        this.registerAllListeners();
      }, 100);
    });

    this.socket.on("disconnect", () => {
      // Handle disconnect if needed
    });

    this.socket.on("error", (error: unknown) => {
      if (!error) return;
      
      if (typeof error === "string" && error.trim().length > 0) {
        console.error("Socket error:", error);
        return;
      }
      
      if (typeof error === "object" && error !== null) {
        const errorObj = error as Record<string, unknown>;
        const keys = Object.keys(errorObj);
        
        if (keys.length === 0) return;
        
        const hasMeaningfulData = keys.some(key => {
          const value = errorObj[key];
          if (value === null || value === undefined || value === "") return false;
          if (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0) return false;
          return true;
        });
        
        if (hasMeaningfulData) {
          console.error("Socket error:", error);
        }
      }
    });

    this.socket.on("connect_error", (err) => {
      if (err.message?.includes("auth") || err.message?.includes("unauthorized")) {
        console.error("Authentication error:", err.message);
      } else if (err.message) {
        console.error("Connection error:", err.message);
      }
    });

    this.socket.on("auth:error", async () => {
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

  /**
   * Se une a una sala de chat.
   * 
   * @param {string} roomId - ID de la sala a la que unirse
   * @param {string} [code] - Código de acceso opcional para salas privadas
   * @throws {Error} Si no hay conexión al servicio
   */
  joinRoom(roomId: string, code?: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("room:join", { roomId, code });
  }

  /**
   * Se une a una sala de chat usando solo el código.
   * Busca automáticamente la sala que corresponde al código.
   * 
   * @param {string} code - Código de la sala
   * @throws {Error} Si no hay conexión al servicio
   */
  joinRoomByCode(code: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("room:join-by-code", { code });
  }

  /**
   * Abandona una sala de chat.
   * 
   * @param {string} roomId - ID de la sala a abandonar
   */
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("room:leave", { roomId });
  }

  /**
   * Envía un mensaje a una sala de chat.
   * 
   * @param {string} roomId - ID de la sala donde enviar el mensaje
   * @param {string} content - Contenido del mensaje
   * @param {"text" | "image" | "file"} [type="text"] - Tipo de mensaje
   * @throws {Error} Si no hay conexión al servicio
   */
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

  /**
   * Crea una nueva sala de chat.
   * El backend espera: name, type ("direct" | "group" | "channel"), 
   * visibility ("public" | "private"), y opcionalmente description y participants.
   * 
   * @param {string} name - Nombre de la sala
   * @param {"direct" | "group" | "channel"} type - Tipo de sala
   * @param {"public" | "private"} visibility - Visibilidad de la sala
   * @param {string} [description] - Descripción opcional de la sala
   * @param {string[]} [participants=[]] - Lista de IDs de participantes iniciales
   * @throws {Error} Si no hay conexión al servicio
   */
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

  /**
   * Obtiene la información de una sala de chat.
   * 
   * @param {string} roomId - ID de la sala
   * @throws {Error} Si no hay conexión al servicio
   */
  getRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("room:get", roomId);
  }

  /**
   * Obtiene los mensajes de una sala de chat.
   * 
   * @param {string} roomId - ID de la sala
   * @param {number} [limit=50] - Número máximo de mensajes a obtener
   * @param {string | null} [startAfter=null] - ID del mensaje para paginación
   * @throws {Error} Si no hay conexión al servicio
   */
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

  /**
   * Solicita la lista de salas de chat disponibles.
   * 
   * @throws {Error} Si no hay conexión al servicio
   */
  listRooms(): void {
    if (!this.socket?.connected) {
      throw new Error("Not connected to chat service");
    }
    this.socket.emit("rooms:list");
  }

  /**
   * Registra un callback para recibir nuevos mensajes.
   * 
   * @param {(message: ChatMessage) => void} callback - Función a llamar cuando llega un mensaje
   */
  onMessage(callback: (message: ChatMessage) => void): void {
    this.callbacks.onMessage = callback;
    if (!this.socket) return;
    this.socket.off("message:new");
    this.socket.on("message:new", callback);
  }

  /**
   * Registra un callback para recibir la lista de salas.
   * 
   * @param {(rooms: ChatRoom[]) => void} callback - Función a llamar cuando se recibe la lista
   */
  onRoomsList(callback: (rooms: ChatRoom[]) => void): void {
    this.callbacks.onRoomsList = callback;
    if (!this.socket) return;
    this.socket.off("rooms:list");
    this.socket.on("rooms:list", callback);
  }

  /**
   * Registra un callback para cuando se abandona una sala.
   * 
   * @param {(data: { roomId: string }) => void} callback - Función a llamar cuando se abandona una sala
   */
  onRoomLeft(callback: (data: { roomId: string }) => void): void {
    this.callbacks.onRoomLeft = callback;
    if (!this.socket) return;
    this.socket.off("room:left");
    this.socket.on("room:left", callback);
  }

  /**
   * Registra un callback para cuando se une a una sala.
   * 
   * @param {(data: { roomId: string; room: ChatRoom }) => void} callback - Función a llamar cuando se une a una sala
   */
  onRoomJoined(callback: (data: { roomId: string; room: ChatRoom }) => void): void {
    this.callbacks.onRoomJoined = callback;
    if (!this.socket) return;
    this.socket.off("room:joined");
    this.socket.on("room:joined", callback);
  }

  /**
   * Registra un callback para cuando un usuario se conecta.
   * 
   * @param {(data: { userId: string }) => void} callback - Función a llamar cuando un usuario se conecta
   */
  onUserOnline(callback: (data: { userId: string }) => void): void {
    this.callbacks.onUserOnline = callback;
    if (!this.socket) return;
    this.socket.off("user:online");
    this.socket.on("user:online", callback);
  }

  /**
   * Registra un callback para cuando un usuario se desconecta.
   * 
   * @param {(data: { userId: string }) => void} callback - Función a llamar cuando un usuario se desconecta
   */
  onUserOffline(callback: (data: { userId: string }) => void): void {
    this.callbacks.onUserOffline = callback;
    if (!this.socket) return;
    this.socket.off("user:offline");
    this.socket.on("user:offline", callback);
  }

  /**
   * Registra un callback para cuando se crea una nueva sala.
   * 
   * @param {(room: ChatRoom) => void} callback - Función a llamar cuando se crea una sala
   */
  onRoomCreated(callback: (room: ChatRoom) => void): void {
    this.callbacks.onRoomCreated = callback;
    if (!this.socket) return;
    this.socket.off("room:created");
    this.socket.on("room:created", callback);
  }

  /**
   * Registra un callback para cuando se reciben los detalles de una sala.
   * 
   * @param {(room: ChatRoom) => void} callback - Función a llamar cuando se reciben los detalles
   */
  onRoomDetails(callback: (room: ChatRoom) => void): void {
    this.callbacks.onRoomDetails = callback;
    if (!this.socket) return;
    this.socket.off("room:details");
    this.socket.on("room:details", callback);
  }

  /**
   * Registra un callback para cuando se recibe una lista de mensajes.
   * 
   * @param {(data: { roomId: string; messages: ChatMessage[] }) => void} callback - Función a llamar cuando se recibe la lista
   */
  onMessagesList(callback: (data: { roomId: string; messages: ChatMessage[] }) => void): void {
    this.callbacks.onMessagesList = callback;
    if (!this.socket) return;
    this.socket.off("messages:list");
    this.socket.on("messages:list", callback);
  }

  /**
   * Registra un callback para cuando ocurre un error.
   * 
   * @param {(error: { message: string; code?: string }) => void} callback - Función a llamar cuando ocurre un error
   */
  onError(callback: (error: { message: string; code?: string }) => void): void {
    this.callbacks.onError = callback;
    if (!this.socket) return;
    this.socket.off("error");
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
   * Desconecta del servidor de chat y limpia la instancia del socket.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

