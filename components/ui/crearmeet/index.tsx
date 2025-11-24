'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import MeetingDetails from './MeetingDetails';
import ParticipantsSection from './ParticipantsSection';
import MeetingSummary from './MeetingSummary';
import { MeetingFormData, Participant } from './types';

/**
 * Props for CreateMeeting component
 */
interface CreateMeetingProps {
  /** URL of the user's avatar */
  userAvatar?: string;
  /** Display name of the user */
  userName?: string;
}

/**
 * CreateMeeting Component
 *
 * This component allows users to schedule a new meeting. It includes:
 * - Meeting details input (title, description, date, time, duration)
 * - Participant management (add/remove participants)
 * - Meeting summary and creation
 *
 * param {CreateMeetingProps} props - Component props
 * returns {JSX.Element} A page section for creating a new meeting
 */
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

  /**
   * Updates a specific field in the meeting form data
   * param {keyof MeetingFormData} field - Field to update
   * param {any} value - New value for the field
   */
  const handleChange = (field: keyof MeetingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Adds a participant to the meeting
   * param {Participant} participant - Participant to add
   */
  const handleAddParticipant = (participant: Participant) => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, participant]
    }));
  };

  /**
   * Removes a participant from the meeting by id
   * param {string} id - Participant ID to remove
   */
  const handleRemoveParticipant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== id)
    }));
  };

  const router = useRouter();

  /**
   * Handles creation of the meeting.
   * Saves the meeting in sessionStorage and navigates to the meeting room.
   */
  const handleCreateMeeting = () => {
    console.log('Creando reunión:', formData);
    const roomId = typeof crypto !== 'undefined' && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2, 10);

    // Store meeting temporarily in sessionStorage
    try {
      const payload = {
        id: roomId,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        participants: formData.participants,
      };
      sessionStorage.setItem(`meeting:${roomId}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('No se pudo guardar meeting en sessionStorage', e);
    }

    // TODO: Call backend API to create meeting and get real ID
    router.push(`/Sala/${roomId}`);
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
