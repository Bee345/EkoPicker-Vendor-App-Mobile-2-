import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useEarningsSummary, useTransactions, useWeeklyChart } from '../../hooks/useEarnings';
import { COLORS } from '../../utils/constants';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency';
import { formatTransactionDate } from '../../utils/formatDate';
import { Transaction } from '../../types/earnings.types';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 120;
const PERIODS: { label: string; key: 'today' | 'thisWeek' | 'thisMonth' | 'allTime' }[] = [
  { label: 'Today', key: 'today' },
  { label: 'This Week', key: 'thisWeek' },
  { label: 'This Month', key: 'thisMonth' },
  { label: 'All Time', key: 'allTime' },
];

export function EarningsScreen() {
  const [activePeriod, setActivePeriod] = useState<'today' | 'thisWeek' | 'thisMonth' | 'allTime'>('thisMonth');
  const { data: summary, isLoading: sumLoading, refetch: refetchSum } = useEarningsSummary();
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useTransactions();
  const { data: chartData, isLoading: chartLoading } = useWeeklyChart();

  const currentAmount = summary ? summary[activePeriod] : 0;
  const maxVal = Math.max(...(chartData?.map((d) => d.value) ?? [1]));

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Earnings" showBack={false} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={sumLoading || txLoading} onRefresh={() => { refetchSum(); refetchTx(); }} tintColor={COLORS.accent} />}
      >
        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.rcCircle1} />
          <View style={styles.rcCircle2} />
          <Text style={styles.rcLabel}>Earnings Overview</Text>
          <Text style={styles.rcAmount}>{sumLoading ? '...' : formatCurrencyCompact(currentAmount)}</Text>
          <Text style={styles.rcSub}>
            {summary?.pendingPayouts ? `₦${formatCurrencyCompact(summary.pendingPayouts)} pending payout` : ''}
          </Text>
          {/* Period tabs */}
          <View style={styles.periodTabs}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setActivePeriod(p.key)}
                style={[styles.periodTab, activePeriod === p.key && styles.periodTabActive]}
              >
                <Text style={[styles.periodText, activePeriod === p.key && styles.periodTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { icon: 'receipt-outline', label: 'Total Orders', value: summary?.totalOrders ?? 0 },
            { icon: 'trending-up-outline', label: 'This Month', value: formatCurrencyCompact(summary?.thisMonth ?? 0) },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={styles.statIcon}><Ionicons name={s.icon as any} size={20} color={COLORS.primary} /></View>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bar Chart */}
        {!chartLoading && chartData && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weekly Revenue</Text>
            <View style={styles.chart}>
              {chartData.map((d, i) => {
                const barH = Math.max((d.value / maxVal) * CHART_HEIGHT, 4);
                return (
                  <View key={i} style={styles.barWrap}>
                    <Text style={styles.barVal}>{formatCurrencyCompact(d.value)}</Text>
                    <View style={[styles.bar, { height: barH, backgroundColor: i === chartData.length - 1 ? COLORS.accent : '#E2E8F0' }]} />
                    <Text style={styles.barLabel}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Transactions */}
        <View style={styles.txSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {txLoading
            ? [1, 2, 3].map((k) => <SkeletonCard key={k} />)
            : (transactions ?? []).length === 0
            ? <EmptyState icon="🧾" title="No transactions" subtitle="Your transaction history will appear here." />
            : (transactions ?? []).map((tx) => <TransactionRow key={tx._id} tx={tx} />)
          }
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'order_income';
  return (
    <View style={styles.txCard}>
      <View style={[styles.txIcon, { backgroundColor: isCredit ? '#D1FAE5' : tx.type === 'fee' ? '#FFE4E6' : '#EFF6FF' }]}>
        <Ionicons
          name={isCredit ? 'arrow-down' : tx.type === 'payout' ? 'arrow-up' : tx.type === 'fee' ? 'remove-circle-outline' : 'refresh-outline'}
          size={18}
          color={isCredit ? '#10B981' : tx.type === 'fee' ? '#F43F5E' : '#3B82F6'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txTitle}>{tx.title}</Text>
        <Text style={styles.txDate}>{formatTransactionDate(tx.createdAt)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.txAmount, { color: isCredit ? '#10B981' : '#F43F5E' }]}>
          {isCredit ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
        </Text>
        <Text style={[styles.txStatus, { color: tx.status === 'completed' ? '#10B981' : tx.status === 'failed' ? '#F43F5E' : '#F59E0B' }]}>
          {tx.status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  revenueCard: { margin: 16, backgroundColor: COLORS.primary, borderRadius: 28, padding: 24, overflow: 'hidden', position: 'relative' },
  rcCircle1: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(250,204,21,0.1)' },
  rcCircle2: { position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)' },
  rcLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  rcAmount: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1.5, marginBottom: 6 },
  rcSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500', marginBottom: 20 },
  periodTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, gap: 2 },
  periodTab: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  periodTabActive: { backgroundColor: COLORS.accent },
  periodText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },
  periodTextActive: { color: COLORS.primary },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textAlign: 'center' },
  chartCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  chartTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: CHART_HEIGHT + 50 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  barVal: { fontSize: 8, color: '#94A3B8', fontWeight: '600', textAlign: 'center' },
  bar: { width: '60%', borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  txSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginBottom: 14 },
  txCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  txIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  txDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  txAmount: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
  txStatus: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
