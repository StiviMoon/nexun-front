/**
 * ===========================================
 * DASHBOARD PAGE
 * ===========================================
 *
 * Page component that displays the user's dashboard.
 *
 * Features:
 * - Retrieves the currently authenticated user using `useAuthWithQuery`.
 * - Extracts user's display name, email, and avatar for passing to child components.
 * - Wraps content with `AppLayout` to provide consistent application layout.
 * - Uses `PageHeader` to display a personalized welcome message.
 * - Renders the `Dashboard` component for user actions, including recent and upcoming meetings.
 * - Handles client-side rendering; returns `null` if no user is authenticated.
 * - Provides flexible scrolling and responsive padding for content.
 *
 * Usage:
 * ```tsx
 * <DashboardPage />
 * ```
 */

"use client";

import { useAuthWithQuery } from "@/hooks/useAuthWithQuery";
import { AppLayout } from "@/components/ui/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import Dashboard from "@/components/ui/Dashboard";

const DashboardPage = () => {
  const { currentUser } = useAuthWithQuery();

  // Do not render if no authenticated user is found
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
