# 🔐 Implementación Backend: Salas Públicas y Privadas con Códigos

## 📋 Resumen

Este documento describe los cambios necesarios en el backend para soportar salas de chat **públicas** y **privadas** con códigos de acceso. Actualmente el sistema solo soporta salas públicas.

---

## 🎯 Cambios Requeridos

### 1. **Modelo de Datos - ChatRoom**

#### Agregar campos a la entidad ChatRoom:

```typescript
// Antes
interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: "direct" | "group" | "channel";
  participants: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Después
interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: "direct" | "group" | "channel";
  visibility: "public" | "private";  // ✨ NUEVO
  code?: string;                      // ✨ NUEVO - Código de acceso para salas privadas
  participants: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Cambios en la base de datos:
- Agregar columna `visibility` (enum: 'public' | 'private', default: 'public')
- Agregar columna `code` (string nullable, unique)
- Crear índice único en `code` para búsquedas rápidas

---

### 2. **Evento: `room:create` - Crear Sala**

#### Request actual (públicas):
```typescript
{
  name: string;
  description?: string;
  type: "direct" | "group" | "channel";
  participants?: string[];
}
```

#### Request nuevo (con visibilidad):
```typescript
{
  name: string;
  description?: string;
  type: "direct" | "group" | "channel";
  visibility: "public" | "private";  // ✨ NUEVO
  participants?: string[];
}
```

#### Lógica a implementar:

```typescript
socket.on("room:create", async (data) => {
  const { name, description, type, visibility, participants } = data;
  const userId = socket.userId; // Del middleware de autenticación

  // Validaciones básicas
  if (!name || !type || !visibility) {
    return socket.emit("error", {
      message: "Nombre, tipo y visibilidad son requeridos",
      code: "VALIDATION_ERROR"
    });
  }

  // Generar código si es privada
  let roomCode: string | undefined;
  if (visibility === "private") {
    roomCode = generateRoomCode(); // Función que genera código único de 6-8 caracteres
    // Verificar que el código no exista (rarísimo, pero mejor prevenir)
    while (await roomExistsByCode(roomCode)) {
      roomCode = generateRoomCode();
    }
  }

  // Crear la sala
  const room = await createRoom({
    name,
    description,
    type,
    visibility,
    code: roomCode,
    createdBy: userId,
    participants: participants || []
  });

  // El creador automáticamente se une
  await addParticipant(room.id, userId);

  // Emitir respuesta con el código incluido
  socket.emit("room:created", {
    ...room,
    code: roomCode // Incluir el código en la respuesta
  });

  // Notificar a otros (solo si es pública)
  if (visibility === "public") {
    socket.broadcast.emit("room:created", room);
  }
});
```

#### Función para generar código único:
```typescript
function generateRoomCode(): string {
  // Opción 1: Alfanumérico aleatorio (6 caracteres)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;

  // Opción 2: Basado en timestamp + random (más seguro)
  // return Date.now().toString(36).substring(2, 8).toUpperCase();
}
```

---

### 3. **Evento: `room:join` - Unirse a Sala**

#### Request actual:
```typescript
{
  roomId: string;
}
```

#### Request nuevo (con código opcional):
```typescript
{
  roomId: string;
  code?: string;  // ✨ NUEVO - Requerido para salas privadas
}
```

#### Lógica a implementar:

```typescript
socket.on("room:join", async (data) => {
  const { roomId, code } = data;
  const userId = socket.userId;

  // Obtener la sala
  const room = await getRoom(roomId);
  if (!room) {
    return socket.emit("error", {
      message: "Sala no encontrada",
      code: "ROOM_NOT_FOUND"
    });
  }

  // Verificar si es privada
  if (room.visibility === "private") {
    // Validar código
    if (!code) {
      return socket.emit("error", {
        message: "Código de acceso requerido para salas privadas",
        code: "CODE_REQUIRED"
      });
    }

    if (room.code !== code.toUpperCase()) {
      return socket.emit("error", {
        message: "Código de acceso incorrecto",
        code: "INVALID_CODE"
      });
    }

    // Verificar si ya es participante (opcional - para evitar duplicados)
    if (!room.participants.includes(userId)) {
      await addParticipant(roomId, userId);
    }
  } else {
    // Sala pública - unirse directamente
    if (!room.participants.includes(userId)) {
      await addParticipant(roomId, userId);
    }
  }

  // Unirse a la sala de Socket.IO
  socket.join(roomId);

  // Obtener la sala actualizada
  const updatedRoom = await getRoom(roomId);

  // Emitir confirmación
  socket.emit("room:joined", {
    roomId,
    room: updatedRoom
  });

  // Notificar a otros participantes
  socket.to(roomId).emit("room:user-joined", {
    roomId,
    userId,
    userName: socket.userName
  });
});
```

---

### 4. **Evento: `rooms:list` - Listar Salas**

#### Lógica actual (todas las salas públicas):
```typescript
socket.on("rooms:list", async () => {
  const rooms = await getAllRooms();
  socket.emit("rooms:list", rooms);
});
```

#### Lógica nueva (filtrar según visibilidad y permisos):
```typescript
socket.on("rooms:list", async () => {
  const userId = socket.userId;

  // Obtener todas las salas públicas
  const publicRooms = await getPublicRooms();

  // Obtener salas privadas donde el usuario es participante
  const privateRooms = await getPrivateRoomsByParticipant(userId);

  // Combinar y retornar
  const allRooms = [...publicRooms, ...privateRooms];

  socket.emit("rooms:list", allRooms);
});
```

#### Queries SQL sugeridos:
```sql
-- Salas públicas
SELECT * FROM chat_rooms WHERE visibility = 'public' ORDER BY updated_at DESC;

-- Salas privadas del usuario
SELECT r.* FROM chat_rooms r
INNER JOIN room_participants rp ON r.id = rp.room_id
WHERE r.visibility = 'private' AND rp.user_id = $1
ORDER BY r.updated_at DESC;
```

---

### 5. **Nuevo Evento: `room:join-by-code` - Unirse con Código**

Este evento permite buscar una sala por código y unirse directamente.

#### Request:
```typescript
{
  code: string;
}
```

#### Implementación:
```typescript
socket.on("room:join-by-code", async (data) => {
  const { code } = data;
  const userId = socket.userId;

  if (!code || code.trim().length < 6) {
    return socket.emit("error", {
      message: "Código inválido",
      code: "INVALID_CODE_FORMAT"
    });
  }

  // Buscar sala por código
  const room = await getRoomByCode(code.toUpperCase());
  
  if (!room) {
    return socket.emit("error", {
      message: "Sala no encontrada con este código",
      code: "ROOM_NOT_FOUND"
    });
  }

  // Verificar que sea privada (las públicas no tienen código)
  if (room.visibility !== "private") {
    return socket.emit("error", {
      message: "Este código no corresponde a una sala privada",
      code: "NOT_PRIVATE_ROOM"
    });
  }

  // Agregar participante si no está
  if (!room.participants.includes(userId)) {
    await addParticipant(room.id, userId);
  }

  // Unirse a la sala de Socket.IO
  socket.join(room.id);

  // Obtener sala actualizada
  const updatedRoom = await getRoom(room.id);

  // Emitir confirmación
  socket.emit("room:joined", {
    roomId: room.id,
    room: updatedRoom
  });

  // Notificar a otros
  socket.to(room.id).emit("room:user-joined", {
    roomId: room.id,
    userId,
    userName: socket.userName
  });
});
```

#### Query SQL:
```sql
SELECT * FROM chat_rooms WHERE code = $1 AND visibility = 'private' LIMIT 1;
```

---

### 6. **Seguridad y Validaciones Adicionales**

#### Validaciones a implementar:

1. **Verificar autenticación en todos los eventos**
   ```typescript
   if (!socket.userId) {
     return socket.emit("error", {
       message: "No autenticado",
       code: "UNAUTHORIZED"
     });
   }
   ```

2. **Validar formato del código** (6-8 caracteres alfanuméricos)
   ```typescript
   const CODE_REGEX = /^[A-Z0-9]{6,8}$/;
   if (!CODE_REGEX.test(code)) {
     return socket.emit("error", {
       message: "Formato de código inválido",
       code: "INVALID_CODE_FORMAT"
     });
   }
   ```

3. **Límite de participantes en salas privadas** (opcional)
   ```typescript
   if (room.visibility === "private" && room.participants.length >= MAX_PRIVATE_PARTICIPANTS) {
     return socket.emit("error", {
       message: "Sala privada llena",
       code: "ROOM_FULL"
     });
   }
   ```

4. **No permitir cambiar visibilidad de sala existente**
   ```typescript
   // Las salas no deben poder cambiar de pública a privada o viceversa después de creadas
   // Si se necesita, crear un nuevo evento específico con validaciones adicionales
   ```

---

### 7. **Actualizar Tipos de TypeScript (Backend)**

```typescript
// types/chat.ts
export interface CreateRoomData {
  name: string;
  description?: string;
  type: "direct" | "group" | "channel";
  visibility: "public" | "private";  // ✨ NUEVO
  participants?: string[];
}

export interface JoinRoomData {
  roomId: string;
  code?: string;  // ✨ NUEVO
}

export interface JoinByCodeData {
  code: string;  // ✨ NUEVO
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: "direct" | "group" | "channel";
  visibility: "public" | "private";  // ✨ NUEVO
  code?: string;                      // ✨ NUEVO
  participants: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📊 Resumen de Eventos Socket.IO

### Eventos Cliente → Servidor:
1. `room:create` - Crear sala (con `visibility`)
2. `room:join` - Unirse a sala (con `code` opcional)
3. `room:join-by-code` - **NUEVO** - Unirse con código
4. `rooms:list` - Listar salas (ya existente, necesita filtrar)

### Eventos Servidor → Cliente:
1. `room:created` - Sala creada (incluye `code` si es privada)
2. `room:joined` - Confirmación de unión
3. `rooms:list` - Lista de salas (filtrada)
4. `error` - Errores (nuevos códigos: `CODE_REQUIRED`, `INVALID_CODE`, etc.)

---

## 🗄️ Migración de Base de Datos

### PostgreSQL:
```sql
-- Agregar columna visibility
ALTER TABLE chat_rooms 
ADD COLUMN visibility VARCHAR(10) DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

-- Agregar columna code
ALTER TABLE chat_rooms 
ADD COLUMN code VARCHAR(8) UNIQUE;

-- Crear índice para búsquedas rápidas por código
CREATE INDEX idx_chat_rooms_code ON chat_rooms(code) WHERE code IS NOT NULL;

-- Crear índice para filtrar por visibilidad
CREATE INDEX idx_chat_rooms_visibility ON chat_rooms(visibility);

-- Migrar salas existentes a públicas (si es necesario)
UPDATE chat_rooms SET visibility = 'public' WHERE visibility IS NULL;
```

### MongoDB:
```javascript
// Actualizar esquema
db.chat_rooms.updateMany(
  {},
  {
    $set: {
      visibility: "public",
      code: null
    }
  }
);

// Crear índices
db.chat_rooms.createIndex({ code: 1 }, { unique: true, sparse: true });
db.chat_rooms.createIndex({ visibility: 1 });
db.chat_rooms.createIndex({ "participants": 1, "visibility": 1 });
```

---

## ✅ Checklist de Implementación

### Base de Datos:
- [ ] Agregar columna `visibility` al modelo ChatRoom
- [ ] Agregar columna `code` al modelo ChatRoom
- [ ] Crear índices necesarios
- [ ] Migrar datos existentes

### Lógica de Negocio:
- [ ] Función para generar códigos únicos
- [ ] Validación de códigos al crear salas privadas
- [ ] Validación de códigos al unirse a salas privadas
- [ ] Filtrado de salas según visibilidad
- [ ] Búsqueda de salas por código

### Eventos Socket.IO:
- [ ] Actualizar `room:create` para aceptar `visibility`
- [ ] Actualizar `room:join` para aceptar `code`
- [ ] Implementar `room:join-by-code`
- [ ] Actualizar `rooms:list` para filtrar correctamente

### Seguridad:
- [ ] Validar autenticación en todos los eventos
- [ ] Validar formato de códigos
- [ ] Verificar permisos antes de unirse
- [ ] Manejar errores apropiadamente

### Testing:
- [ ] Crear sala pública
- [ ] Crear sala privada (verificar generación de código)
- [ ] Unirse a sala pública sin código
- [ ] Unirse a sala privada con código válido
- [ ] Intentar unirse a sala privada sin código (error)
- [ ] Intentar unirse a sala privada con código inválido (error)
- [ ] Unirse con código directamente (`room:join-by-code`)
- [ ] Listar salas (solo públicas + privadas del usuario)

---

## 🎯 Flujo Completo

### Crear Sala Privada:
1. Cliente envía `room:create` con `visibility: "private"`
2. Servidor genera código único de 6-8 caracteres
3. Servidor crea sala con `code` y `visibility: "private"`
4. Servidor retorna sala con `code` incluido
5. Cliente muestra código al usuario para compartir

### Unirse a Sala Privada:
1. Usuario ingresa código de acceso
2. Cliente envía `room:join-by-code` con el código
3. Servidor busca sala por código
4. Servidor valida código y agrega usuario como participante
5. Servidor notifica confirmación y actualiza lista de participantes

---

## 📝 Notas Adicionales

1. **Códigos únicos**: Asegurar que los códigos sean únicos y difíciles de adivinar
2. **Límite de intentos**: Considerar límite de intentos fallidos para prevenir brute-force
3. **Expiración de códigos**: Opcionalmente, considerar códigos temporales
4. **Compartir código**: El código puede compartirse por cualquier medio (URL, mensaje, etc.)
5. **Regenerar código**: Opcionalmente, permitir al creador regenerar el código

---

## 🔗 Integración con Frontend

El frontend ya está preparado para:
- ✅ Crear salas con `visibility: "public" | "private"`
- ✅ Mostrar códigos generados
- ✅ Unirse con código
- ✅ Filtrar salas según visibilidad

**Solo falta implementar la lógica en el backend siguiendo este documento.**

