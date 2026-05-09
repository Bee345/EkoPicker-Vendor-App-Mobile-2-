import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { useChat } from '../../hooks/useChat';
import { useSocketStore } from '../../store/socket.store';
import { useAuthStore } from '../../store/auth.store';
import { COLORS } from '../../utils/constants';
import { formatTime } from '../../utils/formatDate';
import { Message } from '../../types/chat.types';

export function ChatConversationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chatId, userName, userAvatar } = route.params;
  const insets = useSafeAreaInsets();
  const { vendor } = useAuthStore();
  const { typingUsers } = useSocketStore();

  const { messagesQuery, sendMessage, notifyTyping, isSending } = useChat(chatId);
  const [text, setText] = useState('');
  const flatRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  const messages = messagesQuery.data ?? [];
  const isTyping = typingUsers[chatId];

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
    notifyTyping(false);
  };

  const handleTyping = (val: string) => {
    setText(val);
    notifyTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => notifyTyping(false), 2000);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderType === 'vendor';
    return (
      <View style={[styles.msgWrap, isOwn ? styles.msgRight : styles.msgLeft]}>
        {!isOwn && <Avatar uri={userAvatar} name={userName} size={28} style={styles.msgAvatar} />}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isOwn && { color: COLORS.primary }]}>{item.text}</Text>
          <Text style={[styles.bubbleTime, isOwn && { color: 'rgba(15,23,42,0.5)' }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Avatar uri={userAvatar} name={userName} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{userName}</Text>
          {isTyping ? (
            <Text style={styles.typingText}>typing...</Text>
          ) : (
            <Text style={styles.onlineText}>● Online</Text>
          )}
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {messagesQuery.isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <View style={[styles.inputWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            value={text}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity onPress={handleSend} disabled={!text.trim() || isSending} style={[styles.sendBtn, { opacity: text.trim() ? 1 : 0.4 }]}>
            <Ionicons name="send" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  typingText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  onlineText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  msgList: { padding: 16, gap: 10, paddingBottom: 20 },
  msgWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  msgLeft: { justifyContent: 'flex-start' },
  msgRight: { justifyContent: 'flex-end' },
  msgAvatar: { marginBottom: 4 },
  bubble: { maxWidth: '75%', borderRadius: 18, padding: 12 },
  bubbleOwn: { backgroundColor: COLORS.accent, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleText: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: '#94A3B8', marginTop: 4, alignSelf: 'flex-end' },
  inputWrap: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  inputBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: '#F8FAFC', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  textInput: { flex: 1, color: COLORS.primary, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
});
