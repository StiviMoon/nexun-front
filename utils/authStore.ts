import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "@/utils/firabase";
import { getReadableSignInError, getReadableSignUpError } from "@/utils/authErrors";
import { AuthState } from "@/types/auth";
import { saveUserProfile } from "@/utils/repositories/userRepository";

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthInitializing: true,
  hasInitializedListener: false,
  isEmailSignInLoading: false,
  isEmailSignUpLoading: false,
  isGoogleLoading: false,
  isSignOutLoading: false,
  authErrors: {},

  initializeAuthListener: () => {
    const { hasInitializedListener } = get();

    if (hasInitializedListener) {
      return;
    }

    set({ hasInitializedListener: true, isAuthInitializing: true });

    onAuthStateChanged(auth, (user) => {
      set({ currentUser: user, isAuthInitializing: false });
    });
  },

  setAuthError: (key, message) => {
    set((state) => ({
      authErrors: {
        ...state.authErrors,
        [key]: message
      }
    }));
  },

  clearAuthError: (key) => {
    set((state) => {
      const nextErrors = { ...state.authErrors };
      delete nextErrors[key];
      return { authErrors: nextErrors };
    });
  },

  signInWithEmailPassword: async (email, password) => {
    const { setAuthError, clearAuthError } = get();

    clearAuthError("signIn");
    clearAuthError("google");

    set({ isEmailSignInLoading: true });

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await saveUserProfile(credential.user);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        setAuthError("signIn", getReadableSignInError(String(error.code)));
      } else {
        setAuthError("signIn", "Ocurrió un error inesperado.");
      }

      throw error;
    } finally {
      set({ isEmailSignInLoading: false });
    }
  },

  registerWithEmailPassword: async (name, email, password) => {
    const { setAuthError, clearAuthError } = get();

    clearAuthError("signUp");
    clearAuthError("google");

    set({ isEmailSignUpLoading: true });

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }

      await saveUserProfile(userCredential.user);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        setAuthError("signUp", getReadableSignUpError(String(error.code)));
      } else {
        setAuthError("signUp", "Ocurrió un error inesperado.");
      }

      throw error;
    } finally {
      set({ isEmailSignUpLoading: false });
    }
  },

  signInWithGoogle: async () => {
    const { setAuthError, clearAuthError } = get();

    clearAuthError("google");
    clearAuthError("signIn");
    clearAuthError("signUp");

    set({ isGoogleLoading: true });

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await saveUserProfile(credential.user);
    } catch (error) {
      setAuthError("google", "No fue posible autenticarte con Google.");
      throw error;
    } finally {
      set({ isGoogleLoading: false });
    }
  },

  signOutUser: async () => {
    const { setAuthError, clearAuthError } = get();

    clearAuthError("signOut");

    set({ isSignOutLoading: true });

    try {
      await signOut(auth);
    } catch (error) {
      setAuthError("signOut", "No fue posible cerrar sesión. Inténtalo de nuevo.");
      throw error;
    } finally {
      set({ isSignOutLoading: false });
    }
  }
}));

