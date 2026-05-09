import * as SecureStore from 'expo-secure-store';
import apiClient from './api';
import { AuthResponse, LoginDto, RegisterDto } from '../types/auth.types';
import { STORAGE_KEYS } from '../utils/storageKeys';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// ─── Mock data ──────────────────────────────────────────────────────────────
const MOCK_VENDOR = {
  _id: 'vendor_001',
  name: 'Oluwaseun Adeyemi',
  email: 'vendor@ekopicker.com',
  phone: '+2348012345678',
  businessName: 'Etimobile Express',
  businessType: 'retail' as const,
  avatar: 'https://i.pravatar.cc/200?u=vendor001',
  status: 'approved' as const,
  createdAt: new Date().toISOString(),
};

// ─── Auth Service ────────────────────────────────────────────────────────────
export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      if (dto.email !== 'vendor@ekopicker.com' || dto.password !== 'password123') {
        throw new Error('Invalid email or password');
      }
      return {
        vendor: MOCK_VENDOR,
        tokens: {
          accessToken: 'mock_access_token_jwt',
          refreshToken: 'mock_refresh_token_jwt',
        },
      };
    }
    const { data } = await apiClient.post<AuthResponse>('/vendor/auth/login', dto);
    return data;
  },

  async register(dto: RegisterDto): Promise<{ message: string }> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 1000));
      return { message: 'Registration submitted. Awaiting admin approval.' };
    }
    const { data } = await apiClient.post('/vendor/auth/register', dto);
    return data;
  },

  async logout(): Promise<void> {
    if (!USE_MOCK) {
      try {
        await apiClient.post('/vendor/auth/logout');
      } catch {
        // best-effort
      }
    }
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.VENDOR_ID);
  },

  async getProfile() {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      return MOCK_VENDOR;
    }
    const { data } = await apiClient.get('/vendor/auth/me');
    return data;
  },

  async updateProfile(updates: Partial<typeof MOCK_VENDOR>) {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return { ...MOCK_VENDOR, ...updates };
    }
    const { data } = await apiClient.patch('/vendor/auth/me', updates);
    return data;
  },

  async changePassword(current: string, newPassword: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      if (current !== 'password123') throw new Error('Current password is incorrect');
      return;
    }
    await apiClient.put('/vendor/auth/change-password', { current, newPassword });
  },

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  async getStoredToken(): Promise<string | null> {
    return SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  },
};
