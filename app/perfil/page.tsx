"use client";

import React from 'react';
import Profile from '@/components/ui/Profile';
import { AppLayout } from '@/components/ui/AppLayout';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';

const PerfilPage: React.FC = () => {
  const { currentUser, signOutUser, isSignOutLoading } = useAuthWithQuery();

  const handleUpdateProfile = async (data: any) => {
    console.log('update profile', data);
    return Promise.resolve();
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    console.log('change password', currentPassword, newPassword);
    return Promise.resolve();
  };

  const handleDeleteAccount = async () => {
    console.log('delete account');
    return Promise.resolve();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <p>No estás autenticado.</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <Profile
        user={currentUser}
        onSignOut={signOutUser}
        onUpdateProfile={handleUpdateProfile}
        onChangePassword={handleChangePassword}
        onDeleteAccount={handleDeleteAccount}
        isSignOutLoading={isSignOutLoading}
      />
    </AppLayout>
  );
};

export default PerfilPage;
