'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Meeting } from '../types';

interface MeetingCardProps {
  meeting: Meeting;
  onEnter: (meetingId: string) => void;
}

/**
 * MeetingCard Component
 * --------------------
 * Displays a single meeting with its title, date, and time.
 * Provides a button to enter the meeting.
 *
 * param {MeetingCardProps} props - Component props
 * param {Meeting} props.meeting - Meeting data object
 * param {(meetingId: string) => void} props.onEnter - Callback when "Enter" button is clicked
 */
const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onEnter }) => {
  /**
   * Format date string to localized Spanish format (DD MMM YYYY)
   * param {string} dateString - ISO date string
   * returns {string} Formatted date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
      {/* Meeting Title */}
      <h3 className="text-white font-semibold text-lg mb-4">
        {meeting.title}
      </h3>

      {/* Meeting Info */}
      <div className="space-y-3 mb-6">
        {/* Date */}
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>Fecha: {formatDate(meeting.date)}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>Hora: {meeting.time}</span>
        </div>
      </div>

      {/* Enter Button */}
      <button
        onClick={() => onEnter(meeting.id)}
        className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-all shadow-lg shadow-cyan-500/20"
      >
        Entrar
      </button>
    </div>
  );
};

export default MeetingCard;
