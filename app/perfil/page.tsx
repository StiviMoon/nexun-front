"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Profile from '@/components/ui/Profile';
import { AppLayout } from '@/components/ui/AppLayout';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';
import { useUpdateProfile, useUpdatePassword, useDeleteAccount } from '@/hooks/useAuthApi';
import { ProfileFormData } from '@/components/ui/Profile/types';
import { verifyPassword } from '@/utils/auth/firebaseAuthAPI';

const PerfilPage: React.FC = () => {
  const router = useRouter();
  const { currentUser, signOutUser, isSignOutLoading, setCurrentUser } = useAuthWithQuery();
  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();
  const deleteAccountMutation = useDeleteAccount();

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

  const handleDeleteAccount = async (password?: string) => {
    if (!currentUser?.email) {
      throw new Error('No se pudo obtener la información del usuario');
    }

    // Solo validar contraseña si NO es usuario de terceros y se proporciona contraseña
    if (!isThirdPartyUser && password) {
      try {
        await verifyPassword(currentUser.email, password);
      } catch (error) {
        if (error instanceof Error && error.message.includes('auth/invalid-credential')) {
          throw new Error('Contraseña incorrecta. Por favor, verifica tu contraseña.');
        }
        throw new Error('Error al verificar la contraseña. Inténtalo de nuevo.');
      }
    }

    // Proceder a eliminar la cuenta
    try {
      await deleteAccountMutation.mutateAsync(password);
      
      // Cerrar sesión y redirigir
      try {
        await signOutUser();
      } catch {
        // Continuar incluso si el logout falla
      }
      
      // Redirigir a la página de inicio
      router.push('/inicio');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al eliminar la cuenta. Inténtalo de nuevo.');
    }
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
        isDeleteLoading={deleteAccountMutation.isPending}
      />
    </AppLayout>
  );
};

export default PerfilPage;
