import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
  transparent?: boolean;
}

export function ScreenHeader({
  title,
  showBack = true,
  rightElement,
  onBack,
  transparent = false,
}: ScreenHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) onBack();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View
      style={{
        backgroundColor: transparent ? 'transparent' : '#fff',
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: transparent ? 0 : 1,
        borderBottomColor: '#F1F5F9',
      }}
    >
      {showBack ? (
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#F8FAFC',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}

      <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '800' }}>{title}</Text>

      {rightElement ? (
        <View style={{ width: 40, alignItems: 'flex-end' }}>{rightElement}</View>
      ) : (
        <View style={{ width: 40 }} />
      )}
    </View>
  );
}
