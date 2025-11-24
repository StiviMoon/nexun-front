
'use client';

import React from 'react';
import { ProfileHeaderProps, ProfileTab } from './types';

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'information', label: 'Información' },
    { id: 'edit', label: 'Editar perfil' },
    { id: 'security', label: 'Seguridad' },
    { id: 'delete', label: 'Eliminar perfil' }
  ];

  return (
    <div className="border-b border-zinc-800 mb-8">
      <div className="flex gap-8 justify-center mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              pb-4 px-2 text-sm font-medium transition-all relative
              ${activeTab === tab.id 
                ? 'text-white' 
                : 'text-gray-400 hover:text-gray-300'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileHeader;