import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { LoginCredentials, AuthResponse, Admin } from '../types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    // Store token and user data
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.admin));

    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  async getProfile(): Promise<Admin> {
    return await api.get<Admin>(API_ENDPOINTS.AUTH.PROFILE);
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export default new AuthService();
