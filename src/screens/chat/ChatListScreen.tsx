import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useChats } from '../../hooks/useChat';
import { SCREENS, COLORS } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/formatDate';
import { Chat } from '../../types/chat.types';

export function ChatListScreen() {
  const navigation = useNavigation<any>();
  const { data: chats, isLoading, refetch } = useChats();

  const renderChat = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate(SCREENS.CHAT_CONVERSATION, {
          chatId: item._id,
          userName: item.user.name,
          userAvatar: item.user.avatar,
        })
      }
      style={styles.card}
    >
      <View style={{ position: 'relative' }}>
        <Avatar uri={item.user.avatar} name={item.user.name} size={52} />
        <View style={styles.onlineDot} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{item.user.name}</Text>
          {item.lastMessage && (
            <Text style={styles.time}>{formatRelativeTime(item.lastMessage.createdAt)}</Text>
          )}
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage
              ? (item.lastMessage.senderType === 'vendor' ? 'You: ' : '') + item.lastMessage.text
              : 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        {item.orderId && (
          <Text style={styles.orderRef}>
            <Ionicons name="receipt-outline" size={10} /> Linked to order
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Messages" showBack={false} />
      <FlatList
        data={isLoading ? [] : (chats ?? [])}
        keyExtractor={(c) => c._id}
        renderItem={renderChat}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 10 }}>
              {[1, 2, 3].map((k) => (
                <SkeletonCard key={k} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="💬"
              title="No conversations yet"
              subtitle="Chats with your customers will appear here after they order from you."
            />
          )
        }
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 24, gap: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  time: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lastMsg: { flex: 1, fontSize: 13, color: '#64748B', fontWeight: '500' },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  orderRef: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 4 },
});
