import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREENS } from '../utils/constants';

import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { AuthChoiceScreen } from '../screens/auth/AuthChoiceScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterStep1Screen } from '../screens/auth/RegisterStep1Screen';
import { RegisterStep2Screen } from '../screens/auth/RegisterStep2Screen';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';

export type AuthStackParamList = {
  [SCREENS.SPLASH]: undefined;
  [SCREENS.ONBOARDING]: undefined;
  [SCREENS.AUTH_CHOICE]: undefined;
  [SCREENS.LOGIN]: undefined;
  [SCREENS.REGISTER_STEP1]: undefined;
  [SCREENS.REGISTER_STEP2]: { businessType: string; businessSubCategory?: string };
  [SCREENS.PENDING_APPROVAL]: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name={SCREENS.SPLASH} component={SplashScreen} />
      <Stack.Screen name={SCREENS.ONBOARDING} component={OnboardingScreen} />
      <Stack.Screen name={SCREENS.AUTH_CHOICE} component={AuthChoiceScreen} />
      <Stack.Screen name={SCREENS.LOGIN} component={LoginScreen} />
      <Stack.Screen name={SCREENS.REGISTER_STEP1} component={RegisterStep1Screen} />
      <Stack.Screen name={SCREENS.REGISTER_STEP2} component={RegisterStep2Screen} />
      <Stack.Screen name={SCREENS.PENDING_APPROVAL} component={PendingApprovalScreen} />
    </Stack.Navigator>
  );
}
