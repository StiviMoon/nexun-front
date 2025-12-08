/**
 * Representa un participante en una reunión de video
 * @interface Participant
 */
export interface Participant {
  /** ID único del usuario */
  id: string;
  /** Nombre del participante */
  name: string;
  /** URL del avatar del participante */
  avatar?: string;
  /** Indica si el micrófono está silenciado */
  isMuted: boolean;
  /** Indica si la cámara está desactivada */
  isCameraOff: boolean;
  /** Indica si el participante es el anfitrión de la reunión */
  isHost?: boolean;
  /** Indica si el participante está hablando actualmente */
  isSpeaking?: boolean;
  /** Indica si el participante está compartiendo su pantalla */
  isScreenSharing?: boolean;
  /** Stream de video de la cámara del participante */
  stream?: MediaStream;
  /** Stream de video de la pantalla compartida del participante */
  screenStream?: MediaStream;
}

/**
 * Representa una sala de reunión de video
 * @interface MeetingRoom
 */
export interface MeetingRoom {
  /** ID único de la sala */
  id: string;
  /** Nombre de la reunión */
  name: string;
  /** Código de acceso a la reunión */
  meetingCode: string;
  /** ID del usuario anfitrión */
  hostId: string;
  /** Fecha y hora de inicio de la reunión */
  startedAt: Date;
  /** Lista de participantes en la reunión */
  participants: Participant[];
}

/**
 * Tipo para las pestañas del sidebar
 * @typedef {'participants' | 'chat'} SidebarTab
 */
export type SidebarTab = 'participants' | 'chat';

