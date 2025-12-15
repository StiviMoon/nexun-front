// components/Profile/DeleteAccount.tsx
'use client';

import React, { useState } from 'react';
import { Trash2, Eye, EyeOff } from 'lucide-react';

interface DeleteAccountProps {
  onDelete: (password?: string) => Promise<void>;
  isLoading: boolean;
  isThirdPartyUser?: boolean;
}

const DeleteAccount: React.FC<DeleteAccountProps> = ({ onDelete, isLoading, isThirdPartyUser = false }) => {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleDelete = async () => {
    setError('');

    if (confirmText.toUpperCase() !== 'ELIMINAR') {
      setError('Debes escribir "ELIMINAR" exactamente para confirmar');
      return;
    }

    // Solo validar contraseña si NO es usuario de terceros
    if (!isThirdPartyUser && !password.trim()) {
      setError('Debes ingresar tu contraseña');
      return;
    }

    try {
      // Pasar contraseña solo si no es usuario de terceros
      await onDelete(isThirdPartyUser ? undefined : password);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(isThirdPartyUser 
          ? 'Error al eliminar la cuenta. Inténtalo de nuevo.' 
          : 'Error al eliminar la cuenta. Verifica tu contraseña.');
      }
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    setPassword('');
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">Eliminar perfil</h2>

      {/* Warning Card */}
      <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 border-2 border-red-600/50 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <Trash2 className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-semibold text-red-500 mb-2">Zona de peligro</h3>
            <p className="text-gray-300 text-sm">
              Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor asegúrate de esto.
            </p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
        <div className="mb-6">
          <p className="text-white font-medium mb-4">Al eliminar tu cuenta:</p>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>Se borrarán todos tus datos personales.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>Perderás acceso a tus reuniones, historias y demás funciones.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>Esta acción no se puede deshacer.</span>
            </li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <p className="text-white text-sm mb-3">
            Para confirmar, escribe &quot;ELIMINAR&quot; en mayúsculas:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all uppercase"
          />
        </div>

        {/* Password Input - Solo para usuarios con email/password */}
        {!isThirdPartyUser && (
          <div className="mb-6">
            <p className="text-white text-sm mb-3">
              Ingresa tu contraseña
            </p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        {/* Info para usuarios de terceros */}
        {isThirdPartyUser && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              <strong>Nota:</strong> Como iniciaste sesión con un proveedor externo (Google o GitHub), 
              no se requiere contraseña para eliminar tu cuenta. Solo confirma escribiendo "ELIMINAR".
            </p>
          </div>
        )}

        {/* Separator Line */}
        <div className="border-t border-zinc-700 my-6"></div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
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
            type="button"
            onClick={handleDelete}
            disabled={
              isLoading || 
              confirmText.toUpperCase() !== 'ELIMINAR' || 
              (!isThirdPartyUser && !password.trim())
            }
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar Perfil'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;