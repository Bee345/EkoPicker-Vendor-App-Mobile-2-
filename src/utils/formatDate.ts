import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format an ISO date string for display in order lists.
 * e.g. "Today | 9:00 am", "Yesterday | 4:15 pm", "Apr 12 | 2:30 pm"
 */
export const formatOrderDate = (isoString: string): string => {
  const date = new Date(isoString);
  const timeStr = format(date, 'h:mm aa');
  if (isToday(date)) return `Today | ${timeStr}`;
  if (isYesterday(date)) return `Yesterday | ${timeStr}`;
  return `${format(date, 'MMM d')} | ${timeStr}`;
};

/**
 * Format a date as a relative time string.
 * e.g. "2 minutes ago", "3 hours ago"
 */
export const formatRelativeTime = (isoString: string): string => {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true });
};

/**
 * Format a date for transaction history.
 * e.g. "Apr 15, 2026 · 10:30 am"
 */
export const formatTransactionDate = (isoString: string): string => {
  return format(new Date(isoString), "MMM d, yyyy · h:mm aa");
};

/**
 * Format a time string from ISO.
 * e.g. "10:30 am"
 */
export const formatTime = (isoString: string): string => {
  return format(new Date(isoString), 'h:mm aa');
};
