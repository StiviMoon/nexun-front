/**
 * Firebase Auth REST API utilities
 * Used to verify passwords without full Firebase Client SDK
 */

import { FIREBASE_API_KEY } from "@/config/firebase";

const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

export interface FirebaseAuthError {
  error: {
    code: number;
    message: string;
    errors?: Array<{ message: string; domain: string; reason: string }>;
  };
}

export interface FirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered: boolean;
}

/**
 * Verify email and password using Firebase Auth REST API
 * This allows us to verify passwords without keeping full Firebase Client SDK
 */
export const verifyPassword = async (
  email: string,
  password: string
): Promise<FirebaseAuthResponse> => {
  try {
    const response = await fetch(FIREBASE_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as FirebaseAuthError;
      const errorMessage = error.error?.message || "Failed to verify password";
      
      // Map Firebase REST API errors to Firebase Client SDK error codes
      if (errorMessage.includes("INVALID_PASSWORD") || errorMessage.includes("INVALID_EMAIL")) {
        throw new Error("auth/invalid-credential");
      }
      if (errorMessage.includes("EMAIL_NOT_FOUND")) {
        throw new Error("auth/user-not-found");
      }
      if (errorMessage.includes("USER_DISABLED")) {
        throw new Error("auth/user-disabled");
      }
      if (errorMessage.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
        throw new Error("auth/too-many-requests");
      }
      if (errorMessage.includes("INVALID_LOGIN_CREDENTIALS")) {
        throw new Error("auth/invalid-credential");
      }
      
      // Default error
      throw new Error("auth/invalid-credential");
    }

    return data as FirebaseAuthResponse;
  } catch (error) {
    // Re-throw if already mapped error
    if (error instanceof Error && error.message.startsWith("auth/")) {
      throw error;
    }
    // Network or other errors
    throw new Error("auth/invalid-credential");
  }
};

