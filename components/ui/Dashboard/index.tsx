'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from './DashboardHeader';
import QuickActions from './QuickActions';
import UpcomingMeetings from './UpcomingMeetings';
import { QuickAction, RecentMeeting, Meeting } from './types';

interface DashboardProps {
  userName: string;
  userAvatar?: string;
  recentMeetings?: RecentMeeting[];
  upcomingMeetings?: Meeting[];
}

/**
 * Dashboard component combines user header, quick actions, and upcoming meetings.
 *
 * param {DashboardProps} props - Props for Dashboard
 * param {string} props.userName - Name of the current user
 * param {string} [props.userAvatar] - Optional URL of user avatar
 * param {RecentMeeting[]} [props.recentMeetings] - Optional list of recent meetings
 * param {Meeting[]} [props.upcomingMeetings] - Optional list of upcoming meetings
 * returns {JSX.Element} Rendered Dashboard component
 */
const Dashboard: React.FC<DashboardProps> = ({
  userName,
  userAvatar,
  recentMeetings = [],
  upcomingMeetings = []
}) => {
  const router = useRouter();

  // Quick Actions Configuration
  const quickActions: QuickAction[] = [
    {
      id: 'quick-meeting',
      title: 'Reunión Rápida',
      icon: 'plus',
      onClick: () => {
        console.log('Iniciando reunión rápida...');
        // router.push('/reunion-rapida'); // Navigate to quick meeting page
      }
    },
    {
      id: 'join-code',
      title: 'Unirse Con Código',
      icon: 'link',
      onClick: () => {
        console.log('Unirse con código...');
        // router.push('/unirse'); // Navigate to join meeting page
      }
    }
  ];

  const handleNotificationClick = () => {
    console.log('Notificaciones clickeadas');
    // Trigger notifications modal or navigate to notifications
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <DashboardHeader
        userName={userName}
        userAvatar={userAvatar}
        onNotificationClick={handleNotificationClick}
      />

      {/* Quick Actions */}
      <QuickActions
        actions={quickActions}
        recentMeetings={recentMeetings}
      />

      {/* Upcoming Meetings */}
      <UpcomingMeetings meetings={upcomingMeetings} />
    </div>
  );
};

export default Dashboard;
