"use client";

import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import { AppLayout } from "@/components/ui/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import Dashboard from "@/components/ui/Dashboard";

const DashboardPage = () => {
  const { currentUser } = useAuthWithQuery();

  if (!currentUser) {
    return null;
  }

  const userName = currentUser.displayName || currentUser.email || "Usuario";
  const userAvatar = currentUser.photoURL;

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-zinc-950">
        {/* Header unificado */}
        <PageHeader
          title={`Bienvenido, ${userName.split(" ")[0]}`}
          
        />

        {/* Contenido principal - Solo acciones rápidas */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
            <Dashboard
              userName={userName}
              userAvatar={userAvatar || undefined}
              recentMeetings={[]}
              upcomingMeetings={[]}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
