export interface ScheduledMeeting {
  id: string;
  title: string;
  date: Date;
  meetingUrl?: string;
  meetingCode?: string;
  hostId: string;
  hostName?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export interface JoinMeetingPayload {
  codeOrUrl: string;
  withAudio: boolean;
  withVideo: boolean;
}

export interface MediaStatus {
  micEnabled: boolean;
  cameraEnabled: boolean;
}

export interface MeetingHistory {
  id: string;
  title: string;
  date: Date;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  duration?: number; 
  participants?: number;
}