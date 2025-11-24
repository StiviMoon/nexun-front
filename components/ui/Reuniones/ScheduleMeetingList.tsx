'use client';

import { ScheduledMeeting } from '@/types/meetings';
import { ScheduledMeetingItem } from './ScheduleMeetingItem';
import { Calendar, Loader2 } from 'lucide-react';

interface ScheduledMeetingsListProps {
  /**
   * Array of scheduled meetings to display.
   */
  meetings: ScheduledMeeting[];

  /**
   * Callback function when a meeting is joined.
   * Receives the meeting object as parameter.
   */
  onJoinMeeting: (meeting: ScheduledMeeting) => void;

  /**
   * Whether the meetings list is loading.
   * Defaults to false.
   */
  isLoading?: boolean;

  /**
   * The ID of the meeting currently being joined.
   */
  joiningMeetingId?: string | null;
}

/**
 * Displays a list of scheduled meetings with join buttons.
 * Handles loading and empty states.
 *
 * param {ScheduledMeetingsListProps} props
 * returns JSX.Element
 */
export function ScheduledMeetingsList({
  meetings,
  onJoinMeeting,
  isLoading = false,
  joiningMeetingId = null,
}: ScheduledMeetingsListProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-white text-base font-normal">
        Reuniones programadas
      </h2>

      {isLoading ? (
        <LoadingState />
      ) : meetings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <ScheduledMeetingItem
              key={meeting.id}
              meeting={meeting}
              onJoin={onJoinMeeting}
              isJoining={joiningMeetingId === meeting.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Loading skeleton / spinner for meetings list */
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16 text-zinc-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm">Cargando reuniones...</span>
    </div>
  );
}

/** Empty state UI when there are no scheduled meetings */
function EmptyState() {
  return (
    <div
      className="
        flex flex-col items-center justify-center py-16
        bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl
      "
    >
      <Calendar className="w-10 h-10 text-zinc-700 mb-3" />
      <p className="text-zinc-500 text-sm">No tienes reuniones programadas</p>
      <p className="text-zinc-600 text-xs mt-1">
        Las reuniones aparecerán aquí cuando las programes
      </p>
    </div>
  );
}
