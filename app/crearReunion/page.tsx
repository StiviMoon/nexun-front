"use client";

import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import CreateMeeting from '@/components/ui/crearmeet';
import { AppLayout } from '@/components/ui/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CrearReunionPage() {
  const { currentUser } = useAuthWithQuery();

  if (!currentUser) {
    return null;
  }

  const userName = currentUser.displayName || currentUser.email || 'Usuario';
  const userAvatar = currentUser.photoURL || undefined;

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-black">
        {/* Header unificado */}
        <PageHeader
          title="Crear Reunión"
          subtitle="Configura una nueva reunión para tu equipo"
        />
        
        <div className="flex-1 overflow-auto">
          <CreateMeeting 
            userName={userName}
            userAvatar={userAvatar}
          />
        </div>
      </div>
    </AppLayout>
  );
}