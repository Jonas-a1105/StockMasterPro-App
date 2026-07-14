import { apiClient } from '@shared/api/apiClient';
import type { LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData, AuthResponse } from '../types/auth.types';

const AUTH_BASE = '/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(`${AUTH_BASE}/login`, credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(`${AUTH_BASE}/register`, data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`${AUTH_BASE}/forgot-password`, data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`${AUTH_BASE}/reset-password`, data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> => {
    const response = await apiClient.post<{ accessToken: string; expiresIn: number }>(`${AUTH_BASE}/refresh`, { refreshToken });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(`${AUTH_BASE}/logout`);
  },

  me: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get<AuthResponse['user']>(`${AUTH_BASE}/me`);
    return response.data;
  },
};