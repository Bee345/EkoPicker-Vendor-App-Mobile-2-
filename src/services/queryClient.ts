import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  QueryClient,
  focusManager,
  onlineManager,
  DefaultOptions,
} from '@tanstack/react-query';

/**
 * Production-grade QueryClient.
 *
 * Scale concerns addressed here:
 *  • polling pauses automatically when the app backgrounds (saves battery + backend RPS)
 *  • online state drives refetches (no useless requests on cell-network drops)
 *  • exponential backoff with jitter + 4xx don't retry (Africa networks are spiky)
 *  • caches are kept long enough for offline browsing (gcTime 24h)
 */

const ONE_MIN = 1000 * 60;

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: ONE_MIN * 2,
    gcTime: ONE_MIN * 60 * 24, // 24h — supports offline browsing via persister
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return false; // 4xx (except timeout/rate-limit) are deterministic — don't retry
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // exponential backoff with jitter, capped at 30s
      const base = Math.min(1000 * 2 ** attemptIndex, 30000);
      const jitter = Math.random() * 0.3 * base;
      return base + jitter;
    },
  },
  mutations: {
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return false;
      }
      // Most mutations should not retry by default to avoid double-write.
      // Specific mutations (e.g. useChat.sendMessage) override this.
      return failureCount < 1;
    },
  },
};

export const queryClient = new QueryClient({ defaultOptions });

// ─── App-state-aware focus manager ──────────────────────────────────────────
// When the app is backgrounded, focusManager.setFocused(false) pauses every
// query that has refetchInterval set, so polling endpoints stop costing
// battery and bandwidth. They resume on foreground.
let detached: (() => void) | null = null;
export function attachAppStateFocus() {
  if (detached) return; // idempotent
  const handler = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  };
  const sub = AppState.addEventListener('change', handler);
  detached = () => sub.remove();
}

// ─── Online-state manager (NetInfo) ────────────────────────────────────────
// Drives onlineManager so React Query knows when to actually attempt refetches.
let detachedNet: (() => void) | null = null;
export function attachNetInfoOnline() {
  if (detachedNet) return;
  detachedNet = NetInfo.addEventListener((state) => {
    onlineManager.setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
}

export function detachAll() {
  detached?.();
  detachedNet?.();
  detached = null;
  detachedNet = null;
}
