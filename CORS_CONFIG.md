# 🔧 Configuración de CORS y Puertos

## 📍 Configuración del Frontend

### Puerto 5000
El frontend está configurado para correr en el puerto **5000**.

Para iniciar el servidor de desarrollo:
```bash
npm run dev
# o
pnpm dev
```

El servidor se iniciará en: `http://localhost:5000`

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Frontend Port
PORT=5000

# API Gateway URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Chat Service URL (direct connection option)
NEXT_PUBLIC_CHAT_SERVICE_URL=http://localhost:3002

# Video Service URL (direct connection option)
NEXT_PUBLIC_VIDEO_SERVICE_URL=http://localhost:3003

# Frontend URL (for CORS configuration)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:5000
```

## 🔐 Configuración de CORS en el Backend

**IMPORTANTE**: CORS se configura principalmente en el **backend** (API Gateway). El frontend hace peticiones desde el navegador, y el backend debe permitir el origen del frontend.

### Configuración necesaria en el API Gateway (puerto 3000)

El API Gateway debe permitir peticiones desde `http://localhost:5000`. Asegúrate de que tu backend tenga configurado:

```javascript
// En tu API Gateway (puerto 3000)
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5000',  // Frontend
    'http://localhost:3000',  // API Gateway (si es necesario)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Configuración para Socket.IO

Para las conexiones Socket.IO (Chat y Video services), también necesitas configurar CORS:

```javascript
// En Chat Service (puerto 3002) y Video Service (puerto 3003)
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5000',  // Frontend
      'http://localhost:3000',  // API Gateway (si usas gateway)
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});
```

## 🚀 Verificación

1. **Frontend corriendo**: `http://localhost:5000`
2. **Backend API Gateway**: `http://localhost:3000`
3. **Chat Service**: `http://localhost:3002`
4. **Video Service**: `http://localhost:3003`

### Probar CORS

Abre la consola del navegador (F12) y verifica que no haya errores de CORS al hacer peticiones al backend.

Si ves errores como:
```
Access to fetch at 'http://localhost:3000/api/auth/...' from origin 'http://localhost:5000' has been blocked by CORS policy
```

Significa que necesitas actualizar la configuración de CORS en tu backend para incluir `http://localhost:5000` en los orígenes permitidos.

## 📝 Notas

- El frontend ya está configurado para correr en el puerto 5000
- CORS se maneja principalmente en el backend
- Las variables de entorno están configuradas para apuntar a los servicios correctos
- Socket.IO también requiere configuración de CORS en el backend

