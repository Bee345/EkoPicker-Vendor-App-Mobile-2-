import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { useSocketStore } from '../../store/socket.store';
import { useDashboardStats, useOrders } from '../../hooks/useOrders';
import { SCREENS, COLORS, BUSINESS_TYPE_GREETINGS } from '../../utils/constants';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency';
import { formatOrderDate } from '../../utils/formatDate';
import { Badge, orderStatusVariant } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { getSocket } from '../../services/socket';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { vendor } = useAuthStore();
  const { pendingNewOrders, addPendingOrder } = useSocketStore();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchOrders } = useOrders();

  // Listen for real-time new orders from socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (order: any) => {
      addPendingOrder(order);
      refetchOrders();
      refetchStats();
    };
    socket.on('new_order', handler);
    return () => { socket.off('new_order', handler); };
  }, [addPendingOrder, refetchOrders, refetchStats]);

  const greeting = vendor?.businessType ? BUSINESS_TYPE_GREETINGS[vendor.businessType] : 'Hello,';
  const displayed = recentOrders?.slice(0, 3) ?? [];

  const quickActions = [
    { icon: 'bag-outline', label: 'Products', screen: SCREENS.PRODUCT_LIST, color: '#EFF6FF' },
    { icon: 'receipt-outline', label: 'Orders', screen: SCREENS.ORDER_LIST, color: '#FFF7ED' },
    { icon: 'chatbubbles-outline', label: 'Chat', screen: SCREENS.CHAT_LIST, color: '#F0FDF4' },
    { icon: 'wallet-outline', label: 'Earnings', screen: SCREENS.EARNINGS, color: '#FFF1F2' },
  ];

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={statsLoading || ordersLoading}
          onRefresh={() => { refetchStats(); refetchOrders(); }}
          tintColor={COLORS.accent}
        />
      }
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.navigate('More', { screen: SCREENS.PROFILE })}>
            {vendor?.avatar
              ? <Image source={{ uri: vendor.avatar }} style={styles.avatar} />
              : <View style={[styles.avatar, { backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 18 }}>
                    {vendor?.name?.[0] ?? 'V'}
                  </Text>
                </View>
            }
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.businessName} numberOfLines={1}>{vendor?.businessName ?? 'My Business'}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard', { screen: SCREENS.NOTIFICATIONS })}
          style={styles.bellBtn}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {/* ─── Revenue Card ─────────────────────────────────────────── */}
      <View style={styles.revenueCardWrap}>
        <View style={styles.revenueCard}>
          <View style={styles.revenueCardCircle1} />
          <View style={styles.revenueCardCircle2} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <View>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueAmount}>
                {statsLoading ? '...' : formatCurrencyCompact(stats?.totalRevenue ?? 0)}
              </Text>
            </View>
            <View style={styles.revenueBadge}>
              <Ionicons name="trending-up" size={14} color="#10B981" />
              <Text style={styles.revenueBadgeText}>+12.5%</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {[
              { label: "Today's Orders", value: stats?.todayOrders ?? 0, icon: 'bag-check-outline' },
              { label: 'Pending', value: stats?.pendingOrders ?? 0, icon: 'time-outline' },
              { label: 'Completed', value: stats?.completedOrders ?? 0, icon: 'checkmark-circle-outline' },
            ].map((s) => (
              <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.statValue}>{statsLoading ? '-' : s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ─── Quick Actions ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              activeOpacity={0.8}
              onPress={() => {
                const tabMap: Record<string, string> = {
                  [SCREENS.PRODUCT_LIST]: 'Products',
                  [SCREENS.ORDER_LIST]: 'Orders',
                  [SCREENS.CHAT_LIST]: 'Chat',
                  [SCREENS.EARNINGS]: 'More',
                };
                navigation.navigate(tabMap[qa.screen] ?? 'Dashboard', { screen: qa.screen });
              }}
              style={[styles.quickCard, { backgroundColor: qa.color }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#fff' }]}>
                <Ionicons name={qa.icon as any} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.quickLabel}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── New order banner if socket sent one ──────────────────── */}
      {pendingNewOrders.length > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Orders', { screen: SCREENS.ORDER_LIST })}
          style={styles.newOrderBanner}
        >
          <Ionicons name="flash" size={16} color={COLORS.primary} />
          <Text style={styles.newOrderText}>
            🎉 {pendingNewOrders.length} new order{pendingNewOrders.length > 1 ? 's' : ''} received!
          </Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* ─── Recent Orders ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders', { screen: SCREENS.ORDER_LIST })}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {ordersLoading
          ? [1, 2].map((k) => <SkeletonCard key={k} />)
          : displayed.length === 0
          ? <Text style={styles.empty}>No orders yet.</Text>
          : displayed.map((order) => (
            <TouchableOpacity
              key={order._id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Orders', { screen: SCREENS.ORDER_DETAILS, params: { orderId: order._id } })}
              style={styles.orderCard}
            >
              <View style={styles.orderCardLeft}>
                <View style={styles.orderIcon}>
                  <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.orderCustomer}>{order.user.name}</Text>
                  <Text style={styles.orderMeta}>{order.orderNumber} · {formatOrderDate(order.createdAt)}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.orderAmount}>{formatCurrency(order.total)}</Text>
                <Badge label={order.status.replace(/_/g, ' ')} variant={orderStatusVariant(order.status)} size="sm" />
              </View>
            </TouchableOpacity>
          ))
        }
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  avatar: { width: 48, height: 48, borderRadius: 16, borderWidth: 2, borderColor: COLORS.accent },
  greeting: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  businessName: { fontSize: 15, fontWeight: '800', color: COLORS.primary, maxWidth: 200 },
  bellBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  bellDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F43F5E', borderWidth: 1.5, borderColor: '#fff' },
  revenueCardWrap: { paddingHorizontal: 20, marginTop: 16, marginBottom: 4 },
  revenueCard: { backgroundColor: COLORS.primary, borderRadius: 28, padding: 24, overflow: 'hidden', position: 'relative' },
  revenueCardCircle1: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(250,204,21,0.1)' },
  revenueCardCircle2: { position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
  revenueLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  revenueAmount: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  revenueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  revenueBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '800' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 2 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginBottom: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  viewAll: { color: COLORS.accent, fontWeight: '800', fontSize: 13 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: '47%', padding: 16, borderRadius: 20, gap: 10 },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  quickLabel: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  newOrderBanner: { marginHorizontal: 20, marginTop: 16, backgroundColor: COLORS.accent, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  newOrderText: { flex: 1, color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  orderCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  orderCustomer: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  orderMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  orderAmount: { fontSize: 14, fontWeight: '900', color: COLORS.primary },
  empty: { color: '#94A3B8', textAlign: 'center', paddingVertical: 20 },
});
