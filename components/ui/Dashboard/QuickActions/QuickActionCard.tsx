// components/Dashboard/QuickActions/QuickActionCard.tsx
'use client';

import React from 'react';
import { Plus, Link2 } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  icon: 'plus' | 'link';
  onClick: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, icon, onClick }) => {
  const Icon = icon === 'plus' ? Plus : Link2;

  return (
    <button
      onClick={onClick}
      className="group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col items-center justify-center gap-4 h-full min-h-[180px]"
    >
      {/* Icon Container */}
      <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-cyan-500/10 transition-all">
        <Icon className="w-10 h-10 text-purple-300 group-hover:text-cyan-400 transition-colors" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-white font-medium text-center group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </button>
  );
};

export default QuickActionCard;