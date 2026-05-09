import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/ui/Button';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { SCREENS, COLORS } from '../../utils/constants';
import { useAuthStore } from '../../store/auth.store';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function PendingApprovalScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuthStore();

  return (
    <SafeScreen style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="time" size={64} color={COLORS.accent} />
      </View>
      <Text style={styles.title}>Application Submitted!</Text>
      <Text style={styles.subtitle}>
        Your vendor account is under review. Our team will verify your business details within 24–48
        hours. You'll receive an email notification once approved.
      </Text>

      <View style={styles.steps}>
        {[
          { icon: 'checkmark-circle', label: 'Account created', done: true },
          { icon: 'time-outline', label: 'Admin review in progress', done: false },
          { icon: 'lock-open-outline', label: 'Account activated', done: false },
        ].map((step, i) => (
          <View key={i} style={styles.step}>
            <Ionicons name={step.icon as any} size={20} color={step.done ? '#10B981' : '#CBD5E1'} />
            <Text style={[styles.stepLabel, { color: step.done ? COLORS.primary : '#94A3B8' }]}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <Button
        title="Back to Login"
        variant="outline"
        fullWidth
        size="lg"
        onPress={() => {
          logout();
          navigation.navigate(SCREENS.LOGIN);
        }}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 36,
    maxWidth: 320,
  },
  steps: { width: '100%', gap: 16, marginBottom: 40 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
  },
  stepLabel: { fontSize: 14, fontWeight: '600' },
});
