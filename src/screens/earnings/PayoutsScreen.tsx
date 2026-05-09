import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  useEarningsSummary,
  usePayoutAccount,
  useSavePayoutAccount,
  usePayouts,
  useRequestPayout,
  useBanks,
} from '../../hooks/useEarnings';
import { COLORS } from '../../utils/constants';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency';
import { formatTransactionDate } from '../../utils/formatDate';
import { parseApiError } from '../../utils/apiError';
import { Bank, Payout, PayoutStatus } from '../../types/earnings.types';

const STATUS_VARIANT: Record<PayoutStatus, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> =
  {
    success: 'success',
    pending: 'warning',
    processing: 'info',
    failed: 'danger',
    reversed: 'danger',
  };

export function PayoutsScreen() {
  const { data: summary } = useEarningsSummary();
  const { data: account, isLoading: accountLoading } = usePayoutAccount();
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();

  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);
  const [amount, setAmount] = useState('');

  const available = summary?.pendingPayouts ?? 0;
  const showAccountForm = !account || editingAccount;

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Payouts" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Available balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available for payout</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(available)}</Text>
          {summary?.nextPayoutDate && (
            <Text style={styles.balanceSub}>
              Next auto-payout {new Date(summary.nextPayoutDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Account section */}
        <Text style={styles.sectionTitle}>Bank Account</Text>
        {accountLoading ? (
          <SkeletonCard />
        ) : showAccountForm ? (
          <AccountForm
            initialBankCode={account?.bankCode}
            initialAccountNumber={account?.accountNumber}
            onCancel={() => setEditingAccount(false)}
            onSaved={() => setEditingAccount(false)}
            onPickBank={() => setBankPickerOpen(true)}
            bankPickerOpen={bankPickerOpen}
            setBankPickerOpen={setBankPickerOpen}
          />
        ) : (
          <View style={styles.accountCard}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.accountName}>{account.accountName}</Text>
              <Text style={styles.accountBank}>
                {account.bankName} · ****{account.accountNumber.slice(-4)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setEditingAccount(true)} style={styles.changeBtn}>
              <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Request payout */}
        {account && !editingAccount && (
          <>
            <Text style={styles.sectionTitle}>Request Payout</Text>
            <Input
              label="Amount (₦)"
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              leftIcon={<Ionicons name="cash-outline" size={18} color="#94A3B8" />}
            />
            <View style={styles.quickAmounts}>
              {[
                { label: '25%', value: Math.floor(available * 0.25) },
                { label: '50%', value: Math.floor(available * 0.5) },
                { label: 'Max', value: available },
              ].map((q) => (
                <TouchableOpacity
                  key={q.label}
                  onPress={() => setAmount(String(q.value))}
                  style={styles.quickPill}
                  disabled={available === 0}
                >
                  <Text style={styles.quickPillText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 12 }} />
            <RequestPayoutButton
              available={available}
              amount={amount}
              onSuccess={() => setAmount('')}
            />
          </>
        )}

        {/* History */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payout History</Text>
        {payoutsLoading ? (
          <SkeletonCard />
        ) : (payouts ?? []).length === 0 ? (
          <EmptyState
            icon="💸"
            title="No payouts yet"
            subtitle="Once you request a payout, it will appear here."
          />
        ) : (
          (payouts ?? []).map((p) => <PayoutRow key={p._id} payout={p} />)
        )}
      </ScrollView>
    </SafeScreen>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function AccountForm({
  initialBankCode,
  initialAccountNumber,
  onCancel,
  onSaved,
  bankPickerOpen,
  setBankPickerOpen,
}: {
  initialBankCode?: string;
  initialAccountNumber?: string;
  onCancel: () => void;
  onSaved: () => void;
  onPickBank: () => void;
  bankPickerOpen: boolean;
  setBankPickerOpen: (v: boolean) => void;
}) {
  const { data: banks } = useBanks();
  const saveMutation = useSavePayoutAccount();
  const [bankCode, setBankCode] = useState(initialBankCode ?? '');
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber ?? '');

  const selectedBank = useMemo(() => banks?.find((b) => b.code === bankCode), [banks, bankCode]);

  const handleSave = async () => {
    if (!bankCode) return Alert.alert('Pick a bank');
    if (!/^\d{10}$/.test(accountNumber)) {
      return Alert.alert('Invalid account number', 'Must be exactly 10 digits.');
    }
    try {
      await saveMutation.mutateAsync({ bankCode, accountNumber });
      Alert.alert('Saved', 'Bank account verified and saved.', [{ text: 'OK', onPress: onSaved }]);
    } catch (err) {
      Alert.alert('Could not save', parseApiError(err));
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <TouchableOpacity
        style={styles.bankPicker}
        onPress={() => setBankPickerOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="business-outline" size={18} color="#94A3B8" />
        <Text style={[styles.bankPickerText, !selectedBank && { color: '#94A3B8' }]}>
          {selectedBank ? selectedBank.name : 'Select bank'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#94A3B8" />
      </TouchableOpacity>
      <Input
        label="Account Number"
        placeholder="0123456789"
        keyboardType="numeric"
        value={accountNumber}
        onChangeText={setAccountNumber}
        maxLength={10}
        leftIcon={<Ionicons name="card-outline" size={18} color="#94A3B8" />}
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {initialBankCode && (
          <Button title="Cancel" variant="outline" onPress={onCancel} style={{ flex: 1 }} />
        )}
        <Button
          title="Save Account"
          onPress={handleSave}
          loading={saveMutation.isPending}
          fullWidth={!initialBankCode}
          style={{ flex: 1 }}
        />
      </View>

      <BankPickerModal
        visible={bankPickerOpen}
        banks={banks ?? []}
        onSelect={(b) => {
          setBankCode(b.code);
          setBankPickerOpen(false);
        }}
        onClose={() => setBankPickerOpen(false)}
      />
    </View>
  );
}

function BankPickerModal({
  visible,
  banks,
  onSelect,
  onClose,
}: {
  visible: boolean;
  banks: Bank[];
  onSelect: (b: Bank) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = banks.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeScreen>
        <ScreenHeader title="Select bank" onBack={onClose} />
        <View style={{ padding: 16 }}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search banks…"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.code}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelect(item)}
              style={styles.bankRow}
              activeOpacity={0.7}
            >
              <Text style={styles.bankRowText}>{item.name}</Text>
              <Text style={styles.bankRowCode}>{item.code}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeScreen>
    </Modal>
  );
}

function RequestPayoutButton({
  available,
  amount,
  onSuccess,
}: {
  available: number;
  amount: string;
  onSuccess: () => void;
}) {
  const requestMutation = useRequestPayout();
  const numeric = Number(amount);
  const valid = numeric > 0 && numeric <= available;

  const handle = () => {
    if (!valid) return;
    Alert.alert(
      'Confirm payout',
      `Send ${formatCurrency(numeric)} to your saved bank account? Funds typically arrive in 24 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await requestMutation.mutateAsync({ amount: numeric });
              onSuccess();
              Alert.alert('Payout requested', 'You can track its status below.');
            } catch (err) {
              Alert.alert('Payout failed', parseApiError(err));
            }
          },
        },
      ],
    );
  };

  return (
    <Button
      title={
        numeric > available
          ? 'Exceeds balance'
          : `Request ${numeric > 0 ? formatCurrencyCompact(numeric) : 'Payout'}`
      }
      fullWidth
      size="lg"
      disabled={!valid}
      loading={requestMutation.isPending}
      onPress={handle}
    />
  );
}

function PayoutRow({ payout }: { payout: Payout }) {
  return (
    <View style={styles.payoutCard}>
      <View style={styles.payoutIcon}>
        <Ionicons
          name={
            payout.status === 'success'
              ? 'checkmark-circle'
              : payout.status === 'failed' || payout.status === 'reversed'
                ? 'close-circle'
                : 'time'
          }
          size={20}
          color={
            payout.status === 'success'
              ? '#10B981'
              : payout.status === 'failed' || payout.status === 'reversed'
                ? '#F43F5E'
                : '#F59E0B'
          }
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.payoutAmount}>{formatCurrency(payout.amount)}</Text>
        <Text style={styles.payoutDate}>
          {formatTransactionDate(payout.completedAt ?? payout.initiatedAt)}
        </Text>
        {payout.failureReason && <Text style={styles.payoutErr}>{payout.failureReason}</Text>}
      </View>
      <Badge label={payout.status} variant={STATUS_VARIANT[payout.status]} size="sm" />
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  balanceSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6,
  },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 14,
  },
  accountName: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  accountBank: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  changeBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },

  bankPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  bankPickerText: { flex: 1, color: COLORS.primary, fontSize: 14, fontWeight: '500' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, color: COLORS.primary, fontSize: 14 },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bankRowText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  bankRowCode: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickPillText: { fontSize: 12, fontWeight: '700', color: '#64748B' },

  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  payoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutAmount: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  payoutDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  payoutErr: { fontSize: 11, color: '#F43F5E', fontWeight: '500', marginTop: 2 },
});
