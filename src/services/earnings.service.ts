import apiClient from './api';
import { EarningsSummary, Transaction, ChartDataPoint } from '../types/earnings.types';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

const MOCK_SUMMARY: EarningsSummary = {
  today: 51500,
  thisWeek: 312750,
  thisMonth: 982500,
  allTime: 4825000,
  totalOrders: 145,
  pendingPayouts: 120000,
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
};
