import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utils/api/client";
import { UserProfile } from "@/types/api";

// Query Keys
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

/**
 * Hook para obtener el usuario actual
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      if (!response.success || !response.user) {
        throw new Error(response.error || "Failed to get current user");
      }
      return response.user;
    },
    enabled: false, // Se activa manualmente cuando hay token
    retry: false,
  });
};

/**
 * Hook para registro de usuario
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name?: string;
    }): Promise<{ user: UserProfile; token: string }> => {
      const response = await apiClient.register(email, password, name);
      
      if (!response.success || !response.token || !response.user) {
        throw new Error(response.error || "Failed to register user");
      }

      return {
        user: response.user,
        token: response.token,
      };
    },
    onSuccess: (data) => {
      // Actualizar cache del usuario actual
      queryClient.setQueryData(authKeys.me(), data.user);
      // Token is now managed automatically by the API client via Firebase
    },
    onError: () => {
      // Limpiar cache en caso de error
      queryClient.removeQueries({ queryKey: authKeys.me() });
    },
  });
};

/**
 * Hook para login de usuario
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }): Promise<{ user: UserProfile; token: string }> => {
      const response = await apiClient.login(email, password);
      
      if (!response.success || !response.token) {
        throw new Error(response.error || "Failed to login");
      }

      // El backend devuelve user y custom token
      return {
        user: response.user!,
        token: response.token,
      };
    },
    onSuccess: (data) => {
      // Actualizar cache del usuario actual (perfil del backend)
      queryClient.setQueryData(authKeys.me(), data.user);
      // Token se guardará después de intercambiarlo por ID token
    },
    onError: () => {
      // Limpiar cache en caso de error
      queryClient.removeQueries({ queryKey: authKeys.me() });
    },
  });
};

/**
 * Hook para autenticación con Google
 */
export const useGoogleAuth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ idToken }: { idToken: string }): Promise<UserProfile> => {
      const response = await apiClient.googleAuth(idToken);
      
      if (!response.success || !response.user) {
        throw new Error(response.error || "Failed to authenticate with Google");
      }

      // Token is now managed automatically by the API client via Firebase
      return response.user;
    },
    onSuccess: (user) => {
      // Actualizar cache del usuario actual
      queryClient.setQueryData(authKeys.me(), user);
    },
    onError: () => {
      // Limpiar cache en caso de error
      queryClient.removeQueries({ queryKey: authKeys.me() });
    },
  });
};

/**
 * Hook para verificar token
 */
export const useVerifyToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ idToken }: { idToken: string }): Promise<UserProfile> => {
      const response = await apiClient.verifyToken(idToken);
      
      if (!response.success || !response.user) {
        throw new Error(response.error || "Failed to verify token");
      }

      // Token is now managed automatically by the API client via Firebase
      return response.user;
    },
    onSuccess: (user) => {
      // Actualizar cache del usuario actual
      queryClient.setQueryData(authKeys.me(), user);
    },
    onError: () => {
      // Limpiar cache en caso de error
      queryClient.removeQueries({ queryKey: authKeys.me() });
    },
  });
};

/**
 * Hook para logout
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        await apiClient.logout();
      } catch (error) {
        // Continuar con logout incluso si el backend falla
        console.error("Backend logout error:", error);
      }
      
      // Token is now managed automatically by the API client via Firebase
    },
    onSuccess: () => {
      // Limpiar todo el cache de autenticación
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
    onError: () => {
      // Limpiar cache incluso si hay error
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
};

