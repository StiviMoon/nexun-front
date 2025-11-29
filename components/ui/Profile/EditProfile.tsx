// components/Profile/EditProfile.tsx
'use client';

import React, { useState } from 'react';
import { EditProfileProps } from './types';

const EditProfile: React.FC<EditProfileProps> = ({ user, onUpdate, isLoading, isProviderLocked = false }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    displayName: user.displayName || '',
    email: user.email || '',
    age: user.age?.toString() || '',
    photoURL: user.photoURL || ''
  });

  const [previewImage, setPreviewImage] = useState(user.photoURL || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageNumber = formData.age ? parseInt(formData.age, 10) : undefined;
    // Validación de edad: debe ser >= 15 y <= 150, no puede ser 0
    if (ageNumber !== undefined) {
      if (isNaN(ageNumber) || ageNumber < 15 || ageNumber > 150 || ageNumber === 0) {
        alert('La edad debe ser mayor de 14 años y no puede ser 0');
        return;
      }
    }
    await onUpdate({
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      age: ageNumber,
      displayName: formData.displayName || undefined,
      email: formData.email,
      photoURL: formData.photoURL || undefined
    });
  };

  const handleChange = (field: string, value: string) => {
    // Prevenir números negativos y validar edad mínima en el campo de edad
    if (field === 'age') {
      const numValue = parseInt(value, 10);
      // Permitir campo vacío o números válidos (>= 0)
      if (value === "" || (!isNaN(numValue) && numValue >= 0)) {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Actualizar preview de imagen si cambia photoURL
    if (field === 'photoURL') {
      setPreviewImage(value);
    }
  };

  const handleCancel = () => {
    // Resetear formulario a valores originales
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: user.displayName || '',
      email: user.email || '',
      age: user.age?.toString() || '',
      photoURL: user.photoURL || ''
    });
    setPreviewImage(user.photoURL || '');
  };

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
      <h2 className="text-2xl font-bold text-white mb-8 text-center">
        Editar Información personal
      </h2>

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Avatar Section - Lado Izquierdo */}
          <div className="flex flex-col items-center gap-4 lg:w-1/3">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-purple-500/50">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setPreviewImage('')}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                  {getInitials(formData.displayName)}
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400">Max 2MB, JPG/PNG</p>
            </div>

            <button
              type="button"
              className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-all translate-y-3.5"
            >
              Cambiar Foto
            </button>
          </div>

          {/* Form Fields - Lado Derecho */}
          <div className="flex-1 space-y-6">
            {isProviderLocked && (
              <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Los usuarios que se autentican con Google o GitHub no pueden editar su información de perfil desde Nexun.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="John"
                  disabled={isProviderLocked}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Doe"
                  disabled={isProviderLocked}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Correo electrónico - Solo lectura */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
                />
              </div>

              {/* Edad */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Edad
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Prevenir números negativos
                    if (value === "" || (parseInt(value, 10) >= 0 && !isNaN(parseInt(value, 10)))) {
                      handleChange('age', value);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevenir que se escriba el signo negativo
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="25"
                  min="15"
                  max="150"
                  disabled={isProviderLocked}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-2">
                  La edad debe ser mayor de 14 años (mínimo 15)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;