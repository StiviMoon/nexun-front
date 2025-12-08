'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { User, MicOff, VideoOff, Mic, Video, Monitor } from 'lucide-react';
import { Participant } from '@/types/meetingRoom';

/**
 * Props del componente ParticipantVideo
 * @interface ParticipantVideoProps
 */
interface ParticipantVideoProps {
  /** Datos del participante */
  participant: Participant;
  /** Si es el video principal (más grande) */
  isMain?: boolean;
  /** Si mostrar animación de onda de audio */
  showWaveform?: boolean;
  /** Ref del elemento de video (para video local) */
  videoRef?: RefObject<HTMLVideoElement | null>;
}

/**
 * Componente que renderiza el video de un participante
 * 
 * Maneja la visualización de:
 * - Stream de cámara (principal o overlay si hay pantalla)
 * - Stream de pantalla compartida (principal cuando está activo)
 * - Avatar cuando la cámara está desactivada
 * - Indicadores de estado (micrófono, cámara, pantalla)
 * 
 * @param {ParticipantVideoProps} props - Props del componente
 * @returns {JSX.Element} Componente de video del participante
 */
export function ParticipantVideo({
  participant,
  isMain = false,
  showWaveform = false,
  videoRef,
}: ParticipantVideoProps) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteScreenRef = useRef<HTMLVideoElement>(null);
  const videoElement = videoRef || remoteVideoRef;
  const [videoTrackEnabled, setVideoTrackEnabled] = useState<boolean>(false);
  const [screenTrackEnabled, setScreenTrackEnabled] = useState<boolean>(false);
  const tracksRef = useRef<MediaStreamTrack[]>([]);
  const screenTracksRef = useRef<MediaStreamTrack[]>([]);

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
        updateTrackState();
      };
      
      const handleStateChange = () => {
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

  // Detectar cambios en el estado del stream de pantalla
  useEffect(() => {
    if (!participant.screenStream) {
      setTimeout(() => {
        setScreenTrackEnabled(false);
        screenTracksRef.current = [];
      }, 0);
      return;
    }

    const screenTracks = participant.screenStream.getVideoTracks();
    screenTracksRef.current = screenTracks;

    const updateScreenTrackState = () => {
      const hasActiveScreenTrack = screenTracks.length > 0 && 
                                  screenTracks[0].readyState === 'live' && 
                                  screenTracks[0].enabled;
      setScreenTrackEnabled(hasActiveScreenTrack);
    };

    setTimeout(() => {
      updateScreenTrackState();
    }, 0);

    const trackListeners: Array<() => void> = [];
    screenTracks.forEach(track => {
      const handleEnabledChange = () => {
        updateScreenTrackState();
      };
      
      const handleStateChange = () => {
        updateScreenTrackState();
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
  }, [participant.screenStream]);

  // Actualizar stream del video cuando cambia
  useEffect(() => {
    if (!participant.stream) return;
    
    // Esperar un frame para asegurar que el elemento esté montado
    const timeoutId = setTimeout(() => {
      const videoEl = videoElement.current;
      if (!videoEl) {
        // El elemento no está montado, esto es normal si el video track no está habilitado
        // No mostrar warning ya que es un caso esperado
        return;
      }
    
      if (participant.stream) {
        // Siempre asignar el stream, incluso si el track no está habilitado
        // Esto asegura que el video esté listo cuando el track se habilite
        const currentSrcObject = videoEl.srcObject as MediaStream | null;
        const streamChanged = !currentSrcObject || currentSrcObject.id !== participant.stream.id;
        
        if (streamChanged) {
          videoEl.srcObject = participant.stream;
          
          // Asegurar que el video remoto NO esté silenciado
          if (videoRef === undefined) {
            videoEl.muted = false;
          }
          
          // Verificar y habilitar todos los tracks de video
          const videoTracks = participant.stream.getVideoTracks();
          videoTracks.forEach((track) => {
            if (track.readyState === 'live' && !track.enabled) {
              track.enabled = true;
            }
          });
          
          // Forzar reproducción inmediata
          if (videoEl.paused) {
            videoEl.play().catch(() => {
              // Error silenciado, se reintentará en los event handlers
            });
          }
        } else {
          // El stream es el mismo, pero verificar que los tracks sigan habilitados
          const videoTracks = participant.stream.getVideoTracks();
          videoTracks.forEach((track) => {
            if (!track.enabled && track.readyState === 'live') {
              track.enabled = true;
            }
          });
        }
      
      const videoTracks = participant.stream.getVideoTracks();
      const hasVideoTracks = videoTracks.length > 0;
      
      if (hasVideoTracks) {
        // Forzar reproducción - intentar múltiples veces si es necesario
        let isPlaying = false;
        const attemptPlay = async (attempt = 1) => {
          if (isPlaying) return;
          
          try {
            if (videoRef === undefined && videoEl.muted) {
              videoEl.muted = false;
            }
            
            if (videoEl.paused) {
              isPlaying = true;
              await videoEl.play();
              isPlaying = false;
            }
          } catch (err: unknown) {
            isPlaying = false;
            const error = err as { name?: string; message?: string };
            if (error.name === 'NotAllowedError') {
              // Reproducción bloqueada por el navegador
            } else if (error.name !== 'AbortError' && attempt < 3) {
              setTimeout(() => attemptPlay(attempt + 1), 1000 * attempt);
            }
          }
        };
        
        attemptPlay();
        
        const handleLoadedMetadata = () => {
          if (participant.stream) {
            attemptPlay();
          }
        };
        
        const handleCanPlay = () => {
          if (participant.stream) {
            attemptPlay();
          }
        };
        
        videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoEl.addEventListener('canplay', handleCanPlay);
        
        // Cleanup de event listeners
        return () => {
          videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoEl.removeEventListener('canplay', handleCanPlay);
        };
      } else {
      }
    } else {
      // Si no hay stream, limpiar el srcObject
      if (videoEl.srcObject) {
        videoEl.srcObject = null;
      }
    }
    }, 0); // Usar 0ms para ejecutar en el siguiente tick del event loop
    
    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant.stream, videoElement, participant.name]); // videoRef es estable, no necesita estar en deps

  const hasScreenStream = participant.screenStream && screenTrackEnabled;
  const hasCameraStream = participant.stream && videoTrackEnabled;
  // Mostrar avatar si la cámara está desactivada (incluso si hay stream)
  const shouldShowAvatar = participant.isCameraOff || !hasCameraStream;

  // Actualizar stream de pantalla cuando cambia
  useEffect(() => {
    if (!participant.screenStream || !hasScreenStream) return;
    
    // Esperar un frame para asegurar que el elemento esté montado
    const timeoutId = setTimeout(() => {
      const screenEl = remoteScreenRef.current;
      if (!screenEl) {
        // El elemento aún no está montado, esto es normal durante el renderizado inicial
        return;
      }
    
      const currentSrcObject = screenEl.srcObject as MediaStream | null;
      const screenStream = participant.screenStream;
      if (!screenStream) return;
      
      const streamChanged = !currentSrcObject || currentSrcObject.id !== screenStream.id;
      
      if (streamChanged) {
        screenEl.srcObject = screenStream;
        screenEl.muted = false;
        screenEl.play().catch(() => {
          // Error silenciado, se reintentará en los event handlers
        });
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [participant.screenStream, hasScreenStream]);

  return (
    <div
      className={`
        relative bg-zinc-900 rounded-2xl overflow-hidden
        ${isMain ? 'h-full' : 'aspect-video'}
      `}
    >
      {/* Video de pantalla compartida - Mostrar como stream principal si está disponible */}
      {hasScreenStream && (
        <video
          ref={remoteScreenRef}
          className="absolute inset-0 w-full h-full object-contain z-10"
          autoPlay
          muted={false}
          playsInline
          controls={false}
          style={{
            opacity: screenTrackEnabled ? 1 : 0,
            backgroundColor: '#000',
            transition: 'opacity 0.3s ease-in-out',
          }}
          onLoadedMetadata={() => {
            const screenEl = remoteScreenRef.current;
            if (screenEl && screenEl.paused) {
              screenEl.play().catch(() => {
                // Error silenciado
              });
            }
          }}
          onCanPlay={() => {
            const screenEl = remoteScreenRef.current;
            if (screenEl && screenEl.paused) {
              screenEl.play().catch(() => {
                // Error silenciado
              });
            }
          }}
        />
      )}

      {/* Video de cámara - Mostrar como overlay pequeño si hay pantalla, o como principal si no hay pantalla */}
      {participant.stream && hasCameraStream && !shouldShowAvatar && (
        <video
          ref={videoElement}
          className={`absolute ${
            hasScreenStream 
              ? 'bottom-4 right-4 w-48 h-32 rounded-lg border-2 border-zinc-700 shadow-lg z-20' 
              : 'inset-0 w-full h-full z-10'
          } object-cover ${
            videoRef !== undefined ? '-scale-x-100' : ''
          }`}
          autoPlay
          muted={videoRef !== undefined}
          playsInline
          controls={false}
          style={{
            opacity: 1,
            backgroundColor: '#000',
            transition: 'opacity 0.3s ease-in-out',
          }}
          onLoadedMetadata={() => {
            const videoEl = videoElement.current;
            if (videoEl) {
              // Forzar reproducción y verificar estado
              if (videoEl.paused) {
                videoEl.play().catch(() => {
                  // Error silenciado
                });
              }
              // Verificar que el video no esté silenciado si es remoto
              if (videoRef === undefined && videoEl.muted) {
                videoEl.muted = false;
              }
            }
          }}
          onCanPlay={() => {
            const videoEl = videoElement.current;
            if (videoEl) {
              if (videoEl.paused) {
                videoEl.play().catch(err => {
                  console.warn(`⚠️ [ParticipantVideo] Error en onCanPlay play:`, err);
                });
              }
              // Asegurar que el video remoto no esté silenciado
              if (videoRef === undefined && videoEl.muted) {
                console.warn(`⚠️ [ParticipantVideo] Video remoto silenciado en onCanPlay, desmutando...`);
                videoEl.muted = false;
              }
            }
          }}
          onPlay={() => {
            console.log(`▶️ [ParticipantVideo] Video empezó a reproducirse para ${participant.name}`);
            const videoEl = videoElement.current;
            if (videoEl) {
              // Verificar estado del video
              console.log(`📹 [ParticipantVideo] Estado del video para ${participant.name}:`, {
                paused: videoEl.paused,
                muted: videoEl.muted,
                readyState: videoEl.readyState,
                currentTime: videoEl.currentTime,
                videoWidth: videoEl.videoWidth,
                videoHeight: videoEl.videoHeight,
                srcObject: !!videoEl.srcObject
              });
              
              // Asegurar que el video remoto no esté silenciado
              if (videoRef === undefined && videoEl.muted) {
                console.warn(`⚠️ [ParticipantVideo] Video remoto silenciado en onPlay, desmutando...`);
                videoEl.muted = false;
              }
            }
          }}
          onPause={() => {
            console.log(`⏸️ [ParticipantVideo] Video pausado para ${participant.name}`);
          }}
          onLoadedData={() => {
            console.log(`📹 [ParticipantVideo] onLoadedData para ${participant.name} - Video cargado`);
            const videoEl = videoElement.current;
            if (videoEl && videoEl.paused) {
              videoEl.play().catch(err => {
                console.warn(`⚠️ [ParticipantVideo] Error en onLoadedData play:`, err);
              });
            }
          }}
        />
      )}
      
      {/* Avatar - Mostrar cuando la cámara está desactivada o no hay ningún stream activo */}
      {shouldShowAvatar && !hasScreenStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 z-20">
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
                onError={(e) => {
                  console.warn(`⚠️ [ParticipantVideo] Error cargando avatar de ${participant.name}:`, e);
                  // Si falla la carga de la imagen, mostrar el icono por defecto
                  const target = e.target as HTMLImageElement;
                  if (target.parentElement) {
                    target.style.display = 'none';
                  }
                }}
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

            {/* Screen Sharing Indicator */}
            {participant.isScreenSharing && (
              <div title="Compartiendo pantalla" aria-label="Compartiendo pantalla">
                <Monitor className={`text-cyan-400 ${isMain ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              </div>
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