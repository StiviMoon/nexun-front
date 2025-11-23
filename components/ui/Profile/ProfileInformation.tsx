
'use client';

import React from 'react';
import { ProfileInformationProps } from './types';

const ProfileInformation: React.FC<ProfileInformationProps> = ({ 
  user, 
  onSignOut, 
  isSignOutLoading 
}) => {
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">Información personal</h2>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 lg:w-1/3">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-purple-500/50">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                  {getInitials(user.displayName)}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Max 2MB, JPG/PNG</p>
            </div>
          </div>

          {/* User Info Fields (igual que EditProfile) */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={user.displayName || ''}
                  disabled
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>

              {/* Apellidos - Campo vacío por ahora */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Apellidos</label>
                <input
                  type="text"
                  value="No especificado"
                  disabled
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-gray-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Correo electrónico</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                />
              </div>

              {/* Edad - Campo vacío por ahora */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Edad</label>
                <input
                  type="text"
                  value="No especificado"
                  disabled
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-6">
          <button
            className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-all"
          >
            Editar perfil
          </button>
          <button
            onClick={onSignOut}
            disabled={isSignOutLoading}
            className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSignOutLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileInformation;