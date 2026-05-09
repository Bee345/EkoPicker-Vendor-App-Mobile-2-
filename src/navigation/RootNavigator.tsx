import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../utils/constants';

export function RootNavigator() {
  const { isAuthenticated, isLoading, vendor, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  // Show app only if authenticated and approved
  const showApp = isAuthenticated && vendor?.status === 'approved';

  return (
    <NavigationContainer>
      {showApp ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
