import { initializeApp, getApps, FirebaseApp, FirebaseError } from "firebase/app";
import { getAuth, signInWithCustomToken, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, Auth, User } from "firebase/auth";
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
 * Authenticate with GitHub and get ID token
 */
export const signInWithGithub = async (): Promise<{ idToken: string; user: User }> => {
  try {
    console.log("Firebase GitHub Auth - Initializing provider");
    const firebaseAuth = getFirebaseAuth();
    const githubProvider = new GithubAuthProvider();
    githubProvider.addScope("user:email");

    console.log("Firebase GitHub Auth - Opening popup");
    const userCredential = await signInWithPopup(firebaseAuth, githubProvider);
    console.log("Firebase GitHub Auth - Popup resolved for UID:", userCredential.user.uid);

    const idToken = await userCredential.user.getIdToken();
    console.log("Firebase GitHub Auth - Obtained ID token with length:", idToken.length);

    return {
      idToken,
      user: userCredential.user
    };
  } catch (error) {
    console.error("Firebase GitHub Auth - Popup failed:", error);
    if (error instanceof FirebaseError) {
      throw error;
    }
    throw new Error("Failed to authenticate with GitHub");
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

