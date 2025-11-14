export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerIds: string[];
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthApiResponse {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
}

