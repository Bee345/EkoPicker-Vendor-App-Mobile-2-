export interface ChatUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  senderType: 'vendor' | 'user';
  text: string;
  read: boolean;
  createdAt: string;
}

export interface Chat {
  _id: string;
  vendorId: string;
  userId: string;
  user: ChatUser;
  lastMessage?: Message;
  unreadCount: number;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageDto {
  chatId: string;
  text: string;
}
