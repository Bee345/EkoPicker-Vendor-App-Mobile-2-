import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { COLORS } from '../../utils/constants';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#D1FAE5', text: '#059669' },
  warning: { bg: '#FEF3C7', text: '#D97706' },
  danger:  { bg: '#FFE4E6', text: '#E11D48' },
  info:    { bg: '#DBEAFE', text: '#2563EB' },
  neutral: { bg: '#F1F5F9', text: '#64748B' },
  accent:  { bg: '#FEF9C3', text: '#92400E' },
};

export function Badge({ label, variant = 'neutral', size = 'md', style }: BadgeProps) {
  const { bg, text } = BADGE_STYLES[variant];
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: 100,
          paddingHorizontal: size === 'sm' ? 8 : 12,
          paddingVertical: size === 'sm' ? 2 : 4,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text style={{ color: text, fontSize: size === 'sm' ? 10 : 11, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

/** Map OrderStatus → BadgeVariant */
export function orderStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'pending':          return 'warning';
    case 'confirmed':        return 'info';
    case 'preparing':        return 'accent';
    case 'ready_for_pickup': return 'success';
    case 'picked_up':        return 'success';
    case 'delivered':        return 'success';
    case 'cancelled':        return 'danger';
    default:                 return 'neutral';
  }
}
