// components/Dashboard/types.ts

/**
 * Represents a quick action card in the dashboard.
 */
export interface QuickAction {
  id: string;
  title: string;
  icon: 'plus' | 'link';
  onClick: () => void;
}

/**
 * Represents a recent meeting item for quick access.
 */
export interface RecentMeeting {
  id: string;
  creatorName: string;
  creatorAvatar?: string;
  meetingId: string;
  createdAt: Date;
}

/**
 * Represents an upcoming meeting displayed in the dashboard.
 */
export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'ongoing' | 'past';
}

/**
 * Props for the DashboardHeader component.
 */
export interface DashboardHeaderProps {
  userName: string;
  userAvatar?: string;
  onNotificationClick?: () => void;
}

/**
 * Props for the QuickActions component.
 */
export interface QuickActionsProps {
  actions: QuickAction[];
  recentMeetings: RecentMeeting[];
}

/**
 * Props for the UpcomingMeetings component.
 */
export interface UpcomingMeetingsProps {
  meetings: Meeting[];
}
