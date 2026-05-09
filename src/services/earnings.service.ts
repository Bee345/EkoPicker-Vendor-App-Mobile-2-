import apiClient from './api';
import {
  EarningsSummary,
  Transaction,
  ChartDataPoint,
  PayoutAccount,
  SavePayoutAccountDto,
  Payout,
  RequestPayoutDto,
  Bank,
} from '../types/earnings.types';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

const MOCK_SUMMARY: EarningsSummary = {
  today: 51500,
  thisWeek: 312750,
  thisMonth: 982500,
  allTime: 4825000,
  totalOrders: 145,
  pendingPayouts: 120000,
  growthVsLastWeek: 0.125,
  nextPayoutDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
};

const MOCK_TRANSACTIONS: Transaction[] = [
  { _id: 't1', type: 'order_income', title: 'Order #212323', amount: 51500, status: 'completed', reference: 'ORD-212323', createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { _id: 't2', type: 'order_income', title: 'Order #212322', amount: 11500, status: 'completed', reference: 'ORD-212322', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { _id: 't3', type: 'payout', title: 'Weekly Payout', amount: -250000, status: 'completed', reference: 'PAY-001', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
  { _id: 't4', type: 'order_income', title: 'Order #212320', amount: 23500, status: 'failed', reference: 'ORD-212320', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { _id: 't5', type: 'order_income', title: 'Order #212319', amount: 29600, status: 'completed', reference: 'ORD-212319', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString() },
  { _id: 't6', type: 'fee', title: 'Platform Fee', amount: -4750, status: 'completed', reference: 'FEE-001', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString() },
];

const MOCK_WEEKLY_CHART: ChartDataPoint[] = [
  { label: 'Mon', value: 42000 },
  { label: 'Tue', value: 58000 },
  { label: 'Wed', value: 35000 },
  { label: 'Thu', value: 71000 },
  { label: 'Fri', value: 89500 },
  { label: 'Sat', value: 63000 },
  { label: 'Sun', value: 51500 },
];

// ─── Paystack mock state ────────────────────────────────────────────────────
let MOCK_PAYOUT_ACCOUNT: PayoutAccount | null = null;
const MOCK_PAYOUTS: Payout[] = [
  {
    _id: 'po_001',
    vendorId: 'vendor_001',
    amount: 250000,
    status: 'success',
    reference: 'TRF_eko_001',
    initiatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 71).toISOString(),
  },
];

// Top-15 Nigerian banks (real Paystack bank codes — useful for offline dev).
const MOCK_BANKS: Bank[] = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
];

let payoutCounter = 100;

export const earningsService = {
  async getSummary(): Promise<EarningsSummary> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return MOCK_SUMMARY;
    }
    const { data } = await apiClient.get<EarningsSummary>('/vendor/earnings/summary');
    return data;
  },

  async getTransactions(): Promise<Transaction[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      return MOCK_TRANSACTIONS;
    }
    const { data } = await apiClient.get<Transaction[]>('/vendor/earnings/transactions');
    return data;
  },

  async getWeeklyChart(): Promise<ChartDataPoint[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return MOCK_WEEKLY_CHART;
    }
    const { data } = await apiClient.get<ChartDataPoint[]>('/vendor/earnings/chart/weekly');
    return data;
  },

  // ─── Payouts (P0-09) ──────────────────────────────────────────────────────

  async getBanks(): Promise<Bank[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      return MOCK_BANKS;
    }
    const { data } = await apiClient.get<Bank[]>('/vendor/payouts/banks');
    return data;
  },

  async getPayoutAccount(): Promise<PayoutAccount | null> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      return MOCK_PAYOUT_ACCOUNT;
    }
    try {
      const { data } = await apiClient.get<PayoutAccount>('/vendor/payouts/account');
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  async savePayoutAccount(dto: SavePayoutAccountDto): Promise<PayoutAccount> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 700));
      const bank = MOCK_BANKS.find((b) => b.code === dto.bankCode);
      if (!bank) throw new Error('Unknown bank code');
      if (!/^\d{10}$/.test(dto.accountNumber)) {
        throw new Error('Account number must be 10 digits');
      }
      MOCK_PAYOUT_ACCOUNT = {
        _id: 'pa_001',
        vendorId: 'vendor_001',
        bankCode: dto.bankCode,
        bankName: bank.name,
        accountNumber: dto.accountNumber,
        // Mock resolution — real backend asks Paystack /bank/resolve
        accountName: 'Etimobile Express Nigeria Limited',
        currency: 'NGN',
        recipientCodePresent: true,
        createdAt: MOCK_PAYOUT_ACCOUNT?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return MOCK_PAYOUT_ACCOUNT;
    }
    const { data } = await apiClient.post<PayoutAccount>('/vendor/payouts/account', dto);
    return data;
  },

  async getPayouts(): Promise<Payout[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return [...MOCK_PAYOUTS].sort(
        (a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime(),
      );
    }
    const { data } = await apiClient.get<Payout[]>('/vendor/payouts');
    return data;
  },

  async requestPayout(dto: RequestPayoutDto): Promise<Payout> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      if (!MOCK_PAYOUT_ACCOUNT) {
        throw new Error('Add a payout account first');
      }
      if (dto.amount <= 0) throw new Error('Amount must be positive');
      if (dto.amount > MOCK_SUMMARY.pendingPayouts) {
        throw new Error('Amount exceeds available balance');
      }
      const payout: Payout = {
        _id: `po_${++payoutCounter}`,
        vendorId: 'vendor_001',
        amount: dto.amount,
        status: 'processing',
        reference: `TRF_eko_${payoutCounter}`,
        initiatedAt: new Date().toISOString(),
      };
      MOCK_PAYOUTS.unshift(payout);
      MOCK_SUMMARY.pendingPayouts = Math.max(0, MOCK_SUMMARY.pendingPayouts - dto.amount);
      // Simulate Paystack webhook resolving status after a few seconds.
      setTimeout(() => {
        const idx = MOCK_PAYOUTS.findIndex((p) => p._id === payout._id);
        if (idx !== -1) {
          MOCK_PAYOUTS[idx] = {
            ...MOCK_PAYOUTS[idx],
            status: 'success',
            completedAt: new Date().toISOString(),
          };
        }
      }, 4000);
      return payout;
    }
    const { data } = await apiClient.post<Payout>('/vendor/payouts', dto);
    return data;
  },
};
