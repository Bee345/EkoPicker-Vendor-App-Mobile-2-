import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { refreshSocketAuth } from './socket';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) {
  // Surface misconfiguration loudly during development.
  console.warn('[api] EXPO_PUBLIC_API_URL is not set — API calls will fail');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL ?? '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Hook the auth store can register to be notified of forced logouts
// (avoids a circular import between api.ts and the store).
let onAuthExpired: (() => void) | null = null;
export const setAuthExpiredHandler = (fn: () => void) => {
  onAuthExpired = fn;
};

// ─── Concurrent refresh queue ───────────────────────────────────────────────
// Multiple parallel requests hitting 401 should share a single refresh promise
// so we don't burn the rotated refresh token.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return null;

      const { data } = await axios.post(
        `${API_URL ?? ''}/vendor/auth/refresh`,
        { refreshToken },
        { timeout: 10000 },
      );
      const accessToken = data?.tokens?.accessToken;
      const newRefresh = data?.tokens?.refreshToken;
      if (!accessToken) return null;

      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (newRefresh) {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefresh);
      }
      // Long-lived sockets need the new token too — drop & reconnect.
      void refreshSocketAuth();
      return accessToken;
    } catch {
      return null;
    } finally {
      // Clear *after* the chained .then continuations have read the value.
      // Microtask ordering means the queued requests resolve first.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();

  return refreshInFlight;
}

// ─── Request Interceptor — attach JWT ───────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor — refresh on 401, logout on refresh failure ───────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const newAccess = await refreshAccessToken();

    if (!newAccess) {
      // Refresh failed — clear tokens and notify the auth store so it can
      // bounce the user back to the login screen.
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      onAuthExpired?.();
      return Promise.reject(error);
    }

    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
    }
    return apiClient(originalRequest);
  },
);

export default apiClient;
