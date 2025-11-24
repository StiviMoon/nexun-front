import React from 'react';
import MeetingLeftClient from '@/components/ui/Recuperar2Client';

/**
 * NuevaContrasenaPage component
 *
 * This page renders the component responsible for setting a new password
 * inside a React Suspense boundary. The fallback is set to null while the
 * component is loading.
 *
 * component
 * returns {JSX.Element} The rendered new password page
 */
export default function NuevaContrasenaPage() {
  return (
    <React.Suspense fallback={null}>
      <MeetingLeftClient />
    </React.Suspense>
  );
}
