/**
 * ===========================================
 * CREAR REUNION PAGE
 * ===========================================
 *
 * Page component for creating a new meeting.
 * 
 * Features:
 * - Retrieves the currently authenticated user using `useAuthWithQuery`.
 * - Extracts user display name, email, and avatar for passing to the `CreateMeeting` component.
 * - Wraps content with `AppLayout` to provide consistent application layout.
 * - Handles client-side rendering; returns `null` if no user is authenticated.
 * - Supports scrolling and flexible layout for responsive design.
 *
 * Usage:
 * ```tsx
 * <CrearReunionPage />
 * ```
 */

"use client";

import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import CreateMeeting from '@/components/ui/crearmeet';
import { AppLayout } from '@/components/ui/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CrearReunionPage() {
  const { currentUser } = useAuthWithQuery();

  // Do not render if no authenticated user is found
  if (!currentUser) {
    return null;
  }

  const userName = currentUser.displayName || currentUser.email || 'Usuario';
  const userAvatar = currentUser.photoURL || undefined;

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-black">
        {/* Header unificado */}
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
