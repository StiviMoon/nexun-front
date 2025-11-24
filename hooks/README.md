# Hooks de Autenticación con React Query

## 📦 Hooks disponibles

### `useAuthApi.ts`
Hooks de bajo nivel que usan React Query directamente para las peticiones al backend:
- `useCurrentUser()` - Obtener usuario actual
- `useRegister()` - Mutación para registro
- `useLogin()` - Mutación para login
- `useGoogleAuth()` - Mutación para autenticación con Google
- `useVerifyToken()` - Mutación para verificar token
- `useLogout()` - Mutación para logout

### `useAuthWithQuery.ts`
Hook de alto nivel que combina Zustand con React Query:
- ✅ Maneja el estado de autenticación en Zustand
- ✅ Usa React Query para las peticiones al backend
- ✅ Incluye el listener de Firebase
- ✅ Gestiona errores y estados de carga

## 🚀 Uso recomendado

### Opción 1: Usar `useAuthWithQuery` (Recomendado)

```tsx
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

const MyComponent = () => {
  const {
    currentUser,
    isAuthInitializing,
    signInWithEmailPassword,
    registerWithEmailPassword,
    signInWithGoogle,
    signOutUser,
    authErrors,
    // Estados de React Query
    isLoginPending,
    isRegisterPending,
    isGoogleAuthPending,
  } = useAuthWithQuery();

  const handleLogin = async () => {
    try {
      await signInWithEmailPassword(email, password);
      // Éxito - React Query actualiza el cache automáticamente
    } catch (error) {
      // Error manejado por el hook
    }
  };

  return (
    // Tu componente
  );
};
```

### Opción 2: Usar hooks de React Query directamente

```tsx
import { useLogin, useCurrentUser } from "@/hooks/useAuthApi";

const MyComponent = () => {
  const loginMutation = useLogin();
  const { data: currentUser } = useCurrentUser();

  const handleLogin = async () => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      // result contiene { user, token }
    } catch (error) {
      // Manejar error
    }
  };

  return (
    // Tu componente
  );
};
```

## ✨ Ventajas de React Query

1. **Caching automático** - Las respuestas se cachean automáticamente
2. **Revalidación inteligente** - Los datos se actualizan cuando es necesario
3. **Estados de carga/error** - `isPending`, `isError`, `error` disponibles
4. **Optimistic updates** - Puedes actualizar la UI antes de la respuesta
5. **Retry automático** - Reintentos configurables
6. **DevTools** - Herramientas de desarrollo incluidas

## 🔄 Migración desde `useAuth`

Si estás usando `useAuth` de `app/hooks/useAuth.ts`, puedes migrar gradualmente:

1. Mantén `useAuth` para compatibilidad
2. Usa `useAuthWithQuery` en nuevos componentes
3. Migra componentes existentes cuando sea conveniente

Los dos hooks pueden coexistir sin problemas.

