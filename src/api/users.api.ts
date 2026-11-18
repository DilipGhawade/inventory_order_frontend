import { apiClient } from "./client";
import type {
  UserAdminCreateRequest,
  UserResponse,
  UserUpdateRequest,
} from "../types/api";

export const usersApi = {
  getMe: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>("/users/me");
    return response.data;
  },

  listUsers: async (skip = 0, limit = 50): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>("/users", {
      params: { skip, limit },
    });
    return response.data;
  },

  createUserByAdmin: async (
    payload: UserAdminCreateRequest,
  ): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>("/users", payload);
    return response.data;
  },

  getUserById: async (userId: number): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`);
    return response.data;
  },

  updateUserByAdmin: async (
    userId: number,
    payload: UserUpdateRequest,
  ): Promise<UserResponse> => {
    const response = await apiClient.patch<UserResponse>(
      `/users/${userId}`,
      payload,
    );
    return response.data;
  },
};
