"use client";

import { useRouter } from "next/navigation";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

type UseSocialAuthOptions = {
  isLoading: boolean;
  otherLoading: boolean;
};

const useSocialAuth = ({ isLoading, otherLoading }: UseSocialAuthOptions) => {
  const router = useRouter();
  const { signInWithGoogle } = useAuthWithQuery();

  const handleGoogleSignIn = async () => {
    if (isLoading || otherLoading) {
      return;
    }

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch {
      // Error handling is done in the auth store
    }
  };

  return {
    handleGoogleSignIn
  };
};

export default useSocialAuth;

