import React from 'react';
import MeetingLeftClient from '@/components/ui/Recuperar2Client';

export default function NuevaContrasenaPage() {
  return (
    <React.Suspense fallback={null}>
      <MeetingLeftClient />
    </React.Suspense>
  );
}