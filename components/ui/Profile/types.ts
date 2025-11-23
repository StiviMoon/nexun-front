// components/Profile/types.ts

export type ProfileTab = 'information' | 'edit' | 'security' | 'delete';

export interface ProfileFormData {
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileHeaderProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export interface ProfileInformationProps {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    createdAt: string;
  };
  onSignOut: () => void;
  isSignOutLoading: boolean;
}

export interface EditProfileProps {
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
  onUpdate: (data: ProfileFormData) => Promise<void>;
  isLoading: boolean;
}