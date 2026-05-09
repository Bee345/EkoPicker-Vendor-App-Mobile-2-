import { create } from 'zustand';
import { Order } from '../types/order.types';
import { Message } from '../types/chat.types';

interface SocketState {
  isConnected: boolean;
  // New orders that arrived via socket (before React Query refetch)
  pendingNewOrders: Order[];
  // Typing indicators per chatId
  typingUsers: Record<string, boolean>;
  // Live messages injected by socket
  liveMessages: Record<string, Message[]>;
  totalUnreadMessages: number;

  setConnected: (val: boolean) => void;
  addPendingOrder: (order: Order) => void;
  clearPendingOrders: () => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
  addLiveMessage: (chatId: string, message: Message) => void;
  clearLiveMessages: (chatId: string) => void;
  setTotalUnread: (count: number) => void;
  incrementUnread: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  isConnected: false,
  pendingNewOrders: [],
  typingUsers: {},
  liveMessages: {},
  totalUnreadMessages: 0,

  setConnected: (val) => set({ isConnected: val }),

  addPendingOrder: (order) => set((s) => ({ pendingNewOrders: [order, ...s.pendingNewOrders] })),

  clearPendingOrders: () => set({ pendingNewOrders: [] }),

  setTyping: (chatId, isTyping) =>
    set((s) => ({ typingUsers: { ...s.typingUsers, [chatId]: isTyping } })),

  addLiveMessage: (chatId, message) =>
    set((s) => ({
      liveMessages: {
        ...s.liveMessages,
        [chatId]: [...(s.liveMessages[chatId] ?? []), message],
      },
    })),

  clearLiveMessages: (chatId) =>
    set((s) => {
      const updated = { ...s.liveMessages };
      delete updated[chatId];
      return { liveMessages: updated };
    }),

  setTotalUnread: (count) => set({ totalUnreadMessages: count }),

  incrementUnread: () => set((s) => ({ totalUnreadMessages: s.totalUnreadMessages + 1 })),
}));
