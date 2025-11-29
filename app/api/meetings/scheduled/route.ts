import { NextResponse } from 'next/server';
import { ScheduledMeeting } from '@/types/meetings';

// Esta ruta devuelve las reuniones programadas
// Por ahora, como las reuniones se guardan en sessionStorage (cliente),
// devolvemos un array vacío. En el futuro, esto debería consultar Firestore
export async function GET() {
  try {
    // TODO: Implementar consulta a Firestore para obtener reuniones programadas
    // Por ahora, devolvemos un array vacío para evitar el error 404
    const scheduledMeetings: ScheduledMeeting[] = [];
    
    return NextResponse.json(scheduledMeetings, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo reuniones programadas:', error);
    return NextResponse.json(
      { error: 'Error al obtener reuniones programadas' },
      { status: 500 }
    );
  }
}

