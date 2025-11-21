// components/Dashboard/QuickActions/index.tsx
'use client';

import React from 'react';
import QuickActionCard from './QuickActionCard';
import RecentMeetingsSection from './RecentMeetingsSection';
import { QuickActionsProps } from '../types';

const QuickActions: React.FC<QuickActionsProps> = ({ actions, recentMeetings }) => {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold text-white mb-6">Acciones Rápidas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            console.log('Navigating to meeting:', meetingId);
            // Aquí puedes agregar la navegación a la reunión
          }}
        />
      </div>
    </div>
  );
};

export default QuickActions;