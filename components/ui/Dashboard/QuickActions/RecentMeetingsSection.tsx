'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { RecentMeeting } from '../types';

interface RecentMeetingsSectionProps {
  meetings: RecentMeeting[];
  onMeetingClick?: (meetingId: string) => void;
}

/**
 * RecentMeetingsSection component displays recent meetings as avatars.
 * Shows a placeholder if no meetings exist.
 * 
 * param {RecentMeetingsSectionProps} props - Props for RecentMeetingsSection
 * param {RecentMeeting[]} props.meetings - Array of recent meetings
 * param {(meetingId: string) => void} [props.onMeetingClick] - Optional click handler for a meeting
 * returns {JSX.Element} Rendered RecentMeetingsSection component
 */
const RecentMeetingsSection: React.FC<RecentMeetingsSectionProps> = ({
  meetings,
  onMeetingClick
}) => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all h-full min-h-[180px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-white font-medium">Recientes</h3>
        <Clock className="w-6 h-6 text-purple-300" />
      </div>

      {/* Recent Meetings Avatars or placeholder when empty */}
      <div className="flex items-center gap-3">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-start">
            <p className="text-sm text-gray-400 mb-2">No hay reuniones recientes</p>
            <div className="flex items-center gap-2">
              {/* Placeholder skeleton avatars */}
              <div className="w-14 h-14 rounded-full bg-zinc-800 animate-pulse" />
              <div className="w-14 h-14 rounded-full bg-zinc-800 animate-pulse" />
              <div className="w-14 h-14 rounded-full bg-zinc-800 animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {meetings.slice(0, 3).map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => onMeetingClick?.(meeting.meetingId)}
                className="group relative flex flex-col items-center gap-2 transition-transform hover:scale-105"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-cyan-500 transition-all">
                  {meeting.creatorAvatar ? (
                    <img
                      src={meeting.creatorAvatar}
                      alt={meeting.creatorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {meeting.creatorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name Label */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 truncate max-w-[60px]">
                    {meeting.creatorName.split(' ')[0]} {meeting.creatorName.split(' ')[1]?.charAt(0)}.
                  </p>
                </div>
              </button>
            ))}

            {/* Show more indicator if there are more than 3 meetings */}
            {meetings.length > 3 && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-all cursor-pointer">
                  <span className="text-sm font-bold">+{meetings.length - 3}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Más</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecentMeetingsSection;
