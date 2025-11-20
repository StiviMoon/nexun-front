"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAuthAction } from "@/app/hooks/useAuth";
import CreateMeeting from '@/components/ui/crearmeet';
import Navbar from '@/components/ui/NavBar/Navbar';

export default function CrearReunionPage() {
  const router = useRouter();
  const { currentUser, isAuthInitializing } = useAuth();
  const clearAuthError = useAuthAction((state) => state.clearAuthError);

  useEffect(() => {
    clearAuthError("signOut");
  }, [clearAuthError]);

  useEffect(() => {
    if (!isAuthInitializing && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, isAuthInitializing, router]);

  // Loading state
  if (isAuthInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex items-center gap-3 text-gray-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
          Cargando...
        </div>
      </main>
    );
  }

  // No user logged in
  if (!currentUser) {
    return null;
  }

  // Extraer datos del usuario de Firebase
  const userName = currentUser.displayName || 'Usuario';
  const userAvatar = currentUser.photoURL || undefined;

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar con Navbar - Igual que en Dashboard */}
      <Navbar />
      
      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        <CreateMeeting 
          userName={userName}
          userAvatar={userAvatar}
        />
      </div>
    </div>
  );
}