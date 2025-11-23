
'use client';

import React, { useState } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileInformation from './ProfileInformation';
import EditProfile from './EditProfile';
import Security from './Security';
import DeleteAccount from './DeleteAccount';
import { ProfileTab, ProfileFormData } from './types';
import { UserProfile } from '@/types/api';

interface ProfileProps {
  user: UserProfile;
  onSignOut: () => Promise<void>;
  onUpdateProfile: (data: ProfileFormData) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  isSignOutLoading?: boolean;
  isUpdateLoading?: boolean;
  isPasswordLoading?: boolean;
  isDeleteLoading?: boolean;
}

const Profile: React.FC<ProfileProps> = ({
  user,
  onSignOut,
  onUpdateProfile,
  onChangePassword,
  onDeleteAccount,
  isSignOutLoading = false,
  isUpdateLoading = false,
  isPasswordLoading = false,
  isDeleteLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('information');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'information':
        return (
          <ProfileInformation
            user={user}
            onSignOut={onSignOut}
            isSignOutLoading={isSignOutLoading}
          />
        );
      case 'edit':
        return (
          <EditProfile
            user={user}
            onUpdate={onUpdateProfile}
            isLoading={isUpdateLoading}
          />
        );
      case 'security':
        return (
          <Security
            onChangePassword={onChangePassword}
            isLoading={isPasswordLoading}
          />
        );
      case 'delete':
        return (
          <DeleteAccount
            onDelete={onDeleteAccount}
            isLoading={isDeleteLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto ">
        {/* Tabs Header */}
        <ProfileHeader activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-12">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;