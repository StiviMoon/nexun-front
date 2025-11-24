'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { DashboardHeaderProps } from './types';

/**
 * DashboardHeader component displays the greeting and user info at the top of the dashboard.
 * Includes a notification bell and user avatar.
 *
 * param {DashboardHeaderProps} props - Props for DashboardHeader
 * param {string} props.userName - Name of the current user
 * param {string} [props.userAvatar] - Optional URL for user avatar
 * param {() => void} [props.onNotificationClick] - Optional handler when notification bell is clicked
 * returns {JSX.Element} Rendered DashboardHeader component
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  userAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  onNotificationClick
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Bienvenido, {userName}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={onNotificationClick}
          className="relative p-2 text-gray-400 hover:text-white transition-colors"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
        </button>

        {/* User Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-cyan-500 transition-all cursor-pointer">
          <img
            src={userAvatar}
            alt={userName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
