/**
 * Format a number as Nigerian Naira currency string.
 * e.g. 4500 → "₦4,500.00"
 */
export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format a number as a compact currency string (for cards).
 * e.g. 482500 → "₦482.5K"
 */
export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(1)}K`;
  }
  return `₦${amount.toFixed(0)}`;
};
