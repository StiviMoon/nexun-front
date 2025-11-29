// components/Profile/Security.tsx
'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface SecurityProps {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
  isProviderLocked?: boolean;
}

const Security: React.FC<SecurityProps> = ({ onChangePassword, isLoading, isProviderLocked = false }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await onChangePassword(formData.currentPassword, formData.newPassword);
      // Limpiar formulario en caso de éxito
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Error al cambiar la contraseña');
    }
  };

  const handleCancel = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Icon and Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-4">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Cambiar contraseña</h2>
      </div>

      {/* Form Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
        {isProviderLocked && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ Los usuarios que se autentican con Google o GitHub administran su contraseña desde ese proveedor.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contraseña actual */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="********"
                required
                disabled={isProviderLocked}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isProviderLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="********"
                required
                disabled={isProviderLocked}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isProviderLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Esta contraseña debe contener mínimo 6 caracteres, un símbolo especial, un número y una mayúscula
            </p>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="ejemplo@gmail.com"
                required
                disabled={isProviderLocked}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isProviderLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Separator Line */}
          <div className="border-t border-zinc-700 my-6"></div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading || isProviderLocked}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Cambiando contraseña...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Security;