'use client';

import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

/**
 * useAuth
 *
 * Hook de compatibilidad que envuelve `useAuthWithQuery`.
 * Proporciona la misma API que hooks antiguos para no romper código existente.
 *
 * returns {{
 *   currentUser: import('firebase/auth').User | null;
 *   isAuthInitializing: boolean;
 *   authErrors: Error[] | null;
 *   isEmailSignInLoading: boolean;
 *   isEmailSignUpLoading: boolean;
 *   isGoogleLoading: boolean;
 *   isSignOutLoading: boolean;
 * }}
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
 * useAuthAction
 *
 * Hook de compatibilidad para acceder a propiedades específicas del estado de autenticación.
 * 
 * @deprecated Usa `useAuthWithQuery` directamente para mejor integración con React Query.
 *
 * @template T
 * @param {(state: ReturnType<typeof useAuthWithQuery>) => T} selector - Función que selecciona la parte del estado que deseas.
 * @returns {T} El valor seleccionado del estado de autenticación.
 */
export const useAuthAction = <T>(selector: (state: ReturnType<typeof useAuthWithQuery>) => T) => {
  const authState = useAuthWithQuery();
  return selector(authState);
};
