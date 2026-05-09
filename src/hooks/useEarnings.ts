import { useQuery } from '@tanstack/react-query';
import { earningsService } from '../services/earnings.service';

export const EARNINGS_KEY = ['earnings'] as const;

export function useEarningsSummary() {
  return useQuery({
    queryKey: [...EARNINGS_KEY, 'summary'],
    queryFn: earningsService.getSummary,
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: [...EARNINGS_KEY, 'transactions'],
    queryFn: earningsService.getTransactions,
  });
}

export function useWeeklyChart() {
  return useQuery({
    queryKey: [...EARNINGS_KEY, 'chart', 'weekly'],
    queryFn: earningsService.getWeeklyChart,
  });
}
