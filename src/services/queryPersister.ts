import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * Persistent React Query cache so cold starts feel instant on flaky networks.
 *
 * What we persist: products / orders / earnings reads.
 * What we don't:   chats (move fast, need fresh), payouts (bank info), auth.
 */

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'ekopicker.vendor.query-cache.v1',
  throttleTime: 2000,
});

const NEVER_PERSIST_PREFIXES = ['chats', 'messages', 'payouts', 'auth'];

// Loosely typed because @tanstack/query-async-storage-persister vendors its
// own query-core whose `Query` symbol differs nominally from the app's
// `@tanstack/query-core` even though the shape matches at runtime.
interface PersisterQueryShape {
  queryKey: readonly unknown[];
  state: { status: string };
}

export const dehydrateOptions = {
  shouldDehydrateQuery: (query: PersisterQueryShape) => {
    const root = String(query.queryKey[0] ?? '');
    if (NEVER_PERSIST_PREFIXES.includes(root)) return false;
    return query.state.status === 'success';
  },
} as const;

/** Cache busts when the bundle updates — bump this when query shapes change. */
export const PERSIST_BUSTER = '1.0.0';
