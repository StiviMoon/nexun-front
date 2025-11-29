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

  // Actualizar stream del video cuando cambia
  useEffect(() => {
    // Esperar un frame para asegurar que el elemento esté montado
    const timeoutId = setTimeout(() => {
      const videoEl = videoElement.current;
      if (!videoEl) {
        console.warn(`⚠️ [ParticipantVideo] No hay elemento de video para ${participant.name} (después de timeout)`);
        return;
      }
    
      if (participant.stream) {
        // Siempre asignar el stream, incluso si el track no está habilitado
        // Esto asegura que el video esté listo cuando el track se habilite
        const currentSrcObject = videoEl.srcObject as MediaStream | null;
        const streamChanged = !currentSrcObject || currentSrcObject.id !== participant.stream.id;
        
        if (streamChanged) {
          console.log(`📹 [ParticipantVideo] Asignando stream a video para ${participant.name}`, {
            streamId: participant.stream.id,
            videoTracks: participant.stream.getVideoTracks().length,
            audioTracks: participant.stream.getAudioTracks().length,
            previousStreamId: currentSrcObject?.id || 'none'
          });
          
          // Limpiar el stream anterior si existe
          if (currentSrcObject) {
            console.log(`🧹 [ParticipantVideo] Limpiando stream anterior para ${participant.name}`);
            // No detener los tracks, solo limpiar la referencia del video element
          }
          
          videoEl.srcObject = participant.stream;
          
          // IMPORTANTE: Asegurar que el video remoto NO esté silenciado
          if (videoRef === undefined) {
            videoEl.muted = false;
            console.log(`🔊 [ParticipantVideo] Video remoto desmutado para ${participant.name}`);
          }
          
          // Verificar y habilitar todos los tracks de video
          const videoTracks = participant.stream.getVideoTracks();
          console.log(`📹 [ParticipantVideo] Verificando ${videoTracks.length} video tracks para ${participant.name}`);
          videoTracks.forEach((track, idx) => {
            console.log(`📹 [ParticipantVideo] Track ${idx} antes de habilitar:`, {
              id: track.id,
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted
            });
            
            if (track.readyState === 'live') {
              if (!track.enabled) {
                console.log(`🔄 [ParticipantVideo] Habilitando video track ${idx} (${track.id}) para ${participant.name}`);
                track.enabled = true;
              }
              if (track.muted) {
                console.log(`🔊 [ParticipantVideo] Desmutando video track ${idx} (${track.id}) para ${participant.name}`);
                // Los tracks de video no tienen muted, pero verificamos por si acaso
              }
            } else {
              console.warn(`⚠️ [ParticipantVideo] Track ${idx} no está live (readyState: ${track.readyState})`);
            }
            
            console.log(`📹 [ParticipantVideo] Track ${idx} después de habilitar:`, {
              enabled: track.enabled,
              readyState: track.readyState
            });
          });
          
          // Forzar reproducción inmediata
          if (videoEl.paused) {
            videoEl.play().catch(err => {
              console.warn(`⚠️ [ParticipantVideo] Error inicial al reproducir:`, err);
            });
          }
        } else {
          // El stream es el mismo, pero verificar que los tracks sigan habilitados
          const videoTracks = participant.stream.getVideoTracks();
          videoTracks.forEach((track, idx) => {
            if (!track.enabled && track.readyState === 'live') {
              console.log(`🔄 [ParticipantVideo] Re-habilitando video track ${idx} para ${participant.name}`);
              track.enabled = true;
            }
          });
        }
      
      // Verificar si hay tracks de video
      const videoTracks = participant.stream.getVideoTracks();
      const hasVideoTracks = videoTracks.length > 0;
      
      console.log(`📹 [ParticipantVideo] Stream para ${participant.name}:`, {
        hasStream: !!participant.stream,
        hasVideoTracks,
        videoTracksCount: videoTracks.length,
        srcObjectSet: !!videoEl.srcObject,
        videoPaused: videoEl.paused,
        videoReadyState: videoEl.readyState,
        videoCurrentTime: videoEl.currentTime
      });
      
      if (hasVideoTracks) {
        // Log del estado de los tracks
        videoTracks.forEach((track, index) => {
          console.log(`📹 [ParticipantVideo] Track ${index} para ${participant.name}:`, {
            id: track.id,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
            kind: track.kind
          });
        });
        
        // Forzar reproducción - intentar múltiples veces si es necesario
        let isPlaying = false; // Flag para evitar múltiples llamadas simultáneas
        const attemptPlay = async (attempt = 1) => {
          // Evitar múltiples llamadas simultáneas
          if (isPlaying) {
            console.log(`⏸️ [ParticipantVideo] Ya hay una reproducción en curso para ${participant.name}`);
            return;
          }
          
          try {
            // Asegurar que el video remoto no esté silenciado
            if (videoRef === undefined && videoEl.muted) {
              console.warn(`⚠️ [ParticipantVideo] Video remoto está silenciado, desmutando...`);
              videoEl.muted = false;
            }
            
            if (videoEl.paused) {
              isPlaying = true;
              console.log(`▶️ [ParticipantVideo] Intentando reproducir video para ${participant.name} (intento ${attempt})`);
              
              await videoEl.play();
              
              console.log(`✅ [ParticipantVideo] Video reproduciéndose para ${participant.name}`);
              
              // Verificar estado después de reproducir
              console.log(`📹 [ParticipantVideo] Estado después de play para ${participant.name}:`, {
                paused: videoEl.paused,
                muted: videoEl.muted,
                readyState: videoEl.readyState,
                videoWidth: videoEl.videoWidth,
                videoHeight: videoEl.videoHeight,
                currentTime: videoEl.currentTime
              });
              
              // Si el video tiene dimensiones muy pequeñas (2x2), puede ser que no haya frames
              if (videoEl.videoWidth <= 2 && videoEl.videoHeight <= 2) {
                console.warn(`⚠️ [ParticipantVideo] Video tiene dimensiones muy pequeñas (${videoEl.videoWidth}x${videoEl.videoHeight}) - puede que no haya frames`);
                
                // Esperar un poco y verificar de nuevo
                setTimeout(() => {
                  if (videoEl.videoWidth <= 2 && videoEl.videoHeight <= 2 && participant.stream) {
                    console.error(`❌ [ParticipantVideo] Video sigue sin dimensiones reales después de esperar`);
                    // Verificar los tracks del stream
                    const tracks = participant.stream.getVideoTracks();
                    tracks.forEach((track, idx) => {
                      console.log(`📹 [ParticipantVideo] Track ${idx} estado:`, {
                        enabled: track.enabled,
                        readyState: track.readyState,
                        muted: track.muted,
                        settings: track.getSettings ? track.getSettings() : 'N/A'
                      });
                    });
                  }
                }, 2000);
              }
              
              isPlaying = false;
            } else {
              console.log(`✅ [ParticipantVideo] Video ya está reproduciéndose para ${participant.name}`);
              isPlaying = false;
            }
          } catch (err: unknown) {
            isPlaying = false;
            const error = err as { name?: string; message?: string };
            if (error.name === 'NotAllowedError') {
              console.warn(`⚠️ [ParticipantVideo] Reproducción bloqueada por el navegador para ${participant.name}`);
            } else if (error.name === 'AbortError') {
              // AbortError es normal cuando se interrumpe con una nueva carga
              console.log(`ℹ️ [ParticipantVideo] Reproducción interrumpida (normal) para ${participant.name}`);
            } else if (attempt < 3) {
              console.warn(`⚠️ [ParticipantVideo] Error reproduciendo video (intento ${attempt}) para ${participant.name}:`, err);
              // Intentar de nuevo después de un delay
              setTimeout(() => attemptPlay(attempt + 1), 1000 * attempt);
            } else {
              console.error(`❌ [ParticipantVideo] Error final reproduciendo video para ${participant.name}:`, err);
            }
          }
        };
        
        // Intentar reproducir inmediatamente
        attemptPlay();
        
        // También intentar cuando el video esté listo
        const handleLoadedMetadata = () => {
          if (participant.stream) {
            console.log(`📹 [ParticipantVideo] Metadata cargada para ${participant.name}`);
            attemptPlay();
          }
        };
        
        const handleCanPlay = () => {
          if (participant.stream) {
            console.log(`📹 [ParticipantVideo] Video puede reproducirse para ${participant.name}`);
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
        console.warn(`⚠️ [ParticipantVideo] No hay tracks de video en el stream para ${participant.name}`);
      }
    } else {
      // Si no hay stream, limpiar el srcObject
      if (videoEl.srcObject) {
        console.log(`🧹 [ParticipantVideo] Limpiando srcObject para ${participant.name}`);
        videoEl.srcObject = null;
      }
    }
    }, 0); // Usar 0ms para ejecutar en el siguiente tick del event loop
    
    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant.stream, videoElement, participant.name]); // videoRef es estable, no necesita estar en deps

  return (
    <div
      className={`
        relative bg-zinc-900 rounded-2xl overflow-hidden
        ${isMain ? 'h-full' : 'aspect-video'}
      `}
    >
      {/* Video - Mostrar siempre que haya stream, independientemente del estado del track */}
      {participant.stream && (
        <video
          ref={videoElement}
          className={`absolute inset-0 w-full h-full object-cover z-10 ${
            videoRef !== undefined ? '-scale-x-100' : ''
          }`}
          autoPlay
          muted={videoRef !== undefined} // Solo silenciar el video local (espejo), remoto debe estar desmutado
          playsInline
          controls={false} // No mostrar controles
          style={{
            opacity: videoTrackEnabled ? 1 : 0.3, // Mostrar con opacidad reducida si el track está deshabilitado
            backgroundColor: '#000', // Fondo negro para evitar parpadeos
          }}
          onLoadedMetadata={() => {
            console.log(`📹 [ParticipantVideo] onLoadedMetadata para ${participant.name}`);
            const videoEl = videoElement.current;
            if (videoEl) {
              // Forzar reproducción y verificar estado
              if (videoEl.paused) {
                videoEl.play().catch(err => {
                  console.warn(`⚠️ [ParticipantVideo] Error en onLoadedMetadata play:`, err);
                });
              }
              // Verificar que el video no esté silenciado si es remoto
              if (videoRef === undefined && videoEl.muted) {
                console.warn(`⚠️ [ParticipantVideo] Video remoto está silenciado, desmutando...`);
                videoEl.muted = false;
              }
            }
          }}
          onCanPlay={() => {
            console.log(`📹 [ParticipantVideo] onCanPlay para ${participant.name}`);
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