/**
 * ===========================================
 * HISTORIAL DE REUNIONES PAGE
 * ===========================================
 *
 * Page component that displays the user's meeting history.
 *
 * Features:
 * - Retrieves the currently authenticated user via `useAuthWithQuery`.
 * - Uses `useMeetingHistory` hook to fetch, search, and filter meetings.
 * - Displays a search input for filtering meetings by title or participant.
 * - Renders a list of meetings using `MeetingHistoryList`.
 * - Handles user interactions with meetings via `onMeetingClick`.
 * - Displays user's avatar or a fallback gradient avatar if not available.
 * - Provides a notification button placeholder.
 * - Wrapped in `AppLayout` for consistent layout and responsive padding.
 * - Fully responsive and supports dark mode.
 *
 * Usage:
 * ```tsx
 * <HistorialPage />
 * ```
 */

'use client';

import { Bell } from 'lucide-react';
import Image from 'next/image';
import { SearchInput } from '@/components/ui/Historial/SearchInput';
import { MeetingHistoryList } from '@/components/ui/Historial/MeetingHistoryList';
import { useMeetingHistory } from '@/hooks/useMeetingHistory';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';
import { MeetingHistory } from '@/types/meetings';
import { AppLayout } from '@/components/ui/AppLayout';

export default function HistorialPage() {
  const { currentUser } = useAuthWithQuery();

  const { meetings, isLoading, searchQuery, setSearchQuery } = useMeetingHistory();

  const handleMeetingClick = (meeting: MeetingHistory) => {
    // Aquí puedes abrir un modal con detalles, navegar, etc.
    console.log('Meeting clicked:', meeting);
  };

  const userAvatar = currentUser?.photoURL;
  const userName = currentUser?.displayName || 'Usuario';

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-zinc-950">
        <div className="max-w-7xl mx-auto p-6 w-full">
          {/* Page Header */}
          <header className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-white">
              Historial de reuniones
            </h1>

            <div className="flex items-center gap-4">
              <button
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
              </button>

              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full ring-2 ring-zinc-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 ring-2 ring-zinc-700" />
              )}
            </div>
          </header>

          {/* Content */}
          <div className="space-y-8">
            {/* Search */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por título o participante..."
            />

            {/* History List */}
            <MeetingHistoryList
              meetings={meetings}
              isLoading={isLoading}
              isSearching={searchQuery.trim().length > 0}
              onMeetingClick={handleMeetingClick}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
