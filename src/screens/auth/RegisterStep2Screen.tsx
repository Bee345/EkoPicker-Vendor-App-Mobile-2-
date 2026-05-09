import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
import type { BusinessType } from '../../types/auth.types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type Route = RouteProp<AuthStackParamList, typeof SCREENS.REGISTER_STEP2>;

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(2, 'Enter your business name'),
  streetAddress: z.string().min(5, 'Enter your business address'),
});
type FormValues = z.infer<typeof schema>;

export function RegisterStep2Screen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { businessType, businessSubCategory } = route.params as {
    businessType: BusinessType;
    businessSubCategory?: string;
  };
  const { register, isLoading } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const message = await register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        businessName: values.businessName,
        businessType,
        businessSubCategory,
        address: {
          streetAddress: values.streetAddress,
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          locationType: 'independent',
        },
      });
      navigation.navigate(SCREENS.PENDING_APPROVAL);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message ?? 'Please try again.');
    }
  };

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.progress}>
          <View style={styles.progressDotDone}>
            <Ionicons name="checkmark" size={10} color={COLORS.primary} />
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>

        <Text style={styles.step}>Step 2 of 2</Text>
        <Text style={styles.title}>Create your{'\n'}vendor account</Text>
        <Text style={styles.subtitle}>Fill in your details to complete registration.</Text>

        {/* Business type badge */}
        <View style={styles.badge}>
          <Ionicons name="storefront-outline" size={14} color={COLORS.accentDark ?? '#CA8A04'} />
          <Text style={styles.badgeText}>
            {businessType.charAt(0).toUpperCase() + businessType.slice(1)} Business
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="John Doe"
                leftIcon={<Ionicons name="person-outline" size={18} color="#94A3B8" />}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
              />
            )}
          />
          <View style={{ height: 10 }} />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={18} color="#94A3B8" />}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <View style={{ height: 10 }} />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Phone Number"
                placeholder="+234 801 234 5678"
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={18} color="#94A3B8" />}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
              />
            )}
          />
          <View style={{ height: 10 }} />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Min. 8 characters"
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Info</Text>
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Business Name"
                placeholder="e.g. Etimobile Express"
                leftIcon={<Ionicons name="storefront-outline" size={18} color="#94A3B8" />}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.businessName?.message}
              />
            )}
          />
          <View style={{ height: 10 }} />
          <Controller
            control={control}
            name="streetAddress"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Business Address"
                placeholder="e.g. 23 Allen Ave, Ikeja"
                leftIcon={<Ionicons name="location-outline" size={18} color="#94A3B8" />}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.streetAddress?.message}
              />
            )}
          />
        </View>

        <Button
          title="Create Account"
          loading={isLoading}
          fullWidth
          size="lg"
          onPress={handleSubmit(onSubmit)}
          style={{ marginTop: 8 }}
        />
        <Text style={styles.terms}>
          By creating an account, you agree to our <Text style={styles.link}>Terms</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progress: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E2E8F0' },
  progressDotDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: COLORS.primary, width: 24, borderRadius: 5 },
  progressLine: { flex: 1, height: 2, backgroundColor: COLORS.accent, marginHorizontal: 6 },
  step: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 16 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  badgeText: { color: '#92400E', fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  terms: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 16, lineHeight: 18 },
  link: { color: COLORS.accent, fontWeight: '700' },
});
