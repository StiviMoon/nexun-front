"use client";

import React from 'react';
import Profile from '@/components/ui/Profile';
import { AppLayout } from '@/components/ui/AppLayout';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';
import { useUpdateProfile, useUpdatePassword } from '@/hooks/useAuthApi';
import { ProfileFormData } from '@/components/ui/Profile/types';

/**
 * PerfilPage component
 *
 * Renders the user profile page, allowing authenticated users to:
 * - View their profile information
 * - Update profile details (name, age, display name)
 * - Change password (if not a Google-authenticated user)
 * - Sign out from the application
 * - Delete account (placeholder implementation)
 *
 * component
 * returns {JSX.Element} The rendered profile page or authentication prompt if not signed in
 */
const PerfilPage: React.FC = () => {
  const { currentUser, signOutUser, isSignOutLoading, setCurrentUser } = useAuthWithQuery();
  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();

  /**
   * Handles updating the user's profile information.
   * Throws an error if the user is authenticated via Google.
   *
   * param {ProfileFormData} data - The profile form data to update
   * throws Will throw an error if the user is a Google-authenticated user
   */
  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!currentUser) return;
    
    const isGoogleUser = currentUser.providerIds?.includes('google.com') || false;
    if (isGoogleUser) {
      throw new Error('Los usuarios de Google no pueden editar su información de perfil.');
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

  /**
   * Handles changing the user's password.
   * Throws an error if the user is authenticated via Google.
   *
   * param {string} currentPassword - The current password
   * param {string} newPassword - The new password to set
   * throws Will throw an error if the user is a Google-authenticated user
   */
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return;
    
    const isGoogleUser = currentUser.providerIds?.includes('google.com') || false;
    if (isGoogleUser) {
      throw new Error('Los usuarios de Google no pueden cambiar su contraseña.');
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

  /**
   * Placeholder handler for deleting the user account.
   * Currently logs to console and resolves immediately.
   *
   * returns {Promise<void>}
   */
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
