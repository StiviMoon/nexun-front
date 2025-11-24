'use client';

import React from 'react';
import QuickActionCard from './QuickActionCard';
import RecentMeetingsSection from './RecentMeetingsSection';
import { QuickActionsProps } from '../types';

/**
 * QuickActions component displays a set of quick action cards
 * and a section for recent meetings.
 * 
 * param {QuickActionsProps} props - Props for QuickActions component
 * param {Array} props.actions - Array of action objects with id, title, icon, and onClick
 * param {Array} props.recentMeetings - Array of recent meeting objects
 * returns {JSX.Element} The rendered QuickActions component
 */
const QuickActions: React.FC<QuickActionsProps> = ({ actions, recentMeetings }) => {
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
            console.log('Navigating to meeting:', meetingId);
            // Navigation logic to the meeting can be added here
          }}
        />
      </div>
    </div>
  );
};

export default QuickActions;
