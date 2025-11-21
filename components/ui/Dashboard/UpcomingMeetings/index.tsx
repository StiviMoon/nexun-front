// components/Dashboard/UpcomingMeetings/index.tsx
'use client';

import React from 'react';
import MeetingCard from './MeetingCard';
import { UpcomingMeetingsProps } from '../types';

const UpcomingMeetings: React.FC<UpcomingMeetingsProps> = ({ meetings }) => {
  const upcomingMeetings = meetings.filter(m => m.status === 'upcoming');

  if (upcomingMeetings.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-6">Próximas Reuniones</h2>
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-gray-500">No tienes reuniones próximas programadas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold text-white mb-6">Próximas Reuniones</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingMeetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            onEnter={(meetingId) => {
              console.log('Entering meeting:', meetingId);
              // Aquí puedes agregar la lógica para entrar a la reunión
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default UpcomingMeetings;