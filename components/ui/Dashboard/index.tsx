// components/Dashboard/index.tsx
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
        // router.push('/reunion-rapida');
      }
    },
    {
      id: 'join-code',
      title: 'Unirse Con Código',
      icon: 'link',
      onClick: () => {
        console.log('Unirse con código...');
        // router.push('/unirse');
      }
    }
  ];

  const handleNotificationClick = () => {
    console.log('Notificaciones clickeadas');
    // Aquí puedes abrir un modal o navegar a notificaciones
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
    </div>
  );
};

export default Dashboard;