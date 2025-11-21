# 🎥 Integración Futura: Reuniones de Video/Voz con Chat en Vivo

## 📋 Visión General

Similar a Google Meet, Zoom o Microsoft Teams, cada reunión de video/llamada tendrá un chat en vivo asociado donde los participantes pueden comunicarse por texto mientras están en la videollamada.

---

## 🏗️ Arquitectura Propuesta

### 1. **Modelo de Datos - Meeting/Videollamada**

```typescript
interface Meeting {
  id: string;
  title: string;
  description?: string;
  type: "video" | "audio" | "video-audio";
  chatRoomId: string;              // ✨ Sala de chat asociada automáticamente
  hostId: string;                  // Usuario que creó la reunión
  participants: string[];          // IDs de usuarios participantes
  status: "scheduled" | "active" | "ended" | "cancelled";
  scheduledAt?: Date;              // Para reuniones programadas
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Configuración de la reunión
  settings: {
    allowScreenShare: boolean;
    allowRecording: boolean;
    muteOnJoin: boolean;
    waitingRoom: boolean;
    maxParticipants?: number;
  };
  
  // Información de la videollamada
  videoRoom?: {
    provider: "janus" | "jitsi" | "daily" | "agora"; // Gateway de video
    roomUrl?: string;
    roomToken?: string;
  };
}
```

### 3. **Flujo de Integración: Video Service ↔ Chat Service**

Cuando se crea una video room, el **Video Service** debe comunicarse con el **Chat Service** para crear automáticamente una sala de chat asociada.

---

## 🔄 Flujo de Creación de Video Room con Chat

### 1. **Actualizar Evento Socket.IO: `video:room:create`**

#### Request actual:
```typescript
{
  name: string;
  description?: string;
  maxParticipants?: number;
}
```

#### Request nuevo (con creación automática de chat):
```typescript
{
  name: string;
  description?: string;
  maxParticipants?: number;
  createChat: boolean;  // ✨ NUEVO - Si se debe crear chat automáticamente (default: true)
}
```

#### Implementación en Video Service:

```typescript
// Video Service: socket handlers
socket.on("video:room:create", async (data) => {
  const { name, description, maxParticipants, createChat = true } = data;
  const userId = socket.userId; // Del middleware de autenticación

  try {
    // 1. Generar código de acceso único (6-8 caracteres)
    const accessCode = generateRoomCode();

    // 2. Crear Video Room en base de datos
    const videoRoom = await db.videoRooms.create({
      name,
      description,
      hostId: userId,
      maxParticipants: maxParticipants || 50,
      accessCode,  // ✨ NUEVO
      participants: [userId], // El host se une automáticamente
      isRecording: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    let chatRoomId: string | undefined;

    // 3. Si createChat es true, crear sala de chat asociada
    if (createChat) {
      try {
        // Llamar al Chat Service vía HTTP o mensaje interno
        const chatRoom = await createChatRoomForVideo({
          name: `${name} - Chat`,
          description: description ? `Chat: ${description}` : `Chat de la reunión ${name}`,
          type: "channel",
          visibility: "private",
          code: accessCode,  // Mismo código de acceso
          videoRoomId: videoRoom.id,
          isMeetingChat: true,
          createdBy: userId,
          participants: [userId] // El host automáticamente participa
        });

        chatRoomId = chatRoom.id;

        // Actualizar Video Room con chatRoomId
        await db.videoRooms.update(videoRoom.id, {
          chatRoomId: chatRoom.id
        });
      } catch (chatError) {
        console.error("Error al crear chat asociado:", chatError);
        // Continuar sin chat si falla
      }
    }

    // 4. Emitir respuesta con chatRoomId incluido
    socket.emit("video:room:created", {
      ...videoRoom,
      chatRoomId,  // ✨ NUEVO
      accessCode   // ✨ NUEVO
    });

  } catch (error) {
    socket.emit("error", {
      message: "Error al crear la sala de video",
      code: "VIDEO_ROOM_CREATE_ERROR"
    });
  }
});
```

### 2. **Función para crear Chat desde Video Service**

```typescript
// Video Service: utils/chatServiceClient.ts
import axios from 'axios';

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3002';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

async function createChatRoomForVideo(data: {
  name: string;
  description?: string;
  type: "channel";
  visibility: "private";
  code: string;
  videoRoomId: string;
  isMeetingChat: boolean;
  createdBy: string;
  participants: string[];
}): Promise<ChatRoom> {
  try {
    // Opción 1: Llamar directamente al Chat Service
    const response = await axios.post(`${CHAT_SERVICE_URL}/api/rooms`, {
      ...data,
      visibility: data.visibility,
      code: data.code
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;

    // Opción 2: Si usas API Gateway
    // const response = await axios.post(`${API_GATEWAY_URL}/api/chat/rooms`, data);
    // return response.data;
  } catch (error) {
    console.error("Error al comunicarse con Chat Service:", error);
    throw new Error("No se pudo crear la sala de chat");
  }
}
```

### 3. **Actualizar Evento: `video:room:join`**

Cuando alguien se une a una video room, también debe unirse automáticamente al chat asociado:

```typescript
socket.on("video:room:join", async (data) => {
  const { roomId, code } = data; // ✨ NUEVO: code opcional
  const userId = socket.userId;

  try {
    // 1. Obtener Video Room
    const videoRoom = await db.videoRooms.findOne({ id: roomId });
    
    if (!videoRoom) {
      return socket.emit("error", {
        message: "Sala de video no encontrada",
        code: "VIDEO_ROOM_NOT_FOUND"
      });
    }

    // 2. Si hay código, validarlo
    if (videoRoom.accessCode && code !== videoRoom.accessCode) {
      return socket.emit("error", {
        message: "Código de acceso incorrecto",
        code: "INVALID_ACCESS_CODE"
      });
    }

    // 3. Agregar participante a Video Room
    if (!videoRoom.participants.includes(userId)) {
      videoRoom.participants.push(userId);
      await db.videoRooms.update(roomId, {
        participants: videoRoom.participants,
        updatedAt: new Date()
      });
    }

    // 4. Si hay chat asociado, unirse también al chat
    if (videoRoom.chatRoomId) {
      try {
        await joinChatRoomForVideo({
          chatRoomId: videoRoom.chatRoomId,
          userId,
          code: videoRoom.accessCode // Mismo código
        });
      } catch (chatError) {
        console.error("Error al unirse al chat:", chatError);
        // Continuar aunque falle el chat
      }
    }

    // 5. Unirse a la sala de Socket.IO
    socket.join(roomId);

    // 6. Obtener lista de participantes activos
    const activeParticipants = await getActiveParticipants(roomId);

    // 7. Emitir confirmación
    socket.emit("video:room:joined", {
      roomId,
      room: videoRoom,
      participants: activeParticipants,
      chatRoomId: videoRoom.chatRoomId  // ✨ NUEVO
    });

    // 8. Notificar a otros participantes
    socket.to(roomId).emit("video:participant-joined", {
      roomId,
      userId,
      participant: activeParticipants.find(p => p.userId === userId)
    });

  } catch (error) {
    socket.emit("error", {
      message: "Error al unirse a la sala",
      code: "VIDEO_ROOM_JOIN_ERROR"
    });
  }
});

// Función auxiliar para unirse al chat
async function joinChatRoomForVideo(data: {
  chatRoomId: string;
  userId: string;
  code?: string;
}): Promise<void> {
  try {
    await axios.post(`${CHAT_SERVICE_URL}/api/rooms/${data.chatRoomId}/join`, {
      userId: data.userId,
      code: data.code
    });
  } catch (error) {
    throw new Error("Error al unirse al chat");
  }
}
```

---

## 🎬 Página de Reunión Activa (`/meeting/[id]`)

### Layout propuesto:

```
┌─────────────────────────────────────────────────────┐
│  Header: Título de la reunión, controles, botones  │
├──────────────────────────┬──────────────────────────┤
│                         │                          │
│   ÁREA DE VIDEO         │    CHAT EN VIVO          │
│   (WebRTC/Jitsi/etc)    │    (ChatSidebar)         │
│                         │                          │
│   - Grid de videos      │    - Lista de mensajes   │
│   - Controles (mute,    │    - Input para escribir │
│     video, salir)       │    - Participantes       │
│                         │                          │
│                         │                          │
└──────────────────────────┴──────────────────────────┘
```

### Componente MeetingPage:

```typescript
// app/meeting/[id]/page.tsx
export default function MeetingPage({ params }: { params: { id: string } }) {
  const { currentUser } = useAuthWithQuery();
  const { meeting, chatRoom } = useMeeting(params.id);
  const {
    rooms,
    messages,
    currentRoom,
    sendMessage,
    joinRoom
  } = useChat();

  // Unirse al chat cuando se carga la reunión
  useEffect(() => {
    if (meeting?.chatRoomId && isConnected) {
      joinRoom(meeting.chatRoomId);
    }
  }, [meeting?.chatRoomId, isConnected]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <MeetingHeader meeting={meeting} />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Área de Video */}
          <VideoRoom
            meetingId={params.id}
            userId={currentUser?.uid}
            onLeave={handleLeaveMeeting}
          />

          {/* Chat en Vivo */}
          <MeetingChatSidebar
            chatRoomId={meeting?.chatRoomId}
            rooms={rooms}
            messages={messages[meeting?.chatRoomId || ""] || []}
            onSendMessage={sendMessage}
          />
        </div>
      </div>
    </AppLayout>
  );
}
```

---

## 🎥 Componentes Necesarios

### 1. **VideoRoom Component**

```typescript
// components/meeting/VideoRoom.tsx
interface VideoRoomProps {
  meetingId: string;
  userId: string;
  onLeave: () => void;
}

export const VideoRoom = ({ meetingId, userId, onLeave }: VideoRoomProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Inicializar WebRTC/Jitsi
    initializeVideoRoom(meetingId, userId, {
      onParticipantJoined: (participant) => {
        setParticipants(prev => [...prev, participant]);
      },
      onParticipantLeft: (participantId) => {
        setParticipants(prev => prev.filter(p => p.id !== participantId));
      }
    });
  }, [meetingId, userId]);

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Grid de videos */}
      <div className="flex-1 grid grid-cols-2 gap-2 p-4">
        {participants.map((participant) => (
          <VideoParticipant
            key={participant.id}
            participant={participant}
            isLocal={participant.id === userId}
          />
        ))}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-4 p-4 bg-zinc-900/50">
        <button onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button onClick={() => setIsVideoOn(!isVideoOn)}>
          {isVideoOn ? <Video /> : <VideoOff />}
        </button>
        <button onClick={handleShareScreen}>
          <Share2 />
        </button>
        <button onClick={onLeave} className="bg-red-500">
          <PhoneOff />
          Salir
        </button>
      </div>
    </div>
  );
};
```

### 2. **MeetingChatSidebar Component**

```typescript
// components/meeting/MeetingChatSidebar.tsx
interface MeetingChatSidebarProps {
  chatRoomId: string;
  rooms: ChatRoom[];
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

export const MeetingChatSidebar = ({
  chatRoomId,
  rooms,
  messages,
  onSendMessage
}: MeetingChatSidebarProps) => {
  const chatRoom = rooms.find(r => r.id === chatRoomId);
  const [message, setMessage] = useState("");

  return (
    <div className="w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col">
      {/* Header del Chat */}
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-white">
          {chatRoom?.name || "Chat de la reunión"}
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          {messages.length} mensajes
        </p>
      </div>

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input para enviar mensaje */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && message.trim()) {
                onSendMessage(message);
                setMessage("");
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1"
          />
          <button
            onClick={() => {
              if (message.trim()) {
                onSendMessage(message);
                setMessage("");
              }
            }}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔌 Integración con Video Service Existente

Ya tienes un **Video Service** funcional con Socket.IO y WebRTC. Los cambios necesarios son:

### 1. **Actualizar VideoRoom Schema**

```sql
-- Agregar columnas a video_rooms
ALTER TABLE video_rooms 
ADD COLUMN chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE SET NULL,
ADD COLUMN access_code VARCHAR(8) UNIQUE;

CREATE INDEX idx_video_rooms_access_code ON video_rooms(access_code);
CREATE INDEX idx_video_rooms_chat_room ON video_rooms(chat_room_id);
```

### 2. **Comunicación entre Servicios**

#### Opción A: HTTP REST (Recomendado)
```typescript
// Video Service → Chat Service vía HTTP
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3002';

// Crear chat room
const response = await axios.post(`${CHAT_SERVICE_URL}/api/rooms`, chatRoomData);

// Unirse a chat room
await axios.post(`${CHAT_SERVICE_URL}/api/rooms/${chatRoomId}/join`, { userId, code });
```

#### Opción B: Mensajes internos Socket.IO
```typescript
// Si ambos servicios están en el mismo servidor Socket.IO
io.to('chat-service').emit('internal:create-chat-room', chatRoomData);
```

#### Opción C: Cola de mensajes (RabbitMQ, Redis, etc.)
```typescript
// Para mayor escalabilidad
await messageQueue.publish('chat-room:create', chatRoomData);
```

---

## 🔄 Eventos Socket.IO Actualizados

### Eventos Video Service (actualizar existentes):

#### `video:room:create` - ACTUALIZAR
```typescript
// Request actual
{
  name: string;
  description?: string;
  maxParticipants?: number;
}

// Request nuevo
{
  name: string;
  description?: string;
  maxParticipants?: number;
  createChat?: boolean;  // ✨ NUEVO - default: true
}

// Response actualizado
{
  id: string;
  name: string;
  // ... otros campos
  chatRoomId?: string;    // ✨ NUEVO
  accessCode?: string;    // ✨ NUEVO
}
```

#### `video:room:join` - ACTUALIZAR
```typescript
// Request actual
{
  roomId: string;
}

// Request nuevo
{
  roomId: string;
  code?: string;  // ✨ NUEVO - Código de acceso
}

// Response actualizado
{
  roomId: string;
  room: VideoRoom;
  participants: VideoParticipant[];
  chatRoomId?: string;  // ✨ NUEVO
}
```

### Nuevos Eventos (opcionales):

```typescript
// Cliente → Servidor
"video:room:join-by-code"  // Unirse con código (busca sala)
"video:room:get-chat"      // Obtener info del chat asociado

// Servidor → Cliente
"video:room:chat-created"  // Notificar cuando se crea el chat
"video:room:participant-joined-chat"  // Notificar unión al chat
```

---

## 📱 Flujo Completo de Usuario

### 1. **Crear Video Room desde Frontend**

```typescript
// Frontend: app/crearReunion/page.tsx o desde dashboard
const handleCreateVideoRoom = async (data) => {
  // Conectar a Video Service vía Socket.IO
  socket.emit("video:room:create", {
    name: data.title,
    description: data.description,
    maxParticipants: data.maxParticipants || 50,
    createChat: true  // ✨ Crear chat automáticamente
  });
};

// Escuchar respuesta
socket.on("video:room:created", (videoRoom) => {
  // videoRoom incluye:
  // - id: video room ID
  // - chatRoomId: chat room ID creado automáticamente
  // - accessCode: código compartido
  
  // Redirigir a la reunión
  router.push(`/meeting/${videoRoom.id}`);
});
```

### 2. **Unirse a Video Room con Código**

```typescript
// Frontend: Input de código
const handleJoinWithCode = async (code: string) => {
  // Buscar video room por código
  socket.emit("video:room:join-by-code", { code });
  
  // O si ya tienes el roomId:
  socket.emit("video:room:join", {
    roomId: videoRoomId,
    code: code  // ✨ NUEVO
  });
};

// Escuchar confirmación
socket.on("video:room:joined", (data) => {
  // data incluye:
  // - roomId
  // - room (VideoRoom completo)
  // - participants
  // - chatRoomId ✨
  
  // Ahora también unirse al chat automáticamente
  if (data.chatRoomId) {
    chatSocket.emit("room:join", {
      roomId: data.chatRoomId,
      code: data.room.accessCode  // Mismo código
    });
  }
  
  // Redirigir a /meeting/{roomId}
  router.push(`/meeting/${data.roomId}`);
});
```

### 3. **Durante la Reunión (Página /meeting/[id])**

```typescript
// app/meeting/[id]/page.tsx
export default function MeetingPage({ params }: { params: { id: string } }) {
  const [videoRoom, setVideoRoom] = useState<VideoRoom | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  
  useEffect(() => {
    // Obtener información de la video room
    socket.emit("video:room:get", { roomId: params.id });
    
    socket.on("video:room:details", (room) => {
      setVideoRoom(room);
      setChatRoomId(room.chatRoomId || null);
      
      // Unirse al chat si existe
      if (room.chatRoomId) {
        chatSocket.emit("room:join", {
          roomId: room.chatRoomId
        });
      }
    });
  }, [params.id]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <MeetingHeader room={videoRoom} />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Área de Video WebRTC */}
          <VideoRoomWebRTC roomId={params.id} />
          
          {/* Chat en Vivo */}
          {chatRoomId && (
            <MeetingChatSidebar chatRoomId={chatRoomId} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
```

---

## 🗄️ Esquema de Base de Datos

### Actualizar tabla: `video_rooms` (existente)

```sql
-- Agregar columnas para relación con chat
ALTER TABLE video_rooms 
ADD COLUMN chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE SET NULL,
ADD COLUMN access_code VARCHAR(8) UNIQUE;

-- Crear índices
CREATE INDEX idx_video_rooms_chat_room ON video_rooms(chat_room_id);
CREATE INDEX idx_video_rooms_access_code ON video_rooms(access_code);
```

### Actualizar tabla: `chat_rooms` (existente)

```sql
-- Agregar columnas para relación con video
ALTER TABLE chat_rooms 
ADD COLUMN video_room_id UUID,  -- Sin FK si está en otro servicio
ADD COLUMN is_meeting_chat BOOLEAN DEFAULT FALSE,
ADD COLUMN access_code VARCHAR(8);  -- Código compartido con video room

-- Crear índices
CREATE INDEX idx_chat_rooms_video_room ON chat_rooms(video_room_id);
CREATE INDEX idx_chat_rooms_is_meeting ON chat_rooms(is_meeting_chat);
CREATE INDEX idx_chat_rooms_access_code ON chat_rooms(access_code);
```

**Nota**: Si `video_rooms` y `chat_rooms` están en diferentes bases de datos/servicios, usar `access_code` como clave de relación en lugar de FK directa.

---

## 🎯 Integración con el Sistema Actual

### 1. **Actualizar ChatSidebar**

```typescript
// Mostrar icono especial para chats de reuniones
{room.isMeetingChat && (
  <div className="flex items-center gap-1">
    <Video className="h-3 w-3 text-blue-400" />
    <span className="text-xs text-blue-400">Reunión</span>
  </div>
)}
```

### 2. **Navegación desde Chat a Reunión**

```typescript
// Si el chat pertenece a una reunión, mostrar botón para unirse
{room.isMeetingChat && room.meetingId && (
  <button
    onClick={() => router.push(`/meeting/${room.meetingId}`)}
    className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded"
  >
    <Video className="h-4 w-4" />
    Unirse a la reunión
  </button>
)}
```

### 3. **Dashboard con Reuniones Activas**

```typescript
// Mostrar reuniones activas en el dashboard
const activeMeetings = meetings.filter(m => m.status === 'active');

activeMeetings.map(meeting => (
  <Card key={meeting.id}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>{meeting.title}</CardTitle>
        <Badge>{meeting.status}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <p>Código: {meeting.accessCode}</p>
      <p>Participantes: {meeting.participants.length}</p>
      <Button onClick={() => router.push(`/meeting/${meeting.id}`)}>
        Unirse
      </Button>
      {meeting.chatRoomId && (
        <Button onClick={() => router.push(`/chat?room=${meeting.chatRoomId}`)}>
          Ver Chat
        </Button>
      )}
    </CardContent>
  </Card>
));
```

---

## ✅ Checklist de Implementación

### Fase 1: Base de Datos
- [ ] Agregar `chat_room_id` y `access_code` a `video_rooms`
- [ ] Agregar `video_room_id`, `is_meeting_chat`, `access_code` a `chat_rooms`
- [ ] Crear índices necesarios

### Fase 2: Video Service - Actualizar Eventos
- [ ] Actualizar `video:room:create` para aceptar `createChat` y generar `accessCode`
- [ ] Implementar función para comunicarse con Chat Service
- [ ] Actualizar `video:room:join` para aceptar `code` y unirse al chat
- [ ] Actualizar `video:room:created` response para incluir `chatRoomId` y `accessCode`
- [ ] Implementar `video:room:join-by-code` (opcional, buscar por código)

### Fase 3: Chat Service - Actualizar para Video Rooms
- [ ] Actualizar `room:create` para aceptar `videoRoomId` e `isMeetingChat`
- [ ] Actualizar `room:join` para validar código si es chat de reunión
- [ ] Actualizar `rooms:list` para incluir chats de reuniones
- [ ] Implementar búsqueda de sala por código (si no existe)

### Fase 4: Comunicación entre Servicios
- [ ] Configurar cliente HTTP en Video Service para Chat Service
- [ ] Implementar función `createChatRoomForVideo()`
- [ ] Implementar función `joinChatRoomForVideo()`
- [ ] Manejar errores si Chat Service no está disponible

### Fase 5: Frontend - Componentes
- [ ] `MeetingPage` - Página principal (`/meeting/[id]`)
- [ ] `VideoRoomWebRTC` - Componente de video (usar tus eventos existentes)
- [ ] `MeetingChatSidebar` - Chat durante la reunión
- [ ] `MeetingHeader` - Controles y título de la reunión
- [ ] Actualizar `/crearReunion` para crear video room con chat

### Fase 6: Integración Frontend
- [ ] Actualizar formulario de crear reunión para llamar a `video:room:create`
- [ ] Manejar `video:room:created` con `chatRoomId` incluido
- [ ] Actualizar ChatSidebar para mostrar icono de video en chats de reuniones
- [ ] Navegación desde chat a reunión (si `isMeetingChat === true`)

### Fase 7: Testing
- [ ] Crear video room → Verificar chat creado automáticamente
- [ ] Unirse con código → Verificar acceso a video y chat simultáneo
- [ ] Chat durante reunión → Verificar mensajes en tiempo real
- [ ] Salir de reunión → Verificar limpieza de recursos
- [ ] Múltiples participantes → Verificar sincronización video + chat

---

## 🔧 Ejemplo Completo de Integración

### Video Service - Handler completo:

```typescript
// video-service/src/handlers/videoRoomHandler.ts
import axios from 'axios';

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3002';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

socket.on("video:room:create", async (data) => {
  const { name, description, maxParticipants = 50, createChat = true } = data;
  const userId = socket.userId;

  try {
    // 1. Generar código de acceso
    const accessCode = generateRoomCode();

    // 2. Crear Video Room
    const videoRoom = await db.videoRooms.create({
      name,
      description,
      hostId: userId,
      maxParticipants,
      accessCode,
      participants: [userId],
      isRecording: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    let chatRoomId: string | undefined;

    // 3. Crear Chat Room asociado si createChat es true
    if (createChat) {
      try {
        const chatResponse = await axios.post(`${CHAT_SERVICE_URL}/api/rooms`, {
          name: `${name} - Chat`,
          description: description || `Chat de la reunión ${name}`,
          type: "channel",
          visibility: "private",
          code: accessCode,
          videoRoomId: videoRoom.id,
          isMeetingChat: true,
          createdBy: userId,
          participants: [userId]
        }, {
          headers: {
            'Authorization': `Bearer ${socket.token}`, // Si necesitas autenticación
            'Content-Type': 'application/json'
          }
        });

        chatRoomId = chatResponse.data.id;

        // Actualizar Video Room con chatRoomId
        await db.videoRooms.update(videoRoom.id, {
          chatRoomId: chatRoomId
        });

      } catch (chatError) {
        console.error("Error al crear chat:", chatError);
        // Continuar sin chat si falla
      }
    }

    // 4. Emitir respuesta
    socket.emit("video:room:created", {
      ...videoRoom,
      chatRoomId,
      accessCode
    });

    // 5. Notificar a otros (opcional)
    socket.broadcast.emit("video:room:created", {
      ...videoRoom,
      chatRoomId: undefined, // No mostrar a otros
      accessCode: undefined  // No mostrar a otros
    });

  } catch (error) {
    console.error("Error al crear video room:", error);
    socket.emit("error", {
      message: "Error al crear la sala de video",
      code: "VIDEO_ROOM_CREATE_ERROR"
    });
  }
});

socket.on("video:room:join", async (data) => {
  const { roomId, code } = data;
  const userId = socket.userId;

  try {
    const videoRoom = await db.videoRooms.findOne({ id: roomId });

    if (!videoRoom) {
      return socket.emit("error", {
        message: "Sala de video no encontrada",
        code: "VIDEO_ROOM_NOT_FOUND"
      });
    }

    // Validar código si existe
    if (videoRoom.accessCode && code !== videoRoom.accessCode) {
      return socket.emit("error", {
        message: "Código de acceso incorrecto",
        code: "INVALID_ACCESS_CODE"
      });
    }

    // Agregar participante
    if (!videoRoom.participants.includes(userId)) {
      videoRoom.participants.push(userId);
      await db.videoRooms.update(roomId, {
        participants: videoRoom.participants,
        updatedAt: new Date()
      });
    }

    // Unirse al chat si existe
    if (videoRoom.chatRoomId) {
      try {
        await axios.post(`${CHAT_SERVICE_URL}/api/rooms/${videoRoom.chatRoomId}/join`, {
          userId,
          code: videoRoom.accessCode
        }, {
          headers: {
            'Authorization': `Bearer ${socket.token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (chatError) {
        console.error("Error al unirse al chat:", chatError);
      }
    }

    socket.join(roomId);

    const activeParticipants = await getActiveParticipants(roomId);

    socket.emit("video:room:joined", {
      roomId,
      room: videoRoom,
      participants: activeParticipants,
      chatRoomId: videoRoom.chatRoomId
    });

    socket.to(roomId).emit("video:participant-joined", {
      roomId,
      userId
    });

  } catch (error) {
    socket.emit("error", {
      message: "Error al unirse a la sala",
      code: "VIDEO_ROOM_JOIN_ERROR"
    });
  }
});
```

---

## 🚀 Recomendaciones Finales

1. **Usar tu Video Service existente**: Ya tienes WebRTC funcionando, solo falta integrar con chat
2. **Comunicación HTTP entre servicios**: La forma más simple para empezar
3. **Mismo código de acceso**: Compartir `accessCode` entre video y chat simplifica la UX
4. **Chat persistente**: Mantener el chat activo después de terminar la reunión (para revisar mensajes)
5. **Notificaciones en tiempo real**: Notificar en la videollamada cuando alguien escribe en el chat
6. **Fallback graceful**: Si Chat Service no está disponible, continuar sin chat

---

## 📝 Notas Técnicas

- El chat se crea automáticamente cuando `createChat: true` (default)
- El código de acceso es el mismo para video room y chat room
- Los participantes se unen automáticamente al chat al unirse a la video room
- El chat persiste después de que termine la reunión (útil para revisar mensajes)
- Se puede acceder al chat sin estar en la videollamada (útil para dispositivos sin cámara)
- Si Chat Service falla, la video room se crea igual (sin chat)

