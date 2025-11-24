"use client";

import { useCallback, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { useAuthStore } from "@/utils/authStore";
import { useVerifyToken, useLogout } from "./useAuthApi";
import { exchangeCustomTokenForIdToken, signInWithGoogle as firebaseGoogleAuth } from "@/utils/auth/tokenService";
import { verifyPassword } from "@/utils/auth/firebaseAuthAPI";
import { useLogin, useRegister, useGoogleAuth } from "./useAuthApi";
import { getReadableSignInError, getReadableSignUpError } from "@/utils/authErrors";

// Minimal Firebase config for auth state listener
const firebaseConfig = {
  apiKey: "AIzaSyCn-wZ9AN9o3L-jTJ4xCwk1g8L5NUXjHB8",
  authDomain: "nexun-ea714.firebaseapp.com",
  projectId: "nexun-ea714"
};

const getFirebaseAuth = () => {
  const existingApps = getApps();
  const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  return getAuth(app);
};

/**
 * Hook mejorado que combina Zustand con React Query
 * Usa React Query para las peticiones al backend y Zustand para el estado local
 */
export const useAuthWithQuery = () => {
  // Obtener selectores específicos de Zustand para evitar re-renders innecesarios
  const currentUser = useAuthStore((state) => state.currentUser);
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const isAuthInitializing = useAuthStore((state) => state.isAuthInitializing);
  const authErrors = useAuthStore((state) => state.authErrors);
  const isEmailSignInLoading = useAuthStore((state) => state.isEmailSignInLoading);
  const isEmailSignUpLoading = useAuthStore((state) => state.isEmailSignUpLoading);
  const isGoogleLoading = useAuthStore((state) => state.isGoogleLoading);
  const isSignOutLoading = useAuthStore((state) => state.isSignOutLoading);
  const hasInitializedListener = useAuthStore((state) => state.hasInitializedListener);
  
  // Actions
  const initializeAuthListener = useAuthStore((state) => state.initializeAuthListener);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const setEmailSignInLoading = useAuthStore((state) => state.setEmailSignInLoading);
  const setEmailSignUpLoading = useAuthStore((state) => state.setEmailSignUpLoading);
  const setGoogleLoading = useAuthStore((state) => state.setGoogleLoading);
  const setSignOutLoading = useAuthStore((state) => state.setSignOutLoading);

  // React Query mutations
  const verifyTokenMutation = useVerifyToken();
  const logoutMutation = useLogout();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const googleAuthMutation = useGoogleAuth();

  // Inicializar listener de Firebase con React Query
  useEffect(() => {
    if (hasInitializedListener) {
      return;
    }

    initializeAuthListener();

    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          
          // Usar React Query para verificar token
          const user = await verifyTokenMutation.mutateAsync({ idToken });
          
          if (user) {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error("Error verifying token:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        setFirebaseUser(null);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitializedListener]);

  // Login mejorado con React Query
  const signInWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      clearAuthError("signIn");
      clearAuthError("google");
      setEmailSignInLoading(true);

      try {
        // Verificar contraseña primero
        await verifyPassword(email, password);

        // Login con React Query
        const { token } = await loginMutation.mutateAsync({ email, password });

        // Intercambiar custom token por ID token
        const idToken = await exchangeCustomTokenForIdToken(token);

        // Verificar token para obtener perfil completo
        const verifiedUser = await verifyTokenMutation.mutateAsync({ idToken });

        setCurrentUser(verifiedUser);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("auth/")) {
            setAuthError("signIn", getReadableSignInError(error.message));
          } else {
            setAuthError("signIn", "Ocurrió un error inesperado.");
          }
        }
        throw error;
      } finally {
        setEmailSignInLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loginMutation, verifyTokenMutation]
  );

  // Registro mejorado con React Query
  const registerWithEmailPassword = useCallback(
    async (firstName: string, lastName: string, email: string, password: string, age: number) => {
      clearAuthError("signUp");
      clearAuthError("google");
      setEmailSignUpLoading(true);

      try {
        // Registro con React Query
        const { token } = await registerMutation.mutateAsync({ email, password, firstName, lastName, age });

        // Intercambiar custom token por ID token
        const idToken = await exchangeCustomTokenForIdToken(token);

        // Verificar token para obtener perfil completo
        const verifiedUser = await verifyTokenMutation.mutateAsync({ idToken });

        setCurrentUser(verifiedUser);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("auth/")) {
            setAuthError("signUp", getReadableSignUpError(error.message));
          } else {
            setAuthError("signUp", "Ocurrió un error inesperado.");
          }
        }
        throw error;
      } finally {
        setEmailSignUpLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registerMutation, verifyTokenMutation]
  );

  // Google Auth mejorado con React Query
  const signInWithGoogle = useCallback(async () => {
    clearAuthError("google");
    clearAuthError("signIn");
    clearAuthError("signUp");
    setGoogleLoading(true);

    try {
      // Autenticar con Google
      const { idToken } = await firebaseGoogleAuth();

      // Verificar con backend usando React Query
      const user = await googleAuthMutation.mutateAsync({ idToken });

      setCurrentUser(user);
    } catch (error) {
      setAuthError("google", "No fue posible autenticarte con Google.");
      throw error;
    } finally {
      setGoogleLoading(false);
    }
  }, [googleAuthMutation, clearAuthError, setGoogleLoading, setCurrentUser, setAuthError]);

  // Logout mejorado con React Query
  const signOutUser = useCallback(async () => {
    clearAuthError("signOut");
    setSignOutLoading(true);

    try {
      // Logout con React Query
      await logoutMutation.mutateAsync();

      // Sign out de Firebase
      const { signOutFirebase } = await import("@/utils/auth/tokenService");
      await signOutFirebase();

      // Limpiar estado
      setCurrentUser(null);
      setFirebaseUser(null);
    } catch (error) {
      setAuthError("signOut", "No fue posible cerrar sesión. Inténtalo de nuevo.");
      throw error;
    } finally {
      setSignOutLoading(false);
    }
  }, [logoutMutation, clearAuthError, setSignOutLoading, setCurrentUser, setFirebaseUser, setAuthError]);

  return {
    // Estado de Zustand
    currentUser,
    firebaseUser,
    isAuthInitializing,
    authErrors,
    isEmailSignInLoading,
    isEmailSignUpLoading,
    isGoogleLoading,
    isSignOutLoading,

    // Acciones mejoradas con React Query
    signInWithEmailPassword,
    registerWithEmailPassword,
    signInWithGoogle,
    signOutUser,

    // Helpers
    setAuthError,
    clearAuthError,
    setCurrentUser,

    // Estados de React Query
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isGoogleAuthPending: googleAuthMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    
    // Objetos de mutación completos (para acceso avanzado)
    loginMutation,
    registerMutation,
    googleAuthMutation,
    logoutMutation,
    verifyTokenMutation,
  };
};
