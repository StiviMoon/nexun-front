"use client";

import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

/**
 * Hook de compatibilidad que usa useAuthWithQuery internamente
 * Mantiene la misma API para compatibilidad con código existente
 */
export const useAuth = () => {
  const {
    currentUser,
    isAuthInitializing,
    authErrors,
    isEmailSignInLoading,
    isEmailSignUpLoading,
    isGoogleLoading,
    isSignOutLoading
  } = useAuthWithQuery();

  return {
    currentUser,
    isAuthInitializing,
    authErrors,
    isEmailSignInLoading,
    isEmailSignUpLoading,
    isGoogleLoading,
    isSignOutLoading
  };
};

/**
 * Hook de compatibilidad para acciones
 * @deprecated Usa useAuthWithQuery directamente para mejor integración con React Query
 */
export const useAuthAction = <T>(selector: (state: ReturnType<typeof useAuthWithQuery>) => T) => {
  const authState = useAuthWithQuery();
  return selector(authState);
};

