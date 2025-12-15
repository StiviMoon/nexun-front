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
        router.push('/crearReunion');
      }
    },
    {
      id: 'join-code',
      title: 'Unirse Con Código',
      icon: 'link',
      onClick: () => {
        router.push('/UnirseReu');
      }
    }
  ];

  const handleNotificationClick = () => {
    console.log('Notificaciones clickeadas');
    // Aquí puedes abrir un modal o navegar a notificaciones
  };

  return (
    <div className="space-y-6">
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