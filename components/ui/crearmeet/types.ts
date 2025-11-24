/**
 * Represents a participant in a meeting.
 */
export interface Participant {
  /** Unique identifier for the participant */
  id: string;
  /** Full name of the participant */
  name: string;
  /** Email address of the participant */
  email: string;
  /** Optional avatar URL for the participant */
  avatar?: string;
}

/**
 * Represents the form data for creating a meeting.
 */
export interface MeetingFormData {
  /** Meeting title */
  title: string;
  /** Meeting description */
  description: string;
  /** Duration of the meeting in minutes */
  duration: string;
  /** Scheduled date of the meeting (YYYY-MM-DD) */
  date: string;
  /** Scheduled time of the meeting (HH:MM) */
  time: string;
  /** List of participants */
  participants: Participant[];
}

/**
 * Props for the MeetingDetails component.
 */
export interface MeetingDetailsProps {
  /** Current form data for the meeting */
  formData: MeetingFormData;
  /** Callback to update a specific field in the form data */
  onChange: (field: keyof MeetingFormData, value: any) => void;
}

/**
 * Props for the ParticipantsSection component.
 */
export interface ParticipantsSectionProps {
  /** List of current participants */
  participants: Participant[];
  /** Callback to add a participant */
  onAddParticipant: (participant: Participant) => void;
  /** Callback to remove a participant by ID */
  onRemoveParticipant: (id: string) => void;
}

/**
 * Props for the MeetingSummary component.
 */
export interface MeetingSummaryProps {
  /** Current form data for the meeting */
  formData: MeetingFormData;
  /** Callback to create the meeting */
  onCreateMeeting: () => void;
}
