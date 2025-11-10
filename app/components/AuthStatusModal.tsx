"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/app/hooks/useAuth";

type ModalContent = {
  title: string;
  description: string;
};

const AuthStatusModal = () => {
  const { isEmailSignInLoading, isEmailSignUpLoading, isGoogleLoading, isSignOutLoading } = useAuth();
  const [displayContent, setDisplayContent] = useState<ModalContent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const interactionStartRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const modalContent = useMemo(() => {
    if (isSignOutLoading) {
      return {
        title: "Cerrando sesión...",
        description: "Estamos finalizando tu sesión de manera segura."
      };
    }

    if (isEmailSignUpLoading) {
      return {
        title: "Creando tu cuenta...",
        description: "Estamos preparando todo para que puedas comenzar."
      };
    }

    if (isEmailSignInLoading || isGoogleLoading) {
      return {
        title: "Iniciando sesión...",
        description: "Estamos preparando tu espacio personalizado."
      };
    }

    return null;
  }, [isEmailSignInLoading, isEmailSignUpLoading, isGoogleLoading, isSignOutLoading]);

  useEffect(() => {
    const scheduleHide = (delay: number) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setDisplayContent(null);
        interactionStartRef.current = null;
        hideTimeoutRef.current = null;
      }, delay);
    };

    if (modalContent) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        interactionStartRef.current = Date.now();
        setDisplayContent(modalContent);
        setIsVisible(true);
      });

      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const elapsed = Date.now() - (interactionStartRef.current ?? Date.now());
    const remaining = Math.max(0, 1000 - elapsed);

    if (!displayContent) {
      scheduleHide(remaining);
      return;
    }

    scheduleHide(remaining);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [displayContent, modalContent]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!displayContent) {
    return null;
  }

  return (
    <Dialog open={isVisible} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-xs border border-border/80 bg-background/95 p-6 text-center shadow-2xl backdrop-blur"
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

