import { create } from "zustand";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { getReadableSignInError, getReadableSignUpError } from "@/utils/authErrors";
import { AuthState } from "@/types/auth";
import { apiClient } from "@/utils/api/client";
import { firebaseConfig } from "@/config/firebase";
import { 
  exchangeCustomTokenForIdToken, 
  signInWithGoogle as firebaseGoogleAuth,
  signOutFirebase
} from "@/utils/auth/tokenService";
import { verifyPassword } from "@/utils/auth/firebaseAuthAPI";

const getFirebaseAuth = () => {
  const existingApps = getApps();
  const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  return getAuth(app);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  firebaseUser: null,
  isAuthInitializing: true,
  hasInitializedListener: false,
  isEmailSignInLoading: false,
  isEmailSignUpLoading: false,
  isGoogleLoading: false,
  isSignOutLoading: false,
  authErrors: {},

  // Setters para React Query
  setCurrentUser: (user) => set({ currentUser: user }),
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setEmailSignInLoading: (loading) => set({ isEmailSignInLoading: loading }),
  setEmailSignUpLoading: (loading) => set({ isEmailSignUpLoading: loading }),
  setGoogleLoading: (loading) => set({ isGoogleLoading: loading }),
  setSignOutLoading: (loading) => set({ isSignOutLoading: loading }),

  initializeAuthListener: () => {
    const { hasInitializedListener } = get();

    if (hasInitializedListener) {
      return;
    }

    set({ hasInitializedListener: true, isAuthInitializing: true });

    const auth = getFirebaseAuth();

    onAuthStateChanged(auth, async (firebaseUser) => {
      set({ firebaseUser, isAuthInitializing: true });

      if (firebaseUser) {
        try {
          // Get ID token from Firebase
          const idToken = await firebaseUser.getIdToken();
          
          // Verify token with backend and get user profile
          const response = await apiClient.verifyToken(idToken);
          
          if (response.success && response.user) {
            // Token is now managed automatically by the API client via Firebase
            set({ currentUser: response.user, isAuthInitializing: false });
          } else {
            set({ currentUser: null, isAuthInitializing: false });
          }
        } catch (error) {
          console.error("Error verifying token:", error);
          set({ currentUser: null, isAuthInitializing: false });
        }
      } else {
        // User signed out
        set({ currentUser: null, firebaseUser: null, isAuthInitializing: false });
      }
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
      // First, verify password with Firebase Auth REST API
      // This will throw an error if credentials are invalid
      await verifyPassword(email, password);
      
      // If password is valid, get custom token from backend
      const response = await apiClient.login(email, password);
      
      if (!response.success || !response.token) {
        // If backend returns an error, use it 
        const errorCode = response.error || "auth/invalid-credential";
        throw new Error(errorCode);
      }

      // Exchange custom token for ID token
      const idToken = await exchangeCustomTokenForIdToken(response.token);
      
      // Use the user profile from login response, or verify token as fallback
      if (response.user) {
        // Token is now managed automatically by the API client via Firebase
        set({ currentUser: response.user });
      } else {
        // Fallback: verify token to get user profile
        const verifyResponse = await apiClient.verifyToken(idToken);
        
        if (verifyResponse.success && verifyResponse.user) {
          set({ currentUser: verifyResponse.user });
        } else {
          throw new Error(verifyResponse.error || "Failed to verify token");
        }
      }
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        setAuthError("signIn", getReadableSignInError(String(error.code)));
      } else if (error instanceof Error && error.message.includes("auth/")) {
        setAuthError("signIn", getReadableSignInError(error.message));
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
      // Register with backend - backend creates user and returns custom token
      const response = await apiClient.register(email, password, name);
      
      if (!response.success || !response.token || !response.user) {
        throw new Error(response.error || "Failed to register user");
      }

      // Exchange custom token for ID token
      const idToken = await exchangeCustomTokenForIdToken(response.token);
      
      // Token is now managed automatically by the API client via Firebase
      set({ currentUser: response.user });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error) {
        setAuthError("signUp", getReadableSignUpError(String(error.code)));
      } else if (error instanceof Error && error.message.includes("auth/")) {
        setAuthError("signUp", getReadableSignUpError(error.message));
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
      // Authenticate with Google - minimal Firebase usage only for popup
      const { idToken } = await firebaseGoogleAuth();
      
      // Verify token with backend and save profile
      const response = await apiClient.googleAuth(idToken);
      
      if (response.success && response.user) {
        // Token is now managed automatically by the API client via Firebase
        set({ currentUser: response.user });
      } else {
        throw new Error(response.error || "Failed to authenticate with Google");
      }
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
      // Logout from backend
      try {
        await apiClient.logout();
      } catch (error) {
        // Continue with signout even if backend fails
        console.error("Backend logout error:", error);
      }
      
      // Sign out from Firebase (minimal usage)
      await signOutFirebase();
      
      // Clear user state
      set({ currentUser: null, firebaseUser: null });
    } catch (error) {
      setAuthError("signOut", "No fue posible cerrar sesión. Inténtalo de nuevo.");
      throw error;
    } finally {
      set({ isSignOutLoading: false });
    }
  }
}));

