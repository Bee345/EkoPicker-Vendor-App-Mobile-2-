import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import { getSocket, joinChat, leaveChat, emitTyping, sendSocketMessage } from '../services/socket';
import { useSocketStore } from '../store/socket.store';
import { Message } from '../types/chat.types';

export const CHATS_KEY = ['chats'] as const;
export const MESSAGES_KEY = (chatId: string) => ['messages', chatId] as const;

export function useChats() {
  return useQuery({
    queryKey: CHATS_KEY,
    queryFn: chatService.getChats,
  });
}

export function useChat(chatId: string) {
  const qc = useQueryClient();
  const setTyping = useSocketStore((s) => s.setTyping);
  const incrementUnread = useSocketStore((s) => s.incrementUnread);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const messagesQuery = useQuery({
    queryKey: MESSAGES_KEY(chatId),
    queryFn: () => chatService.getMessages(chatId),
    enabled: !!chatId,
  });

  useEffect(() => {
    if (!chatId) return;
    joinChat(chatId);
    chatService.markAsRead(chatId).then(() => {
      // Refresh chat list so unread badges clear.
      qc.invalidateQueries({ queryKey: CHATS_KEY });
    });

    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.chatId !== chatId) {
        incrementUnread();
        qc.invalidateQueries({ queryKey: CHATS_KEY });
        return;
      }
      qc.setQueryData<Message[]>(MESSAGES_KEY(chatId), (prev) => (prev ? [...prev, msg] : [msg]));
    };

    const handleTyping = (data: { chatId: string; isTyping: boolean; senderType: string }) => {
      if (data.chatId === chatId && data.senderType === 'user') {
        setTyping(chatId, data.isTyping);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        if (data.isTyping) {
          typingTimer.current = setTimeout(() => setTyping(chatId, false), 3000);
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTyping);

    return () => {
      leaveChat(chatId);
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTyping);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [chatId, qc, setTyping, incrementUnread]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => chatService.sendMessage({ chatId, text }),
    onSuccess: (msg) => {
      qc.setQueryData<Message[]>(MESSAGES_KEY(chatId), (prev) => (prev ? [...prev, msg] : [msg]));
      qc.invalidateQueries({ queryKey: CHATS_KEY });
    },
  });

  // Always go through REST so we get an ACK + cache update; mirror to socket for
  // server-side fan-out to other parties (the server should still echo via
  // `new_message` to remote clients).
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    const socket = getSocket();
    if (socket?.connected) sendSocketMessage(chatId, trimmed);
    await sendMutation.mutateAsync(trimmed);
  };

  const notifyTyping = (isTyping: boolean) => emitTyping(chatId, isTyping);

  return { messagesQuery, sendMessage, notifyTyping, isSending: sendMutation.isPending };
}
