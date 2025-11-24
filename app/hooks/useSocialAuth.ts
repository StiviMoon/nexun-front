"use client";

import { useRouter } from "next/navigation";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

type UseSocialAuthOptions = {
  isLoading: boolean;
  otherLoading: boolean;
};

/**
 * Custom hook to handle social authentication (Google Sign-In) logic.
 * Prevents multiple simultaneous sign-in attempts and redirects the user on success.
 *
 * param {UseSocialAuthOptions} options - Loading state flags to prevent duplicate actions.
 * returns {{ handleGoogleSignIn: () => Promise<void> }} - Function to trigger Google sign-in.
 */
const useSocialAuth = ({ isLoading, otherLoading }: UseSocialAuthOptions) => {
  const router = useRouter();
  const { signInWithGoogle } = useAuthWithQuery();

  /**
   * Initiates Google sign-in process.
   * Prevents execution if either loading flag is true.
   * Redirects user to /dashboard upon successful authentication.
   */
  const handleGoogleSignIn = async () => {
    if (isLoading || otherLoading) {
      return;
    }

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch {
      // Error handling is managed by the auth store
    }
  };

  return {
    handleGoogleSignIn
  };
};

export default useSocialAuth;
