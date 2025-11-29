import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codeOrUrl, withAudio, withVideo } = body;

    if (!codeOrUrl) {
      return NextResponse.json(
        { error: 'Código o URL de reunión requerido' },
        { status: 400 }
      );
    }

    // Extraer el código de la URL si es una URL completa
    let meetingCode = codeOrUrl;
    if (codeOrUrl.includes('/Sala/')) {
      const parts = codeOrUrl.split('/Sala/');
      meetingCode = parts[parts.length - 1];
    }

    // Construir la URL de la sala
    const roomUrl = `/Sala/${meetingCode}`;

    return NextResponse.json({ roomUrl }, { status: 200 });
  } catch (error) {
    console.error('Error uniéndose a la reunión:', error);
    return NextResponse.json(
      { error: 'Error al unirse a la reunión' },
      { status: 500 }
    );
  }
}

