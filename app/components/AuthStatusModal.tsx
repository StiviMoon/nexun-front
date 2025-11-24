/**
 * ===========================================
 * AUTH STATUS MODAL
 * ===========================================
 *
 * A modal component that displays authentication status feedback to the user.
 * It handles multiple async authentication states and ensures a minimum display time
 * to avoid flickering for fast operations.
 *
 * Features:
 * - Displays loading states for email sign-in, email sign-up, Google auth, and sign-out.
 * - Uses a minimum display duration to prevent flickering.
 * - Animates the modal appearance/disappearance.
 * - Fully accessible: uses aria-live for assertive announcements and sr-only for titles/descriptions.
 * - Works only in client-side rendering.
 *
 * Internal Logic:
 * - Uses `useAuthWithQuery` hook to track auth operations.
 * - Calculates modal content based on current loading/pending states.
 * - Ensures cleanup of timeouts and animation frames to prevent memory leaks.
 * - Automatically hides the modal after minimum display time.
 *
 * Usage:
 * ```tsx
 * <AuthStatusModal />
 * ```
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";

type ModalContent = {
  title: string;
  description: string;
};

const MIN_DISPLAY_TIME = 1000;

const AuthStatusModal = () => {
  const [isMounted] = useState(() => typeof window !== "undefined");
  const { 
    isEmailSignInLoading, 
    isEmailSignUpLoading, 
    isGoogleLoading, 
    isSignOutLoading,
    isLoginPending,
    isRegisterPending,
    isGoogleAuthPending,
    isLogoutPending
  } = useAuthWithQuery();
  const [displayContent, setDisplayContent] = useState<ModalContent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const interactionStartRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const modalContent = useMemo<ModalContent | null>(() => {
    if (isSignOutLoading || isLogoutPending) {
      return {
        title: "Cerrando sesión...",
        description: "Estamos finalizando tu sesión de manera segura."
      };
    }

    if (isEmailSignUpLoading || isRegisterPending) {
      return {
        title: "Creando tu cuenta...",
        description: "Estamos preparando todo para que puedas comenzar."
      };
    }

    if (isEmailSignInLoading || isGoogleLoading || isLoginPending || isGoogleAuthPending) {
      return {
        title: "Iniciando sesión...",
        description: "Estamos preparando tu espacio personalizado."
      };
    }

    return null;
  }, [
    isEmailSignInLoading, 
    isEmailSignUpLoading, 
    isGoogleLoading, 
    isSignOutLoading,
    isLoginPending,
    isRegisterPending,
    isGoogleAuthPending,
    isLogoutPending
  ]);

  const cleanup = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(
    (delay: number) => {
      cleanup();
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setDisplayContent(null);
        interactionStartRef.current = null;
      }, delay);
    },
    [cleanup]
  );

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    cleanup();

    if (modalContent) {
      animationFrameRef.current = requestAnimationFrame(() => {
        interactionStartRef.current = Date.now();
        setDisplayContent(modalContent);
        setIsVisible(true);
      });
      return cleanup;
    }

    if (displayContent) {
      const elapsed = Date.now() - (interactionStartRef.current ?? Date.now());
      const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);
      scheduleHide(remaining);
    }

    return cleanup;
  }, [modalContent, displayContent, isMounted, cleanup, scheduleHide]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (!isMounted || !displayContent) {
    return null;
  }

  return (
    <Dialog open={isVisible} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-xs rounded-xl border border-border/60 bg-background/95 p-6 text-center shadow-xl backdrop-blur transition-shadow"
        aria-live="assertive"
      >
        <DialogTitle className="sr-only">{displayContent.title}</DialogTitle>
        <DialogDescription className="sr-only">{displayContent.description}</DialogDescription>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
          <div className="relative h-12 w-12">
            <span className="absolute inset-0 rounded-full border border-border/60" />
            <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary border-b-primary/50" />
            <span className="absolute inset-[18%] rounded-full bg-muted" />
          </div>
        </div>
        <h2 className="text-base font-semibold text-foreground">{displayContent.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{displayContent.description}</p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthStatusModal;
