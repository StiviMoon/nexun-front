import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInWithPopup, GoogleAuthProvider, Auth, User } from "firebase/auth";
import { firebaseConfig } from "@/config/firebase";

// Initialize Firebase only if not already initialized
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
};

const getFirebaseAuth = (): Auth => {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
};

/**
 * Exchange custom token for ID token
 */
export const exchangeCustomTokenForIdToken = async (customToken: string): Promise<string> => {
  try {
    const firebaseAuth = getFirebaseAuth();
    const userCredential = await signInWithCustomToken(firebaseAuth, customToken);
    const idToken = await userCredential.user.getIdToken();
    return idToken;
  } catch {
    throw new Error("Failed to exchange custom token for ID token");
  }
};

/**
 * Authenticate with Google and get ID token
 */
export const signInWithGoogle = async (): Promise<{ idToken: string; user: User }> => {
  try {
    const firebaseAuth = getFirebaseAuth();
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    
    const userCredential = await signInWithPopup(firebaseAuth, googleProvider);
    const idToken = await userCredential.user.getIdToken();
    
    return {
      idToken,
      user: userCredential.user
    };
  } catch {
    throw new Error("Failed to authenticate with Google");
  }
};

/**
 * Sign out from Firebase
 */
export const signOutFirebase = async (): Promise<void> => {
  try {
    const firebaseAuth = getFirebaseAuth();
    await firebaseAuth.signOut();
  } catch {
    // Ignore errors on sign out
  }
};

