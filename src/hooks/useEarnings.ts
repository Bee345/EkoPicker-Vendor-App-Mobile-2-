import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { earningsService } from '../services/earnings.service';
import { SavePayoutAccountDto, RequestPayoutDto } from '../types/earnings.types';

export const EARNINGS_KEY = ['earnings'] as const;
export const PAYOUTS_KEY = ['payouts'] as const;
export const PAYOUT_ACCOUNT_KEY = [...PAYOUTS_KEY, 'account'] as const;
export const BANKS_KEY = [...PAYOUTS_KEY, 'banks'] as const;

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

// ─── Payouts (P0-09) ────────────────────────────────────────────────────────

export function useBanks() {
  return useQuery({
    queryKey: BANKS_KEY,
    queryFn: earningsService.getBanks,
    staleTime: 1000 * 60 * 60 * 24, // banks rarely change
  });
}

export function usePayoutAccount() {
  return useQuery({
    queryKey: PAYOUT_ACCOUNT_KEY,
    queryFn: earningsService.getPayoutAccount,
  });
}

export function useSavePayoutAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SavePayoutAccountDto) => earningsService.savePayoutAccount(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAYOUT_ACCOUNT_KEY }),
  });
}

export function usePayouts() {
  return useQuery({
    queryKey: PAYOUTS_KEY,
    queryFn: earningsService.getPayouts,
    refetchInterval: 30_000, // poll while a transfer is processing
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: RequestPayoutDto) => earningsService.requestPayout(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYOUTS_KEY });
      qc.invalidateQueries({ queryKey: [...EARNINGS_KEY, 'summary'] });
      qc.invalidateQueries({ queryKey: [...EARNINGS_KEY, 'transactions'] });
    },
  });
}
