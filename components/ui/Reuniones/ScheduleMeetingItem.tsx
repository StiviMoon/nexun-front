'use client';

import { ScheduledMeeting } from '@/types/meetings';
import { formatMeetingDate, formatMeetingTime } from '@/utils/meet/dataFormatters';

interface ScheduledMeetingItemProps {
  /**
   * The meeting object to display.
   */
  meeting: ScheduledMeeting;

  /**
   * Callback function when the user clicks "Join".
   * Receives the meeting object as a parameter.
   */
  onJoin: (meeting: ScheduledMeeting) => void;

  /**
   * Whether the join action is currently in progress.
   * Defaults to false.
   */
  isJoining?: boolean;
}

/**
 * Displays a scheduled meeting item with title, date, time, and a "Join" button.
 *
 * param {ScheduledMeetingItemProps} props
 * returns JSX.Element
 */
export function ScheduledMeetingItem({
  meeting,
  onJoin,
  isJoining = false,
}: ScheduledMeetingItemProps) {
  const canJoin = meeting.status === 'scheduled' || meeting.status === 'in-progress';

  return (
    <div
      className="
        flex items-center justify-between
        bg-zinc-900/50 border border-zinc-800 rounded-2xl
        p-4 sm:p-5
        hover:border-zinc-700 transition-colors
      "
    >
      <div className="space-y-1 min-w-0 flex-1">
        <h3 className="text-white font-medium truncate pr-4">
          {meeting.title}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 text-sm text-zinc-500">
          <span>Fecha: {formatMeetingDate(meeting.date)}</span>
          <span>Hora: {formatMeetingTime(meeting.date)}</span>
        </div>
      </div>

      <button
        onClick={() => onJoin(meeting)}
        disabled={!canJoin || isJoining}
        className="
          px-5 py-2.5 bg-purple-600 hover:bg-purple-500
          text-white text-sm font-medium rounded-xl
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors shrink-0 ml-4 min-w-[90px]
        "
      >
        {isJoining ? 'Uniendo...' : 'Unirse'}
      </button>
    </div>
  );
}
