import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/formatDate';

const MOCK_NOTIFICATIONS = [
  {
    _id: 'n1',
    type: 'order',
    title: 'New Order Received!',
    body: 'Raiden Lord placed an order worth ₦51,500.00',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    _id: 'n2',
    type: 'chat',
    title: 'New Message',
    body: 'Raiden Lord: Is my order ready yet?',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    _id: 'n3',
    type: 'system',
    title: 'Payout Processed',
    body: 'Your weekly payout of ₦250,000 has been sent to your bank account.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    _id: 'n4',
    type: 'order',
    title: 'Order #212321 Delivered',
    body: "Zhongli Li's order has been marked as delivered.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const NOTIF_ICON: Record<string, { name: string; color: string; bg: string }> = {
  order: { name: 'receipt-outline', color: COLORS.primary, bg: '#FEF9C3' },
  chat: { name: 'chatbubble-outline', color: '#3B82F6', bg: '#EFF6FF' },
  system: { name: 'information-circle-outline', color: '#10B981', bg: '#D1FAE5' },
};

export function NotificationsScreen() {
  const navigation = useNavigation();

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Notifications" />
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(n) => n._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="🔔"
            title="No notifications"
            subtitle="You'll be notified about new orders, messages, and payouts here."
          />
        }
        renderItem={({ item }) => {
          const cfg = NOTIF_ICON[item.type] ?? NOTIF_ICON.system;
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.card, !item.read && styles.cardUnread]}
            >
              <View style={[styles.icon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.name as any} size={20} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.title, !item.read && { color: COLORS.primary }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardUnread: { backgroundColor: '#FFFBEB', borderLeftWidth: 3, borderLeftColor: COLORS.accent },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  title: { flex: 1, fontSize: 14, fontWeight: '800', color: COLORS.primary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  body: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 6 },
  time: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
});
