// components/Dashboard/types.ts

export interface QuickAction {
  id: string;
  title: string;
  icon: 'plus' | 'link';
  onClick: () => void;
}

export interface RecentMeeting {
  id: string;
  creatorName: string;
  creatorAvatar?: string;
  meetingId: string;
  createdAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'ongoing' | 'past';
}

export interface DashboardHeaderProps {
  userName: string;
  userAvatar?: string;
  onNotificationClick?: () => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  recentMeetings: RecentMeeting[];
}

export interface UpcomingMeetingsProps {
  meetings: Meeting[];
}