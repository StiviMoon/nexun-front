'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import Image from 'next/image';
import { JoinMeetingCard } from '@/components/ui/Reuniones/JoinMeetingCard';
import { ScheduledMeetingsList } from '@/components/ui/Reuniones/ScheduleMeetingList';
import { useMeetings } from '@/hooks/useMeetings';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';
import { useVideoCall } from '@/app/hooks/useVideoCall';
import { MediaStatus, ScheduledMeeting } from '@/types/meetings';
import { AppLayout } from '@/components/ui/AppLayout';

export default function ReunionesPage() {
  const [joiningMeetingId, setJoiningMeetingId] = useState<string | null>(null);
  const { currentUser } = useAuthWithQuery();
  const router = useRouter();
  const { connect, joinRoom, isConnected } = useVideoCall();

  const {
    scheduledMeetings,
    isLoadingScheduled,
    joinMeeting,
    isJoining,
  } = useMeetings();

  // Conectar al servicio de video al montar
  useEffect(() => {
    if (!isConnected) {
      connect().catch(console.error);
    }
  }, [connect, isConnected]);

  const handleJoinWithCode = async (codeOrUrl: string, mediaStatus: MediaStatus) => {
    // Extraer código de la URL si es un enlace completo
    let roomId = codeOrUrl.trim();
    
    // Si está vacío, no hacer nada
    if (!roomId) {
      alert('Por favor ingresa un código de reunión');
      return;
    }
    
    // Si es una URL, extraer el ID de la sala
    if (roomId.includes('/Sala/')) {
      const match = roomId.match(/\/Sala\/([^/?]+)/);
      if (match) {
        roomId = match[1];
      }
    }

    // Si es una URL completa, extraer el último segmento
    if (roomId.includes('http')) {
      try {
        const url = new URL(roomId);
        const pathParts = url.pathname.split('/');
        roomId = pathParts[pathParts.length - 1];
      } catch {
        // Si no es una URL válida, usar el código tal cual
      }
    }

    // Validar que el roomId no esté vacío después de procesar
    if (!roomId || roomId.length === 0) {
      alert('Código de reunión inválido. Por favor verifica el código e intenta nuevamente.');
      return;
    }

    // Validar formato básico (debe tener al menos algunos caracteres)
    if (roomId.length < 3) {
      alert('El código de reunión parece ser demasiado corto. Por favor verifica el código.');
      return;
    }

    console.log(`🚪 [UNIRSE] Intentando unirse a sala con código: ${roomId}`);

    try {
      // Unirse a la sala de video
      if (!isConnected) {
        console.log(`🔌 [UNIRSE] Conectando al servicio de video...`);
        await connect();
      }
      
      console.log(`📥 [UNIRSE] Uniéndose a la sala ${roomId}...`);
      await joinRoom(roomId);
      
      console.log(`✅ [UNIRSE] Unido exitosamente, navegando a la sala...`);
      // Navegar a la sala
      router.push(`/Sala/${roomId}`);
    } catch (err) {
      console.error('❌ [UNIRSE] Error uniéndose a la reunión:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      alert(`Error al unirse a la reunión: ${errorMessage}\n\nPor favor verifica que el código de la reunión sea correcto.`);
    }
  };

  const handleJoinScheduled = (meeting: ScheduledMeeting) => {
    setJoiningMeetingId(meeting.id);

    const codeOrUrl = meeting.meetingUrl || meeting.meetingCode || '';

    joinMeeting(
      {
        codeOrUrl,
        withAudio: false,
        withVideo: false,
      },
      {
        onSettled: () => setJoiningMeetingId(null),
      }
    );
  };

  const userAvatar = currentUser?.photoURL;
  const userName = currentUser?.displayName || 'Usuario';

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-zinc-950">
        <div className="max-w-7xl mx-auto p-6 w-full">
          <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Accede a tus reuniones
        </h1>

        <div className="flex items-center gap-4">
          <button
            className="
              p-2 text-zinc-400 hover:text-white
              hover:bg-zinc-800 rounded-lg transition-colors
            "
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>

          {userAvatar ? (
            <Image
              src={userAvatar}
              alt={userName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full ring-2 ring-zinc-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-400 to-purple-600 ring-2 ring-zinc-700" />
          )}
        </div>
          </header>

          <div className="space-y-8">
        <JoinMeetingCard
          onJoin={handleJoinWithCode}
          isJoining={isJoining && !joiningMeetingId}
        />

        <ScheduledMeetingsList
          meetings={scheduledMeetings}
          onJoinMeeting={handleJoinScheduled}
          isLoading={isLoadingScheduled}
          joiningMeetingId={joiningMeetingId}
        />
        </div>
      </div>
      </div>
    </AppLayout>
  );
}