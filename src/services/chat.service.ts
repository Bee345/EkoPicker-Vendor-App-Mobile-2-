import apiClient from './api';
import { Chat, Message, SendMessageDto } from '../types/chat.types';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// ─── Mock data ──────────────────────────────────────────────────────────────
const MOCK_CHATS: Chat[] = [
  {
    _id: 'chat_001', vendorId: 'vendor_001', userId: 'u1',
    user: { _id: 'u1', name: 'Raiden Lord', avatar: 'https://i.pravatar.cc/100?u=u1' },
    lastMessage: { _id: 'msg_last_1', chatId: 'chat_001', senderId: 'u1', senderType: 'user', text: 'Is my order ready yet?', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    unreadCount: 2,
    orderId: 'ord_001',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    _id: 'chat_002', vendorId: 'vendor_001', userId: 'u2',
    user: { _id: 'u2', name: 'Yae Miko', avatar: 'https://i.pravatar.cc/100?u=u2' },
    lastMessage: { _id: 'msg_last_2', chatId: 'chat_002', senderId: 'vendor_001', senderType: 'vendor', text: 'Your order has been confirmed!', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    unreadCount: 0,
    orderId: 'ord_002',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: 'chat_003', vendorId: 'vendor_001', userId: 'u3',
    user: { _id: 'u3', name: 'Zhongli Li', avatar: 'https://i.pravatar.cc/100?u=u3' },
    lastMessage: { _id: 'msg_last_3', chatId: 'chat_003', senderId: 'u3', senderType: 'user', text: 'Thank you! Great service.', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
    unreadCount: 0,
    orderId: 'ord_003',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  chat_001: [
    { _id: 'msg_001', chatId: 'chat_001', senderId: 'u1', senderType: 'user', text: 'Hi, I just placed an order. Can you confirm?', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
    { _id: 'msg_002', chatId: 'chat_001', senderId: 'vendor_001', senderType: 'vendor', text: 'Hi Raiden! Yes, I can see your order. Let me confirm it now.', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
    { _id: 'msg_003', chatId: 'chat_001', senderId: 'vendor_001', senderType: 'vendor', text: "Order #212323 confirmed! We'll start preparing it shortly.", read: true, createdAt: new Date(Date.now() - 1000 * 60 * 49).toISOString() },
    { _id: 'msg_004', chatId: 'chat_001', senderId: 'u1', senderType: 'user', text: 'Great, thank you! How long will it take?', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
    { _id: 'msg_005', chatId: 'chat_001', senderId: 'u1', senderType: 'user', text: 'Is my order ready yet?', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  ],
  chat_002: [
    { _id: 'msg_006', chatId: 'chat_002', senderId: 'u2', senderType: 'user', text: 'Hello! I placed an order for biscuits.', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
    { _id: 'msg_007', chatId: 'chat_002', senderId: 'vendor_001', senderType: 'vendor', text: 'Your order has been confirmed!', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  ],
  chat_003: [
    { _id: 'msg_008', chatId: 'chat_003', senderId: 'u3', senderType: 'user', text: 'Thank you! Great service.', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  ],
};

let msgCounter = 200;

// ─── Chat Service ────────────────────────────────────────────────────────────
export const chatService = {
  async getChats(): Promise<Chat[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return [...MOCK_CHATS].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    const { data } = await apiClient.get<Chat[]>('/vendor/chats');
    return data;
  },

  async getMessages(chatId: string): Promise<Message[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return MOCK_MESSAGES[chatId] ?? [];
    }
    const { data } = await apiClient.get<Message[]>(`/vendor/chats/${chatId}/messages`);
    return data;
  },

  async sendMessage(dto: SendMessageDto): Promise<Message> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const newMsg: Message = {
        _id: `msg_${++msgCounter}`,
        chatId: dto.chatId,
        senderId: 'vendor_001',
        senderType: 'vendor',
        text: dto.text,
        read: false,
        createdAt: new Date().toISOString(),
      };
      if (!MOCK_MESSAGES[dto.chatId]) MOCK_MESSAGES[dto.chatId] = [];
      MOCK_MESSAGES[dto.chatId].push(newMsg);
      // Update chat's last message
      const chat = MOCK_CHATS.find((c) => c._id === dto.chatId);
      if (chat) {
        chat.lastMessage = newMsg;
        chat.updatedAt = newMsg.createdAt;
      }
      return newMsg;
    }
    const { data } = await apiClient.post<Message>(`/vendor/chats/${dto.chatId}/messages`, { text: dto.text });
    return data;
  },

  async markAsRead(chatId: string): Promise<void> {
    if (USE_MOCK) {
      const chat = MOCK_CHATS.find((c) => c._id === chatId);
      if (chat) chat.unreadCount = 0;
      const msgs = MOCK_MESSAGES[chatId];
      if (msgs) msgs.forEach((m) => { m.read = true; });
      return;
    }
    await apiClient.patch(`/vendor/chats/${chatId}/read`);
  },

  getTotalUnread(): number {
    return MOCK_CHATS.reduce((sum, c) => sum + c.unreadCount, 0);
  },
};
