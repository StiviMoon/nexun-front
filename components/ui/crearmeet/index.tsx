// components/CreateMeeting/index.tsx
'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import MeetingDetails from './MeetingDetails';
import ParticipantsSection from './ParticipantsSection';
import MeetingSummary from './MeetingSummary';
import { MeetingFormData, Participant } from './types';

interface CreateMeetingProps {
  userAvatar?: string;
  userName?: string;
}

const CreateMeeting: React.FC<CreateMeetingProps> = ({ 
  userAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
  userName = 'Usuario'
}) => {
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    duration: '',
    date: '',
    time: '',
    participants: []
  });

  const handleChange = (field: keyof MeetingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddParticipant = (participant: Participant) => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, participant]
    }));
  };

  const handleRemoveParticipant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== id)
    }));
  };

  const handleCreateMeeting = () => {
    console.log('Creando reunión:', formData);
    // Aquí iría la lógica para crear la reunión
    // Por ejemplo: API call, guardar en base de datos, etc.
    alert('¡Reunión creada exitosamente!');
    
    // Opcional: Reset form
    // setFormData({
    //   title: '',
    //   description: '',
    //   duration: '',
    //   date: '',
    //   time: '',
    //   participants: []
    // });
  };

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">
            Programar una Nueva Reunión
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-700">
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Meeting Details */}
          <div>
            <MeetingDetails 
              formData={formData}
              onChange={handleChange}
            />
          </div>

          {/* Right Column - Participants & Summary */}
          <div className="space-y-6">
            <ParticipantsSection
              participants={formData.participants}
              onAddParticipant={handleAddParticipant}
              onRemoveParticipant={handleRemoveParticipant}
            />
            
            <MeetingSummary
              formData={formData}
              onCreateMeeting={handleCreateMeeting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMeeting;