import { AuthApiResponse, UpdateProfileRequest, UpdatePasswordRequest } from "@/types/api";
import { getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "@/config/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const getFirebaseAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const existingApps = getApps();
  const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  return getAuth(app);
};

/**
 * Get Firebase ID token for authenticated requests
 */
const getIdToken = async (forceRefresh = false): Promise<string | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      return null;
    }

    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get Firebase ID token for authentication
    const token = await getIdToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  // Auth endpoints - matching guide structure
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    age: number
  ): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, firstName, lastName, age }),
    });
  }

  async login(email: string, password: string): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async googleAuth(idToken: string): Promise<AuthApiResponse> {
    // For Google Auth, we use the idToken from the popup, not the current user's token
    // because the user isn't authenticated in our system yet
    const url = `${this.baseUrl}/api/auth/google`;
    
    if (!idToken || idToken.trim() === "") {
      throw new Error("ID token is required for Google authentication");
    }

    // Debug: Log token length to verify it's complete
    console.log("Google Auth - Token length:", idToken.length);
    console.log("Google Auth - URL:", url);

    const requestBody = { idToken };
    const config: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    };

    try {
      console.log("Google Auth - Sending request to:", url);
      console.log("Google Auth - API Base URL:", this.baseUrl);
      
      let response: Response;
      try {
        response = await fetch(url, config);
      } catch (fetchError) {
        // Handle network errors (CORS, connection refused, etc.)
        console.error("Google Auth - Fetch error:", fetchError);
        
        if (fetchError instanceof TypeError) {
          // This usually means network error or CORS issue
          if (fetchError.message.includes("Failed to fetch") || fetchError.message.includes("NetworkError")) {
            throw new Error(
              `No se pudo conectar con el servidor. Verifica que:\n` +
              `1. El backend esté corriendo en ${this.baseUrl}\n` +
              `2. No haya problemas de CORS\n` +
              `3. La URL sea correcta`
            );
          }
        }
        throw fetchError;
      }
      
      console.log("Google Auth - Response status:", response.status, response.statusText);
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Error del servidor (${response.status}): ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch {
            // Ignore if we can't parse error
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Google Auth - Response data:", data);

      if (!data.success) {
        throw new Error(data.error || "Google authentication failed");
      }

      return data;
    } catch (error) {
      // Log error for debugging
      console.error("Google Auth Error:", error);
      
      if (error instanceof Error) {
        // Re-throw with more context if it's a network error
        if (error.message.includes("Failed to fetch") || 
            error.message.includes("NetworkError") ||
            error.message.includes("No se pudo conectar")) {
          throw error; // Already has a good message
        }
        throw error;
      }
      throw new Error("An unexpected error occurred during Google authentication");
    }
  }

  async githubAuth(idToken: string): Promise<AuthApiResponse> {
    const url = `${this.baseUrl}/api/auth/github`;

    if (!idToken || idToken.trim() === "") {
      throw new Error("ID token is required for GitHub authentication");
    }

    const config: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "GitHub authentication failed");
      }

      return data;
    } catch (error) {
      console.error("GitHub Auth Error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during GitHub authentication");
    }
  }

  async verifyToken(idToken?: string): Promise<AuthApiResponse> {
    // If idToken is provided, use it; otherwise get from Firebase
    const token = idToken || (await getIdToken());
    
    if (!token) {
      throw new Error("No authentication token available");
    }

    return this.request<AuthApiResponse>("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ idToken: token }),
    });
  }

  async getCurrentUser(): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/api/auth/me", {
      method: "GET",
    });
  }

  async logout(): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/api/auth/logout", {
      method: "POST",
    });
  }

  // Helper method to get ID token (for Socket.IO connections)
  async getAuthToken(forceRefresh = false): Promise<string | null> {
    return getIdToken(forceRefresh);
  }

  // Profile update endpoints
  async updateProfile(updateData: UpdateProfileRequest): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  async updatePassword(passwordData: UpdatePasswordRequest): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

