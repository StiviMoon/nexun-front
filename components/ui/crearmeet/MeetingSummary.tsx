'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { MeetingSummaryProps } from './types';

/**
 * MeetingSummary Component
 *
 * Displays a summary of the meeting before creation, including:
 * - Title
 * - Description
 * - Date
 * - Time
 * - Duration
 * - Participants (avatars)
 *
 * Also provides a button to trigger the creation of the meeting.
 *
 * param {MeetingSummaryProps} props - Component props
 * param {import('./types').MeetingFormData} props.formData - The current meeting form data
 * param {() => void} props.onCreateMeeting - Callback to create the meeting
 * returns {JSX.Element} Meeting summary display with create button
 */
const MeetingSummary: React.FC<MeetingSummaryProps> = ({ formData, onCreateMeeting }) => {
  /**
   * Format a date string into localized string.
   * param {string} dateString - ISO date string
   * returns {string} Formatted date or fallback
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).toUpperCase();
  };

  /**
   * Format a time string or return fallback.
   * param {string} timeString - Time string
   * returns {string} Formatted time or fallback
   */
  const formatTime = (timeString: string) => {
    if (!timeString) return 'No especificada';
    return timeString;
  };

  /**
   * Check if the meeting form is valid for creation.
   * returns {boolean} True if form is valid
   */
  const isFormValid = () => {
    return formData.title.trim() !== '' &&
           formData.description.trim() !== '' &&
           formData.duration.trim() !== '' &&
           formData.date !== '' &&
           formData.time !== '';
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Resumen de la reunión</h2>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Título:</p>
          <p className="text-white font-medium">
            {formData.title || 'Sin título'}
          </p>
        </div>

        {/* Description */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Descripción:</p>
          <p className="text-white">
            {formData.description || 'Sin descripción'}
          </p>
        </div>

        {/* Date */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Fecha:</p>
            <p className="text-white font-medium">{formatDate(formData.date)}</p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Hora:</p>
            <p className="text-white font-medium">{formatTime(formData.time)}</p>
          </div>
        </div>

        {/* Duration */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Duración:</p>
          <p className="text-white font-medium">
            {formData.duration ? `${formData.duration} Minutos` : 'No especificada'}
          </p>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {formData.participants.slice(0, 3).map((participant, index) => (
              <div
                key={participant.id}
                className="w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden"
                style={{ zIndex: formData.participants.length - index }}
              >
                {participant.avatar ? (
                  <img
                    src={participant.avatar}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {formData.participants.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-700 flex items-center justify-center text-white text-xs font-bold">
                +{formData.participants.length - 3}
              </div>
            )}
          </div>
          {formData.participants.length === 0 && (
            <p className="text-gray-500 text-sm">Sin participantes</p>
          )}
        </div>
      </div>

      {/* Create Button */}
      <button
        onClick={onCreateMeeting}
        disabled={!isFormValid()}
        className={`
          w-full mt-6 py-3 rounded-lg font-semibold text-white transition-all
          ${isFormValid()
            ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 shadow-lg shadow-cyan-500/20'
            : 'bg-zinc-800 cursor-not-allowed opacity-50'
          }
        `}
      >
        Crear Reunión
      </button>
    </div>
  );
};

export default MeetingSummary;
