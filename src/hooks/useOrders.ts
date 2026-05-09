import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '../services/orders.service';
import { OrderStatus } from '../types/order.types';

export const ORDERS_KEY = ['orders'] as const;
export const DASHBOARD_STATS_KEY = ['dashboard-stats'] as const;

export function useOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: status ? [...ORDERS_KEY, status] : ORDERS_KEY,
    queryFn: () => ordersService.getAll(status),
    refetchInterval: 30_000, // poll every 30s as fallback
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [...ORDERS_KEY, id],
    queryFn: () => ordersService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateStatus(id, status),
    onSuccess: (updatedOrder) => {
      qc.invalidateQueries({ queryKey: ORDERS_KEY });
      qc.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
      // Optimistically update the specific order in cache
      qc.setQueryData([...ORDERS_KEY, updatedOrder._id], updatedOrder);
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_STATS_KEY,
    queryFn: ordersService.getDashboardStats,
    refetchInterval: 60_000,
  });
}
