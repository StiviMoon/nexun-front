'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import Image from 'next/image';
import { JoinMeetingCard } from '@/components/ui/Reuniones/JoinMeetingCard';
import { ScheduledMeetingsList } from '@/components/ui/Reuniones/ScheduleMeetingList';
import { useMeetings } from '@/hooks/useMeetings';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';
import { MediaStatus, ScheduledMeeting } from '@/types/meetings';
import { AppLayout } from '@/components/ui/AppLayout';

/**
 * ReunionesPage component renders the main meetings page for users.
 * It includes functionality to join a meeting by code or URL and
 * displays a list of scheduled meetings.
 *
 * component
 * returns {JSX.Element} The meetings page UI
 */
export default function ReunionesPage() {
  const [joiningMeetingId, setJoiningMeetingId] = useState<string | null>(null);
  const { currentUser } = useAuthWithQuery();

  const {
    scheduledMeetings,
    isLoadingScheduled,
    joinMeeting,
    isJoining,
  } = useMeetings();

  /**
   * Handles joining a meeting by code or URL with specified media status
   * param {string} codeOrUrl - The meeting code or URL
   * param {MediaStatus} mediaStatus - Object specifying audio/video status
   */
  const handleJoinWithCode = (codeOrUrl: string, mediaStatus: MediaStatus) => {
    joinMeeting({
      codeOrUrl,
      withAudio: mediaStatus.micEnabled,
      withVideo: mediaStatus.cameraEnabled,
    });
  };

  /**
   * Handles joining a scheduled meeting
   * param {ScheduledMeeting} meeting - The scheduled meeting to join
   */
  const handleJoinScheduled = (meeting: ScheduledMeeting) => {
    setJoiningMeetingId(meeting.id);

    const codeOrUrl = meeting.meetingUrl || meeting.meetingCode || '';

    joinMeeting(
      {
        codeOrUrl,
        withAudio: false,
        withVideo: false,
      },
      {
        onSettled: () => setJoiningMeetingId(null),
      }
    );
  };

  const userAvatar = currentUser?.photoURL;
  const userName = currentUser?.displayName || 'Usuario';

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-zinc-950">
        <div className="max-w-7xl mx-auto p-6 w-full">
          <header className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-white">
              Accede a tus reuniones
            </h1>

            <div className="flex items-center gap-4">
              {/* Notifications Button */}
              <button
                className="
                  p-2 text-zinc-400 hover:text-white
                  hover:bg-zinc-800 rounded-lg transition-colors
                "
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* User Avatar */}
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

          <div className="space-y-8">
            {/* Join Meeting Card */}
            <JoinMeetingCard
              onJoin={handleJoinWithCode}
              isJoining={isJoining && !joiningMeetingId}
            />

            {/* Scheduled Meetings List */}
            <ScheduledMeetingsList
              meetings={scheduledMeetings}
              onJoinMeeting={handleJoinScheduled}
              isLoading={isLoadingScheduled}
              joiningMeetingId={joiningMeetingId}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
