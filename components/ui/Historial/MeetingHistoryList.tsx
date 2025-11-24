'use client';

import { MeetingHistory } from '@/types/meetings';
import { MeetingHistoryItem } from './MeetingHistoryItem';
import { History, Loader2, SearchX } from 'lucide-react';

interface MeetingHistoryListProps {
  /** Array of meeting history items to display */
  meetings: MeetingHistory[];
  /** Indicates if the history is currently loading */
  isLoading?: boolean;
  /** Indicates if a search is active but returned no results */
  isSearching?: boolean;
  /** Optional callback when a meeting item is clicked */
  onMeetingClick?: (meeting: MeetingHistory) => void;
}

/**
 * MeetingHistoryList
 * -----------------
 * Renders a list of previous meetings with states for loading, empty, and search results.
 */
export function MeetingHistoryList({
  meetings,
  isLoading = false,
  isSearching = false,
  onMeetingClick,
}: MeetingHistoryListProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-white text-base font-normal">
        Reuniones anteriores
      </h2>

      {isLoading ? (
        <LoadingState />
      ) : meetings.length === 0 ? (
        isSearching ? <NoResultsState /> : <EmptyState />
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingHistoryItem
              key={meeting.id}
              meeting={meeting}
              onClick={onMeetingClick}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * LoadingState
 * ------------
 * Displays a loader while the meeting history is being fetched.
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16 text-zinc-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm">Cargando historial...</span>
    </div>
  );
}

/**
 * EmptyState
 * ----------
 * Displays a placeholder when there are no previous meetings.
 */
function EmptyState() {
  return (
    <div
      className="
        flex flex-col items-center justify-center py-16
        bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl
      "
    >
      <History className="w-10 h-10 text-zinc-700 mb-3" />
      <p className="text-zinc-500 text-sm">No tienes reuniones anteriores</p>
      <p className="text-zinc-600 text-xs mt-1">
        Las reuniones completadas aparecerán aquí
      </p>
    </div>
  );
}

/**
 * NoResultsState
 * --------------
 * Displays a placeholder when a search returns no results.
 */
function NoResultsState() {
  return (
    <div
      className="
        flex flex-col items-center justify-center py-16
        bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl
      "
    >
      <SearchX className="w-10 h-10 text-zinc-700 mb-3" />
      <p className="text-zinc-500 text-sm">No se encontraron resultados</p>
      <p className="text-zinc-600 text-xs mt-1">
        Intenta con otro término de búsqueda
      </p>
    </div>
  );
}
