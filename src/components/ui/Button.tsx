import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS } from '../../utils/constants';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const baseContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 8,
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : undefined,
  };

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { height: 40, paddingHorizontal: 16 },
    md: { height: 52, paddingHorizontal: 20 },
    lg: { height: 60, paddingHorizontal: 24 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: COLORS.accent },
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.primary },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: COLORS.danger },
  };

  const textStyles: Record<string, TextStyle> = {
    primary: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
    outline: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
    ghost: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    danger: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  };

  const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: 13 },
    md: { fontSize: 15 },
    lg: { fontSize: 16 },
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[baseContainer, sizeStyles[size], variantStyles[variant], style as ViewStyle]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.primary : COLORS.accent}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[textStyles[variant], textSizeStyles[size]]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
