"use client";

import { useRouter } from "next/navigation";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

type UseSocialAuthOptions = {
  isGoogleLoading: boolean;
  isGithubLoading: boolean;
  isBlocking: boolean;
};

const useSocialAuth = ({ isGoogleLoading, isGithubLoading, isBlocking }: UseSocialAuthOptions) => {
  const router = useRouter();
  const { signInWithGoogle, signInWithGithub } = useAuthWithQuery();

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isBlocking) {
      return;
    }

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch {
      // handled by store
    }
  };

  const handleGithubSignIn = async () => {
    if (isGithubLoading || isBlocking) {
      return;
    }

    try {
      await signInWithGithub();
      router.push("/dashboard");
    } catch {
      // Error handling is done in the auth store
    }
  };

  return {
    handleGoogleSignIn,
    handleGithubSignIn
  };
};

export default useSocialAuth;

