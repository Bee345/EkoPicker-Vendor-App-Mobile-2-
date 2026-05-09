import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>{icon}</Text>
      <Text
        style={{
          color: COLORS.primary,
          fontSize: 18,
          fontWeight: '800',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            color: COLORS.muted,
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          style={{
            backgroundColor: COLORS.accent,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 14 }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
