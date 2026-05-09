export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  totalOrders: number;
  pendingPayouts: number;
  /** Period-over-period growth, as a fraction (0.125 = 12.5%). Replaces the hardcoded dashboard value. */
  growthVsLastWeek?: number;
  /** ISO date when the next automatic payout is scheduled (if applicable). */
  nextPayoutDate?: string;
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

// ─── Paystack Payouts (TASKS P0-09) ─────────────────────────────────────────

export type PayoutStatus = 'pending' | 'processing' | 'success' | 'failed' | 'reversed';

/**
 * The vendor's payout destination. One per vendor at v1.0; multi-account is a P3.
 * Stored server-side as a Paystack `recipient_code`; the bank/account fields below
 * are returned for display only.
 */
export interface PayoutAccount {
  _id: string;
  vendorId: string;
  bankCode: string;          // Paystack bank code (e.g. "058" for GTB)
  bankName: string;          // Resolved display name
  accountNumber: string;     // Last 4 typically masked client-side
  accountName: string;       // Resolved by Paystack /bank/resolve at server
  currency: 'NGN';
  /** Paystack returns this on first save; we never expose it client-side. */
  recipientCodePresent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavePayoutAccountDto {
  bankCode: string;
  accountNumber: string;
}

export interface Payout {
  _id: string;
  vendorId: string;
  amount: number;            // in kobo or major units — match backend; here: major (₦)
  status: PayoutStatus;
  /** Paystack transfer reference */
  reference: string;
  /** Reason returned by Paystack on failure */
  failureReason?: string;
  initiatedAt: string;
  completedAt?: string;
}

export interface RequestPayoutDto {
  amount: number;
}

export interface Bank {
  code: string;
  name: string;
}
