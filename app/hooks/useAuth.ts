"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/utils/authStore";

export const useAuth = () => {
  const initializeAuthListener = useAuthStore((state) => state.initializeAuthListener);

  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  const currentUser = useAuthStore((state) => state.currentUser);
  const isAuthInitializing = useAuthStore((state) => state.isAuthInitializing);
  const authErrors = useAuthStore((state) => state.authErrors);
  const isEmailSignInLoading = useAuthStore((state) => state.isEmailSignInLoading);
  const isEmailSignUpLoading = useAuthStore((state) => state.isEmailSignUpLoading);
  const isGoogleLoading = useAuthStore((state) => state.isGoogleLoading);
  const isSignOutLoading = useAuthStore((state) => state.isSignOutLoading);

  return {
    currentUser,
    isAuthInitializing,
    authErrors,
    isEmailSignInLoading,
    isEmailSignUpLoading,
    isGoogleLoading,
    isSignOutLoading
  };
};

type AuthStoreState = ReturnType<typeof useAuthStore.getState>;

export const useAuthAction = <T>(selector: (state: AuthStoreState) => T) => {
  return useAuthStore(selector);
};

