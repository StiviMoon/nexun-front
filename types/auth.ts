import { User } from "firebase/auth";

export type AuthErrorKey = "signIn" | "signUp" | "google" | "signOut";

export type AuthErrors = Partial<Record<AuthErrorKey, string>>;

export type AuthState = {
  currentUser: User | null;
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
  registerWithEmailPassword: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
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
