// components/Profile/types.ts

export type ProfileTab = 'information' | 'edit' | 'security' | 'delete';

export interface ProfileFormData {
  firstName?: string;
  lastName?: string;
  age?: number;
  displayName?: string;
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
    firstName?: string | null;
    lastName?: string | null;
    age?: number | null;
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
    firstName?: string | null;
    lastName?: string | null;
    age?: number | null;
    email: string | null;
    photoURL: string | null;
    providerIds?: string[];
  };
  onUpdate: (data: ProfileFormData) => Promise<void>;
  isLoading: boolean;
  isProviderLocked?: boolean;
}