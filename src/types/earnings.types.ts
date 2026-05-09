export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  totalOrders: number;
  pendingPayouts: number;
}

export interface Transaction {
  _id: string;
  type: 'order_income' | 'payout' | 'refund' | 'fee';
  title: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  createdAt: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}
