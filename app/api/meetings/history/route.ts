import { NextResponse } from 'next/server';
import { MeetingHistory } from '@/types/meetings';

// Esta ruta devuelve el historial de reuniones
// Por ahora, como las reuniones se guardan en sessionStorage (cliente),
// devolvemos un array vacío. En el futuro, esto debería consultar Firestore
export async function GET() {
  try {
    // TODO: Implementar consulta a Firestore para obtener historial de reuniones
    // Por ahora, devolvemos un array vacío para evitar el error 404
    const history: MeetingHistory[] = [];
    
    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo historial de reuniones:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial de reuniones' },
      { status: 500 }
    );
  }
}

