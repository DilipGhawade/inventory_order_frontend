import { apiClient, rootClient } from "./client";
import type {
  HealthResponse,
  TokenResponse,
  UserCreateRequest,
  UserResponse,
} from "../types/api";

export const authApi = {
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await rootClient.get<HealthResponse>("/health");
    return response.data;
  },

  register: async (payload: UserCreateRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>(
      "/auth/register",
      payload,
    );
    return response.data;
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await apiClient.post<TokenResponse>(
      "/auth/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};
