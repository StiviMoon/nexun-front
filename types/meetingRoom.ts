export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isHost?: boolean;
  isSpeaking?: boolean;
  stream?: MediaStream;
}

export interface MeetingRoom {
  id: string;
  name: string;
  meetingCode: string;
  hostId: string;
  startedAt: Date;
  participants: Participant[];
}

export type SidebarTab = 'participants' | 'chat';

