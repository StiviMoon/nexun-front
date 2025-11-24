"use client";

import React from 'react';
import Profile from '@/components/ui/Profile';
import { AppLayout } from '@/components/ui/AppLayout';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';
import { useUpdateProfile, useUpdatePassword } from '@/hooks/useAuthApi';
import { ProfileFormData } from '@/components/ui/Profile/types';

const PerfilPage: React.FC = () => {
  const { currentUser, signOutUser, isSignOutLoading, setCurrentUser } = useAuthWithQuery();
  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();

  const providerIds = currentUser?.providerIds || [];
  const isThirdPartyUser = providerIds.some((provider) => provider === "google.com" || provider === "github.com");

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!currentUser) return;
    
    if (isThirdPartyUser) {
      throw new Error('Los usuarios que inician con Google o GitHub no pueden editar su información desde Nexun.');
    }

    try {
      const updateData: {
        firstName?: string;
        lastName?: string;
        age?: number;
        displayName?: string;
      } = {};

      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.age !== undefined) updateData.age = data.age;
      
      // Construir displayName si no se proporciona
      if (!data.displayName && (data.firstName || data.lastName)) {
        const parts = [];
        if (data.firstName) parts.push(data.firstName);
        if (data.lastName) parts.push(data.lastName);
        updateData.displayName = parts.join(' ');
      } else if (data.displayName) {
        updateData.displayName = data.displayName;
      }

      const updatedUser = await updateProfileMutation.mutateAsync(updateData);
      setCurrentUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return;
    
    if (isThirdPartyUser) {
      throw new Error('Los usuarios que inician con Google o GitHub administran su contraseña en el proveedor.');
    }
    
    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
    } catch (error) {
      throw error;
    }
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
        isUpdateLoading={updateProfileMutation.isPending}
        isPasswordLoading={updatePasswordMutation.isPending}
      />
    </AppLayout>
  );
};

export default PerfilPage;
