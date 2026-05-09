import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { useAuthStore } from '../../store/auth.store';
import { SCREENS, COLORS } from '../../utils/constants';
import { parseApiError } from '../../utils/apiError';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, isLoading, error, clearError } = useAuthStore();

  // Demo credentials are pre-filled only in mock mode so we don't ship them in release builds.
  const useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: useMock
      ? { email: 'vendor@ekopicker.com', password: 'password123' }
      : { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    clearError();
    try {
      await login(values);
      // RootNavigator will automatically switch to AppNavigator
    } catch (err) {
      Alert.alert('Login Failed', parseApiError(err, 'Please check your credentials and try again.'));
    }
  };

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="bag-handle" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.brand}>Eko<Text style={styles.accent}>Picker</Text></Text>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your vendor account to manage your business.</Text>

        {/* Demo hint — mock mode only */}
        {useMock && (
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={14} color="#2563EB" />
            <Text style={styles.hintText}>Demo: vendor@ekopicker.com / password123</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control} name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color="#94A3B8" />}
                value={value} onChangeText={onChange} onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <View style={{ height: 12 }} />
          <Controller
            control={control} name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />}
                value={value} onChangeText={onChange} onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <Button title="Sign In" loading={isLoading} fullWidth size="lg" onPress={handleSubmit(onSubmit)} />

        <TouchableOpacity onPress={() => navigation.navigate(SCREENS.REGISTER_STEP1)} style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Text style={styles.signupLink}>Create one</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 24, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  accent: { color: COLORS.accent },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 20 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10, marginBottom: 24 },
  hintText: { color: '#2563EB', fontSize: 12, fontWeight: '500' },
  form: { marginBottom: 24 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 12, padding: 4 },
  forgotText: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupText: { color: '#64748B', fontSize: 14 },
  signupLink: { color: COLORS.accent, fontWeight: '800', fontSize: 14 },
});
