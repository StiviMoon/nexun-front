"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAuthAction } from "@/app/hooks/useAuth";
import Dashboard from '@/components/ui/Dashboard';
import Navbar from "@/components/ui/NavBar/Navbar";

const DashboardPage = () => {
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
          Cargando tu panel...
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

  // Datos de ejemplo - estos vendrían de tu API/BD
  const recentMeetings = [
    {
      id: '1',
      creatorName: 'Juan Pérez',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan',
      meetingId: 'meet-123',
      createdAt: new Date()
    },
    {
      id: '2',
      creatorName: 'María García',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
      meetingId: 'meet-456',
      createdAt: new Date()
    },
    {
      id: '3',
      creatorName: 'Carlos López',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
      meetingId: 'meet-789',
      createdAt: new Date()
    }
  ];

  const upcomingMeetings = [
    {
      id: 'meet-1',
      title: 'Presentación de equipo de trabajo',
      date: '2025-11-18',
      time: '10:00 AM',
      status: 'upcoming' as const
    },
    {
      id: 'meet-2',
      title: 'Revisión Sprint #2 - MP.3',
      date: '2025-12-01',
      time: '06:00 AM',
      status: 'upcoming' as const
    }
  ];

  return (
    <div className ="flex h-screen">
    <Navbar />
    <div className="flex-1">
    <Dashboard
      userName={userName}
      userAvatar={userAvatar}
      recentMeetings={recentMeetings}
      upcomingMeetings={upcomingMeetings}
    />
  </div> 
  </div>
  );
  
};

export default DashboardPage;