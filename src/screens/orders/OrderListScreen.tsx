import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Badge, orderStatusVariant } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Avatar } from '../../components/ui/Avatar';
import { useOrders } from '../../hooks/useOrders';
import { SCREENS, COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatOrderDate } from '../../utils/formatDate';
import { Order, OrderStatus, ORDER_STATUS_LABELS } from '../../types/order.types';

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Delivered', value: 'delivered' },
];

export function OrderListScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: orders, isLoading, refetch } = useOrders();

  const filtered = (orders ?? []).filter((o) => {
    const matchTab = activeTab === 'all' || o.status === activeTab;
    const matchSearch = o.orderNumber.includes(search) ||
      o.user.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate(SCREENS.ORDER_DETAILS, { orderId: item._id })}
      style={styles.card}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Avatar uri={item.user.avatar} name={item.user.name} size={44} />
          <View>
            <Text style={styles.customer}>{item.user.name}</Text>
            <Text style={styles.orderNum}>{item.orderNumber}</Text>
          </View>
        </View>
        <Badge label={ORDER_STATUS_LABELS[item.status]} variant={orderStatusVariant(item.status)} />
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color="#94A3B8" />
          <Text style={styles.metaText}>{formatOrderDate(item.createdAt)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="bag-outline" size={12} color="#94A3B8" />
          <Text style={styles.metaText}>{item.items.length} item{item.items.length > 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(item.total)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Orders" showBack={false} />

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Status Tabs */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(t) => t.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            onPress={() => setActiveTab(tab.value)}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Orders */}
      <FlatList
        data={isLoading ? [] : filtered}
        keyExtractor={(o) => o._id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          isLoading
            ? <View style={{ gap: 10 }}>{[1, 2, 3].map((k) => <SkeletonCard key={k} />)}</View>
            : <EmptyState icon="🧾" title="No orders found" subtitle={activeTab !== 'all' ? `No ${activeTab} orders right now.` : 'Orders will appear here when customers place them.'} />
        }
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, color: COLORS.primary, fontSize: 14 },
  filterBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  tabs: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customer: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  orderNum: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  amount: { marginLeft: 'auto', fontSize: 15, fontWeight: '900', color: COLORS.primary },
});
