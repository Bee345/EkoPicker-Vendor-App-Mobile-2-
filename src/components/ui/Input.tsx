import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS } from '../../utils/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry ?? false);

  return (
    <View style={[{ marginBottom: 4 }, containerStyle]}>
      {label && (
        <Text
          style={{
            color: COLORS.muted,
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 6,
            marginLeft: 4,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 56,
          backgroundColor: '#F8FAFC',
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: error ? COLORS.danger : isFocused ? COLORS.accent : '#E2E8F0',
          paddingHorizontal: 16,
          gap: 10,
        }}
      >
        {leftIcon && <View style={{ opacity: 0.6 }}>{leftIcon}</View>}
        <TextInput
          style={{
            flex: 1,
            color: COLORS.primary,
            fontSize: 14,
            fontWeight: '500',
          }}
          placeholderTextColor={COLORS.mutedLight}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
            <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '600' }}>
              {isSecure ? 'SHOW' : 'HIDE'}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress}>{rightIcon}</TouchableOpacity>
        ) : null}
      </View>
      {error && (
        <Text style={{ color: COLORS.danger, fontSize: 11, marginTop: 4, marginLeft: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
