'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { User, MicOff, VideoOff, Mic, Video } from 'lucide-react';
import { Participant } from '@/types/meetingRoom';

interface ParticipantVideoProps {
  participant: Participant;
  isMain?: boolean;
  showWaveform?: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
}

export function ParticipantVideo({
  participant,
  isMain = false,
  showWaveform = false,
  videoRef,
}: ParticipantVideoProps) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const videoElement = videoRef || remoteVideoRef;
  const [videoTrackEnabled, setVideoTrackEnabled] = useState<boolean>(false);
  const tracksRef = useRef<MediaStreamTrack[]>([]);

  // Detectar cambios en el estado del video track
  useEffect(() => {
    if (!participant.stream) {
      // Usar setTimeout para evitar setState síncrono en el efecto
      setTimeout(() => {
        setVideoTrackEnabled(false);
        tracksRef.current = [];
      }, 0);
      return;
    }

    const videoTracks = participant.stream.getVideoTracks();
    tracksRef.current = videoTracks;

    // Función para actualizar el estado (se ejecuta en callbacks)
    const updateTrackState = () => {
      const hasActiveVideoTrack = videoTracks.length > 0 && 
                                  videoTracks[0].readyState === 'live' && 
                                  videoTracks[0].enabled;
      setVideoTrackEnabled(hasActiveVideoTrack);
    };

    // Estado inicial (usar setTimeout para evitar setState síncrono)
    setTimeout(() => {
      updateTrackState();
    }, 0);

    // Agregar listeners a los tracks para detectar cambios
    const trackListeners: Array<() => void> = [];
    videoTracks.forEach(track => {
      const handleEnabledChange = () => {
        console.log(`📹 Track ${track.id} enabled cambió a: ${track.enabled} para ${participant.name}`);
        updateTrackState();
      };
      
      const handleStateChange = () => {
        console.log(`📹 Track ${track.id} readyState cambió a: ${track.readyState} para ${participant.name}`);
        updateTrackState();
      };

      track.addEventListener('enabledchange', handleEnabledChange);
      track.addEventListener('ended', handleStateChange);
      track.addEventListener('mute', handleStateChange);
      track.addEventListener('unmute', handleStateChange);

      trackListeners.push(() => {
        track.removeEventListener('enabledchange', handleEnabledChange);
        track.removeEventListener('ended', handleStateChange);
        track.removeEventListener('mute', handleStateChange);
        track.removeEventListener('unmute', handleStateChange);
      });
    });

    return () => {
      trackListeners.forEach(cleanup => cleanup());
    };
  }, [participant.stream, participant.name]);

  // Actualizar stream del video cuando cambia el estado del track
  useEffect(() => {
    const videoEl = videoElement.current;
    if (!videoEl) return;
    
    if (participant.stream && videoTrackEnabled) {
      // Asegurar que el srcObject esté configurado
      if (videoEl.srcObject !== participant.stream) {
        videoEl.srcObject = participant.stream;
      }
      
      // Intentar reproducir solo si el video no está ya reproduciéndose
      if (videoEl.paused || videoEl.readyState < 2) {
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              console.warn(`Error reproduciendo video para ${participant.name}:`, err);
            }
          });
        }
      }
    } else {
      // Si el track está deshabilitado, pausar el video pero mantener el srcObject
      // para evitar parpadeos cuando se reactiva
      if (!videoEl.paused) {
        videoEl.pause();
      }
    }
  }, [participant.stream, videoTrackEnabled, videoElement, participant.name]);

  return (
    <div
      className={`
        relative bg-zinc-900 rounded-2xl overflow-hidden
        ${isMain ? 'h-full' : 'aspect-video'}
      `}
    >
      {/* Video - Mostrar solo si hay stream y el track está habilitado */}
      {participant.stream && videoTrackEnabled && (
        <video
          ref={videoElement}
          className={`absolute inset-0 w-full h-full object-cover z-10 ${
            videoRef !== undefined ? '-scale-x-100' : ''
          }`}
          autoPlay
          muted={videoRef !== undefined}
          playsInline
        />
      )}
      
      {/* Avatar - Mostrar cuando no hay stream o cuando el video track está deshabilitado */}
      {(!participant.stream || !videoTrackEnabled) && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          {showWaveform ? (
            <Waveform />
          ) : participant.avatar ? (
            <div className={`relative ${isMain ? 'w-32 h-32' : 'w-16 h-16'} rounded-full overflow-hidden border-2 border-zinc-600 shadow-lg`}>
              <Image
                src={participant.avatar}
                alt={participant.name}
                fill
                className="object-cover"
                sizes={isMain ? '128px' : '64px'}
                priority={isMain}
              />
            </div>
          ) : (
            <div
              className={`
                rounded-full bg-zinc-700 flex items-center justify-center
                ${isMain ? 'w-28 h-28' : 'w-14 h-14'}
              `}
            >
              <User className={`${isMain ? 'w-12 h-12' : 'w-6 h-6'} text-zinc-400`} />
            </div>
          )}
        </div>
      )}

      {/* Bottom Bar - Name & Status */}
      <div className="absolute bottom-0 left-0 right-0 p-3 from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <span className={`text-white ${isMain ? 'text-base' : 'text-xs'} font-medium`}>
            {participant.name}
          </span>
          <div className="flex items-center gap-2">
            {isMain ? (
              // Show mic icon (on/off) for main participant
              participant.isMuted ? (
                <MicOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              ) : (
                <Mic className={`text-green-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            ) : (
              // For non-main participants show only the 'off' icon when muted
              participant.isMuted && (
                <MicOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            )}

            {isMain ? (
              // Show camera icon (on/off) for main participant
              participant.isCameraOff ? (
                <VideoOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              ) : (
                <Video className={`text-green-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            ) : (
              // For non-main participants show only the 'off' icon when camera is off
              participant.isCameraOff && (
                <VideoOff className={`text-zinc-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de onda de audio
function Waveform() {
  return (
    <div className="flex items-center gap-1">
      {[...Array(9)].map((_, i) => {
        // Deterministic height per bar to avoid SSR/Client hydration mismatch
        // Use a simple formula based on index so server and client render identical markup
        const height = 20 + ((i * 13) % 40); // range ~20-59
        return (
          <div
            key={i}
            className="w-1.5 bg-purple-500 rounded-full animate-pulse"
            style={{
              height: `${height}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        );
      })}
    </div>
  );
}