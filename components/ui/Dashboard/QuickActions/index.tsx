// components/Dashboard/QuickActions/index.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import QuickActionCard from './QuickActionCard';
import RecentMeetingsSection from './RecentMeetingsSection';
import { QuickActionsProps } from '../types';

const QuickActions: React.FC<QuickActionsProps> = ({ actions, recentMeetings }) => {
  const router = useRouter();

  return (
    <div className="mb-8 sm:mb-10 lg:mb-12">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Acciones Rápidas</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {/* Quick Action Cards */}
        {actions.map((action) => (
          <QuickActionCard
            key={action.id}
            title={action.title}
            icon={action.icon}
            onClick={action.onClick}
          />
        ))}

        {/* Recent Meetings Section */}
        <RecentMeetingsSection 
          meetings={recentMeetings}
          onMeetingClick={(meetingId) => {
            router.push(`/Sala/${meetingId}`);
          }}
        />
      </div>
    </div>
  );
};

export default QuickActions;