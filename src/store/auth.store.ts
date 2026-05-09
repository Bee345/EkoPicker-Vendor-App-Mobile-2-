import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Vendor, LoginDto, RegisterDto } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { connectSocket, disconnectSocket, joinVendorRoom, onSocketReady } from '../services/socket';
import { setAuthExpiredHandler } from '../services/api';
import { setUserContext } from '../services/sentry';
import { STORAGE_KEYS } from '../utils/storageKeys';

interface AuthState {
  vendor: Vendor | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<string>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  updateVendor: (updates: Partial<Vendor>) => void;
  clearError: () => void;
  forceLogout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  vendor: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(dto);
      await authService.saveTokens(response.tokens.accessToken, response.tokens.refreshToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.VENDOR_ID, response.vendor._id);

      const socket = await connectSocket(response.vendor._id);
      if (socket) onSocketReady(() => joinVendorRoom(response.vendor._id));
      setUserContext(response.vendor._id);

      set({ vendor: response.vendor, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message ?? 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register(dto);
      set({ isLoading: false });
      return result.message;
    } catch (err: any) {
      set({ error: err.message ?? 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    disconnectSocket();
    setUserContext(null);
    await authService.logout();
    set({ vendor: null, isAuthenticated: false, error: null });
  },

  // Called by api.ts when refresh fails — bounce back to login UI.
  forceLogout: async () => {
    disconnectSocket();
    setUserContext(null);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.VENDOR_ID);
    set({ vendor: null, isAuthenticated: false, error: 'Session expired. Please sign in again.' });
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    try {
      const token = await authService.getStoredToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const vendor = await authService.getProfile();
      if (vendor.status === 'approved') {
        const socket = await connectSocket(vendor._id);
        if (socket) onSocketReady(() => joinVendorRoom(vendor._id));
        setUserContext(vendor._id);
      }
      set({ vendor, isAuthenticated: vendor.status === 'approved', isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateVendor: (updates) => {
    const current = get().vendor;
    if (current) set({ vendor: { ...current, ...updates } });
  },

  clearError: () => set({ error: null }),
}));

// Wire api.ts → store so a failed refresh bounces the user out.
setAuthExpiredHandler(() => {
  void useAuthStore.getState().forceLogout();
});
