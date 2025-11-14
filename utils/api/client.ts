import { AuthApiResponse   } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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
    
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

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

  private getAuthToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("authToken");
  }

  setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", token);
    }
  }

  clearAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
  }

  // Auth endpoints
  async register(email: string, password: string, name?: string): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async googleAuth(idToken: string): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  }

  async verifyToken(idToken: string): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  }

  async getCurrentUser(): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/auth/me", {
      method: "GET",
    });
  }

  async logout(): Promise<AuthApiResponse> {
    return this.request<AuthApiResponse>("/auth/logout", {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

