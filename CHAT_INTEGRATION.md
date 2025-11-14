# Integración del Microservicio de Chat

Este documento explica cómo usar el microservicio de chat en tiempo real con Socket.IO desde el frontend.

## Configuración

### 1. Variable de Entorno

Agrega la URL del servidor Socket.IO a tu archivo `.env.local`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 2. Estructura de Archivos Creados

```
nexun-front/
├── types/
│   └── chat.ts                    # Tipos TypeScript para el chat
├── utils/
│   └── chat/
│       └── getAuthToken.ts        # Utilidad para obtener token de Firebase
├── app/
│   ├── hooks/
│   │   └── useChat.ts             # Hook principal para usar el chat
│   ├── components/
│   │   └── chat/
│   │       ├── ChatRoom.tsx       # Componente de sala de chat
│   │       └── ChatRoomsList.tsx  # Lista de salas
│   └── chat/
│       └── page.tsx               # Página de ejemplo
```

## Uso Básico

### Hook `useChat`

El hook `useChat` proporciona toda la funcionalidad del chat:

```typescript
import { useChat } from "@/app/hooks/useChat";

function MyComponent() {
  const {
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
  } = useChat();

  // Conectar cuando el componente se monta
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <div>
      {isConnected ? (
        <div>Conectado al chat</div>
      ) : (
        <button onClick={connect}>Conectar</button>
      )}
    </div>
  );
}
```

### Ejemplo Completo: Componente de Chat

```typescript
"use client";

import { useEffect, useState } from "react";
import { useChat } from "@/app/hooks/useChat";
import { useAuth } from "@/app/hooks/useAuth";

export default function ChatComponent() {
  const { currentUser } = useAuth();
  const {
    isConnected,
    connect,
    disconnect,
    rooms,
    messages,
    joinRoom,
    sendMessage,
    createRoom
  } = useChat();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  // Conectar cuando el usuario esté autenticado
  useEffect(() => {
    if (currentUser && !isConnected) {
      connect();
    }

    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [currentUser, isConnected, connect, disconnect]);

  // Unirse a una sala cuando se selecciona
  useEffect(() => {
    if (selectedRoomId && isConnected) {
      joinRoom(selectedRoomId);
    }
  }, [selectedRoomId, isConnected, joinRoom]);

  const handleSendMessage = () => {
    if (selectedRoomId && messageInput.trim()) {
      sendMessage(selectedRoomId, messageInput);
      setMessageInput("");
    }
  };

  const handleCreateRoom = () => {
    createRoom({
      name: "Mi Nueva Sala",
      type: "group",
      description: "Descripción opcional"
    });
  };

  if (!currentUser) {
    return <div>Debes iniciar sesión para usar el chat</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Lista de salas */}
      <div className="w-64 border-r p-4">
        <button onClick={handleCreateRoom} className="mb-4">
          Crear Sala
        </button>
        <div className="space-y-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={`p-2 cursor-pointer ${
                selectedRoomId === room.id ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              {room.name}
            </div>
          ))}
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 flex flex-col">
        {selectedRoomId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messages[selectedRoomId]?.map((message) => (
                <div key={message.id} className="mb-4">
                  <div className="font-semibold">{message.senderName}</div>
                  <div>{message.content}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                className="w-full p-2 border rounded"
              />
              <button onClick={handleSendMessage} className="mt-2">
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            Selecciona una sala para comenzar
          </div>
        )}
      </div>
    </div>
  );
}
```

## API del Hook `useChat`

### Estado

- `isConnected: boolean` - Si está conectado al servidor
- `isConnecting: boolean` - Si está en proceso de conexión
- `error: ChatError | null` - Error actual, si existe
- `rooms: ChatRoom[]` - Lista de salas del usuario
- `messages: Record<string, ChatMessage[]>` - Mensajes por sala (roomId -> messages)
- `currentRoom: ChatRoom | null` - Sala actualmente seleccionada

### Acciones

- `connect(): Promise<void>` - Conectar al servidor
- `disconnect(): void` - Desconectar del servidor
- `joinRoom(roomId: string): void` - Unirse a una sala
- `leaveRoom(roomId: string): void` - Salir de una sala
- `sendMessage(roomId: string, content: string, type?: "text" | "image" | "file"): void` - Enviar mensaje
- `createRoom(data: CreateRoomData): void` - Crear nueva sala
- `getRoom(roomId: string): void` - Obtener detalles de una sala
- `getMessages(roomId: string, limit?: number, lastMessageId?: string): void` - Obtener mensajes
- `setCurrentRoom(room: ChatRoom | null): void` - Establecer sala actual

## Eventos Socket.IO

### Eventos que Emite el Cliente

- `room:join` - Unirse a una sala
- `room:leave` - Salir de una sala
- `message:send` - Enviar mensaje
- `room:create` - Crear sala
- `room:get` - Obtener detalles de sala
- `messages:get` - Obtener mensajes

### Eventos que Recibe el Cliente

- `room:joined` - Confirmación de unión a sala
- `room:left` - Confirmación de salida
- `message:new` - Nuevo mensaje recibido
- `room:created` - Sala creada
- `rooms:list` - Lista de salas
- `messages:list` - Lista de mensajes
- `user:online` - Usuario conectado
- `user:offline` - Usuario desconectado
- `error` - Error del servidor

## Autenticación

El hook `useChat` automáticamente obtiene el token de Firebase del usuario autenticado. Asegúrate de que el usuario esté autenticado antes de llamar a `connect()`:

```typescript
const { currentUser } = useAuth();
const { connect } = useChat();

useEffect(() => {
  if (currentUser) {
    connect();
  }
}, [currentUser, connect]);
```

## Ejemplo de Página Completa

Ya existe una página de ejemplo en `/app/chat/page.tsx` que muestra una implementación completa del chat. Puedes acceder a ella navegando a `/chat` en tu aplicación.

## Notas Importantes

1. **Autenticación Requerida**: El usuario debe estar autenticado con Firebase para usar el chat
2. **Conexión Automática**: El hook maneja la reconexión automática si se pierde la conexión
3. **Limpieza**: Siempre desconecta cuando el componente se desmonte
4. **Mensajes en Tiempo Real**: Los mensajes se reciben automáticamente cuando otros usuarios los envían
5. **Persistencia**: Los mensajes se guardan en Firestore y se cargan al unirse a una sala

