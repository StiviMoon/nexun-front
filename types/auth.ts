import { User } from "firebase/auth";
import { UserProfile } from "./api";

export type AuthErrorKey = "signIn" | "signUp" | "google" | "signOut";

export type AuthErrors = Partial<Record<AuthErrorKey, string>>;

export type AuthState = {
  currentUser: UserProfile | null;
  firebaseUser: User | null; // Minimal Firebase user, only for auth state
  isAuthInitializing: boolean;
  hasInitializedListener: boolean;
  isEmailSignInLoading: boolean;
  isEmailSignUpLoading: boolean;
  isGoogleLoading: boolean;
  isSignOutLoading: boolean;
  authErrors: AuthErrors;
  initializeAuthListener: () => void;
  setAuthError: (key: AuthErrorKey, message: string) => void;
  clearAuthError: (key: AuthErrorKey) => void;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  registerWithEmailPassword: (firstName: string, lastName: string, email: string, password: string, age: number) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  // Setters para React Query
  setCurrentUser: (user: UserProfile | null) => void;
  setFirebaseUser: (user: User | null) => void;
  setEmailSignInLoading: (loading: boolean) => void;
  setEmailSignUpLoading: (loading: boolean) => void;
  setGoogleLoading: (loading: boolean) => void;
  setSignOutLoading: (loading: boolean) => void;
};

export type AuthActionState = Pick<
  AuthState,
  | "setAuthError"
  | "clearAuthError"
  | "signInWithEmailPassword"
  | "registerWithEmailPassword"
  | "signInWithGoogle"
  | "signOutUser"
>;
