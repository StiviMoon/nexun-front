'use client';

import React from 'react';
import { Calendar, Clock, Settings } from 'lucide-react';
import { MeetingDetailsProps } from './types';

/**
 * MeetingDetails Component
 *
 * Renders a form for entering meeting details including:
 * - Title
 * - Description
 * - Duration
 * - Date and Time
 *
 * param {MeetingDetailsProps} props - Component props
 * param {import('./types').MeetingFormData} props.formData - Current form data for the meeting
 * param {(field: keyof import('./types').MeetingFormData, value: any) => void} props.onChange - Handler to update form fields
 * returns {JSX.Element} Meeting details input form
 */
const MeetingDetails: React.FC<MeetingDetailsProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white mb-6">Detalles de la reunión</h2>

      {/* Title */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Título
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Escriba el título de la reunión"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Escriba una descripción de la reunión"
          rows={4}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-white text-sm font-medium mb-2 flex items-center gap-2">
          Duración
          <Settings className="w-4 h-4 text-purple-400" />
        </label>
        <input
          type="text"
          value={formData.duration}
          onChange={(e) => onChange('duration', e.target.value)}
          placeholder="Minutos"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Fecha
          </label>
          <div className="relative">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => onChange('date', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none"
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Hora
          </label>
          <div className="relative">
            <input
              type="time"
              value={formData.time}
              onChange={(e) => onChange('time', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none"
            />
            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetails;
