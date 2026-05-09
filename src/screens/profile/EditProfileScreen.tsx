import React from 'react';
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
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  businessName: z.string().min(2, 'Enter business name'),
});
type FormValues = z.infer<typeof schema>;

export function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { vendor, updateVendor } = useAuthStore();
  const [saving, setSaving] = React.useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: vendor?.name ?? '',
      phone: vendor?.phone ?? '',
      businessName: vendor?.businessName ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const updated = await authService.updateProfile(values);
      updateVendor(updated);
      Alert.alert('Saved!', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Edit Profile" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Controller control={control} name="name" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Full Name" placeholder="Your full name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} leftIcon={<Ionicons name="person-outline" size={18} color="#94A3B8" />} />
        )} />
        <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Phone Number" placeholder="+234 801 234 5678" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phone?.message} leftIcon={<Ionicons name="call-outline" size={18} color="#94A3B8" />} />
        )} />
        <Controller control={control} name="businessName" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Business Name" placeholder="Your business name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.businessName?.message} leftIcon={<Ionicons name="storefront-outline" size={18} color="#94A3B8" />} />
        )} />
        <View style={{ height: 12 }} />
        <Button title="Save Changes" fullWidth size="lg" loading={saving} onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </SafeScreen>
  );
}
