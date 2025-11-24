export interface ChatUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  socketId: string;
  connectedAt: Date;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  senderPicture?: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "file" | "system";
  metadata?: Record<string, unknown>;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: "direct" | "group" | "channel";
  visibility: "public" | "private";
  code?: string; // Código de acceso para salas privadas
  participants: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JoinRoomData {
  roomId: string;
  code?: string; // Código requerido para salas privadas
}

export interface SendMessageData {
  roomId: string;
  content: string;
  type?: "text" | "image" | "file";
  metadata?: Record<string, unknown>;
}

export interface CreateRoomData {
  name: string;
  description?: string;
  type: "direct" | "group" | "channel";
  visibility: "public" | "private";
  participants?: string[];
}

export interface ChatError {
  message: string;
  code?: string;
}

// Socket.IO Event Types
export interface SocketEvents {
  // Client -> Server
  "room:join": (data: JoinRoomData) => void;
  "room:leave": (data: JoinRoomData) => void;
  "message:send": (data: SendMessageData) => void;
  "room:create": (data: CreateRoomData) => void;
  "room:get": (roomId: string) => void;
  "messages:get": (data: { roomId: string; limit?: number; lastMessageId?: string }) => void;

  // Server -> Client
  "room:joined": (data: { roomId: string; room: ChatRoom }) => void;
  "room:left": (data: { roomId: string }) => void;
  "message:new": (message: ChatMessage) => void;
  "room:created": (room: ChatRoom) => void;
  "room:details": (room: ChatRoom) => void;
  "rooms:list": (rooms: ChatRoom[]) => void;
  "messages:list": (data: { roomId: string; messages: ChatMessage[] }) => void;
  "user:online": (data: { userId: string }) => void;
  "user:offline": (data: { userId: string }) => void;
  "room:user-joined": (data: { roomId: string; userId: string; userName?: string }) => void;
  "room:user-left": (data: { roomId: string; userId: string; userName?: string }) => void;
  "error": (error: ChatError) => void;
}

