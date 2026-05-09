import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../utils/storageKeys';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;
if (!SOCKET_URL && __DEV__) {
  console.warn('[socket] EXPO_PUBLIC_SOCKET_URL is not set — real-time disabled');
}

let socket: Socket | null = null;

/**
 * Connect the Socket.io client and attach the vendor's JWT.
 * Call this after successful login.
 */
export const connectSocket = async (): Promise<Socket | null> => {
  if (!SOCKET_URL) return null;
  if (socket?.connected) return socket;

  const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
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
};

/** Get the current socket instance (may be null if not connected). */
export const getSocket = (): Socket | null => socket;

// ─── Typed event emitters ─────────────────────────────────────────────────

export const joinVendorRoom = (vendorId: string): void => {
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
