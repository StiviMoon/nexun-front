// components/CreateMeeting/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import MeetingDetails from './MeetingDetails';
import ParticipantsSection from './ParticipantsSection';
import MeetingSummary from './MeetingSummary';
import { MeetingFormData, Participant } from './types';
import { useVideoCall } from '@/app/hooks/useVideoCall';

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

  const [isCreating, setIsCreating] = useState(false);
  const { connect, createRoom, isConnected } = useVideoCall();
  const router = useRouter();

  // Conectar al servicio de video al montar
  useEffect(() => {
    if (!isConnected) {
      connect().catch((err) => {
        console.error('Error conectando:', err);
      });
    }
    
    // NO desconectar al desmontar - dejar la conexión activa para cuando navegues a la sala
    // El cleanup lo manejará la página de la sala si es necesario
  }, [connect, isConnected]);

  const handleChange = (field: keyof MeetingFormData, value: string | Participant[]) => {
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

  const handleCreateMeeting = async () => {
    // Validar título
    if (!formData.title.trim()) {
      alert('Por favor ingresa un título para la reunión');
      return;
    }

    // Validar fecha
    if (!formData.date) {
      alert('Por favor selecciona una fecha para la reunión');
      return;
    }

    // Validar que la fecha sea futura
    const selectedDate = new Date(`${formData.date}T${formData.time || '00:00'}`);
    if (selectedDate < new Date()) {
      alert('La fecha y hora de la reunión deben ser futuras');
      return;
    }

    // Validar hora
    if (!formData.time) {
      alert('Por favor selecciona una hora para la reunión');
      return;
    }

    // Validar duración
    if (!formData.duration || parseInt(formData.duration, 10) < 1) {
      alert('Por favor ingresa una duración válida (mínimo 1 minuto)');
      return;
    }

    if (!isConnected) {
      alert('Conectando al servicio de video... Por favor espera.');
      await connect();
      return;
    }

    setIsCreating(true);

    try {
      // Crear sala de video real (máximo 4 personas, siempre genera código)
      // Crear chat privado asociado automáticamente
      const roomId = await createRoom(
        formData.title,
        formData.description || undefined,
        10, // maxParticipants - máximo 10 personas
        "public", // visibility - siempre pública pero con código
        true // createChat - crear chat privado asociado
      );

      if (!roomId) {
        throw new Error('No se pudo crear la sala');
      }

      // Guardar datos de la reunión en sessionStorage
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

      // Navegar a la sala creada (NO desconectar el socket, mantener la conexión)
      // Esperar un momento para asegurar que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push(`/Sala/${roomId}`);
      // No resetear isCreating aquí porque el componente se desmontará al navegar
    } catch (err) {
      console.error('Error creando reunión:', err);
      alert(`Error al crear la reunión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setIsCreating(false);
    }
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
              <Image
                src={userAvatar}
                alt={userName}
                width={40}
                height={40}
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
              isCreating={isCreating}
              isConnected={isConnected}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMeeting;