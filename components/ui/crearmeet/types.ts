// components/CreateMeeting/types.ts

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface MeetingFormData {
  title: string;
  description: string;
  duration: string;
  date: string;
  time: string;
  participants: Participant[];
}

export interface MeetingDetailsProps {
  formData: MeetingFormData;
  onChange: (field: keyof MeetingFormData, value: any) => void;
}

export interface ParticipantsSectionProps {
  participants: Participant[];
  onAddParticipant: (participant: Participant) => void;
  onRemoveParticipant: (id: string) => void;
}

export interface MeetingSummaryProps {
  formData: MeetingFormData;
  onCreateMeeting: () => void;
  isCreating?: boolean;
  isConnected?: boolean;
}