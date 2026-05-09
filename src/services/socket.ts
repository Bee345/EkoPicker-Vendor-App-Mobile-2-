import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../utils/storageKeys';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

let socket: Socket | null = null;
let lastVendorId: string | null = null;

/**
 * Connect the Socket.io client and attach the vendor's JWT.
 *
 * Scale concerns:
 *  • Re-reads the token on every (re)connect attempt so a refreshed access token
 *    is picked up automatically.
 *  • Reconnect with exponential backoff (handled by socket.io defaults).
 *  • If the server kicks us with `connect_error: jwt expired`, we tear down and
 *    let the next reconnect grab the new token.
 */
export const connectSocket = async (vendorId?: string): Promise<Socket | null> => {
  if (!SOCKET_URL) return null;
  if (socket?.connected) return socket;
  if (vendorId) lastVendorId = vendorId;

  const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // allow polling fallback for restrictive networks
    reconnection: true,
    reconnectionAttempts: Infinity, // keep trying — UI shows offline state separately
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000, // exponential cap
    randomizationFactor: 0.3, // jitter
    timeout: 10000,
  });

  // Re-fetch token on each reconnect attempt to pick up rotations.
  socket.io.on('reconnect_attempt', async () => {
    const fresh = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (socket) (socket.auth as { token?: string }).token = fresh ?? undefined;
  });

  socket.on('connect_error', (err) => {
    if (
      typeof err?.message === 'string' &&
      /jwt|auth|token/i.test(err.message)
    ) {
      // Token rejected — drop the socket, let the auth store force re-login or
      // the next reconnect refresh the token.
      socket?.disconnect();
      socket = null;
    }
  });

  return socket;
};

/**
 * Run a callback once the socket is connected — handles the race where
 * the socket connected before `.once('connect')` was registered.
 */
export const onSocketReady = (cb: (s: Socket) => void): void => {
  if (!socket) return;
  if (socket.connected) cb(socket);
  else socket.once('connect', () => cb(socket!));
};

/** Disconnect the socket (e.g. on logout). */
export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
  lastVendorId = null;
};

/** Get the current socket instance (may be null if not connected). */
export const getSocket = (): Socket | null => socket;

/** Used by token-refresh handler to force a re-handshake with the new token. */
export const refreshSocketAuth = async (): Promise<void> => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  if (lastVendorId) await connectSocket(lastVendorId);
};

// ─── Typed event emitters ─────────────────────────────────────────────────

export const joinVendorRoom = (vendorId: string): void => {
  lastVendorId = vendorId;
  socket?.emit('join_vendor_room', { vendorId });
};

export const joinChat = (chatId: string): void => {
  socket?.emit('join_chat', { chatId });
};

export const leaveChat = (chatId: string): void => {
  socket?.emit('leave_chat', { chatId });
};

export const sendSocketMessage = (chatId: string, text: string): void => {
  socket?.emit('send_message', { chatId, text, senderType: 'vendor' });
};

export const emitTyping = (chatId: string, isTyping: boolean): void => {
  socket?.emit('typing', { chatId, isTyping, senderType: 'vendor' });
};

export const emitOrderStatusUpdate = (orderId: string, status: string): void => {
  socket?.emit('update_order_status', { orderId, status });
};
