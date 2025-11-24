'use client';

import React from 'react';
import { Plus, Link2 } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  icon: 'plus' | 'link';
  onClick: () => void;
}

/**
 * QuickActionCard component represents a clickable card for a quick action.
 * 
 * param {QuickActionCardProps} props - Props for the QuickActionCard component
 * param {string} props.title - Title displayed on the card
 * param {'plus' | 'link'} props.icon - Icon type to display (plus or link)
 * param {() => void} props.onClick - Click handler for the card
 * returns {JSX.Element} Rendered QuickActionCard component
 */
const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, icon, onClick }) => {
  const Icon = icon === 'plus' ? Plus : Link2;

  return (
    <button
      onClick={onClick}
      className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col items-center justify-center gap-3 sm:gap-4 h-full min-h-[140px] sm:min-h-[180px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
      aria-label={title}
    >
      {/* Icon Container */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-cyan-500/10 transition-all">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-300 group-hover:text-cyan-400 transition-colors" strokeWidth={1.5} aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="text-white font-medium text-center text-sm sm:text-base group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </button>
  );
};

export default QuickActionCard;
