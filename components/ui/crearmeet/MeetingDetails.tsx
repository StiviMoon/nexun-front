// components/CreateMeeting/MeetingDetails.tsx
'use client';

import React from 'react';
import { Calendar, Clock, Settings } from 'lucide-react';
import { MeetingDetailsProps } from './types';

const MeetingDetails: React.FC<MeetingDetailsProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white mb-6">Detalles de la reunión</h2>

      {/* Título */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Título <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            // Limitar longitud del título
            const value = e.target.value.slice(0, 100);
            onChange('title', value);
          }}
          placeholder="Escriba el título de la reunión"
          maxLength={100}
          required
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.title.length}/100 caracteres
        </p>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => {
            // Limitar longitud de la descripción
            const value = e.target.value.slice(0, 500);
            onChange('description', value);
          }}
          placeholder="Escriba una descripción de la reunión"
          rows={4}
          maxLength={500}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.description.length}/500 caracteres
        </p>
      </div>

      {/* Duración */}
      <div>
        <label className="block text-white text-sm font-medium mb-2 flex items-center gap-2">
          Duración
          <Settings className="w-4 h-4 text-purple-400" />
        </label>
        <input
          type="number"
          min="1"
          max="1440"
          step="1"
          value={formData.duration}
          onChange={(e) => {
            const value = e.target.value;
            // Solo permitir números enteros positivos
            if (value === '' || /^\d+$/.test(value)) {
              const numValue = parseInt(value, 10);
              // Validar que esté en el rango válido (1-1440 minutos = 24 horas)
              if (value === '' || (numValue >= 1 && numValue <= 1440)) {
                onChange('duration', value);
              }
            }
          }}
          onKeyDown={(e) => {
            // Prevenir teclas que no sean números, backspace, delete, tab, arrow keys
            if (!/[0-9]/.test(e.key) && 
                !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) &&
                !(e.ctrlKey || e.metaKey) && // Permitir Ctrl+A, Ctrl+C, etc.
                !e.key.startsWith('F')) { // Permitir teclas de función
              e.preventDefault();
            }
          }}
          placeholder="Minutos (1-1440)"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {formData.duration && (
          <p className="text-xs text-gray-400 mt-1">
            {parseInt(formData.duration, 10) >= 60 
              ? `Aproximadamente ${Math.floor(parseInt(formData.duration, 10) / 60)} hora(s) y ${parseInt(formData.duration, 10) % 60} minuto(s)`
              : `${formData.duration} minuto(s)`
            }
          </p>
        )}
      </div>

      {/* Fecha y Hora */}
      <div className="grid grid-cols-2 gap-4">
        {/* Fecha */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Fecha <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => onChange('date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none"
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {formData.date && (() => {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            return selectedDate < today;
          })() && (
            <p className="text-xs text-red-400 mt-1">La fecha debe ser futura</p>
          )}
        </div>

        {/* Hora */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Hora <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="time"
              value={formData.time}
              onChange={(e) => onChange('time', e.target.value)}
              required
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