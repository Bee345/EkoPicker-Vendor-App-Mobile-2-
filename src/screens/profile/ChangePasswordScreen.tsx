import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';

const schema = z
  .object({
    currentPassword: z.string().min(6, 'Enter current password'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      Alert.alert('Password Changed!', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      reset();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Change Password" />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="currentPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Current Password"
              placeholder="••••••••"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.currentPassword?.message}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />}
            />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="New Password"
              placeholder="Min. 8 characters"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.newPassword?.message}
              leftIcon={<Ionicons name="lock-open-outline" size={18} color="#94A3B8" />}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm New Password"
              placeholder="Re-enter new password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color="#94A3B8" />}
            />
          )}
        />
        <View style={{ height: 12 }} />
        <Button
          title="Update Password"
          fullWidth
          size="lg"
          loading={saving}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </SafeScreen>
  );
}
