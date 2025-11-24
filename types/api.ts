export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  photoURL: string | null;
  providerIds: string[];
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  age?: number;
  displayName?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthApiResponse {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
}

