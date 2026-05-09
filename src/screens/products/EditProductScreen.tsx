import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useProduct, useUpdateProduct } from '../../hooks/useProducts';
import { COLORS } from '../../utils/constants';

const schema = z.object({
  name: z.string().min(2, 'Enter product name'),
  description: z.string().min(10, 'Min 10 characters'),
  price: z.string().min(1, 'Enter price').refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be positive'),
  category: z.string().min(2, 'Enter category'),
  brand: z.string().optional(),
  sku: z.string().optional(),
  quantityInStock: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function EditProductScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { productId } = route.params;
  const { data: product, isLoading } = useProduct(productId);
  const updateMutation = useUpdateProduct(productId);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        price: String(product.price),
        category: product.category,
        brand: product.brand ?? '',
        sku: product.sku ?? '',
        quantityInStock: product.quantityInStock !== undefined ? String(product.quantityInStock) : '',
      });
    }
  }, [product]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        description: values.description,
        price: Number(values.price),
        category: values.category,
        brand: values.brand,
        sku: values.sku,
        quantityInStock: values.quantityInStock ? Number(values.quantityInStock) : undefined,
      });
      Alert.alert('Updated!', 'Product updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to update product.');
    }
  };

  if (isLoading) {
    return <SafeScreen><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={COLORS.accent} size="large" /></View></SafeScreen>;
  }

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Edit Product" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ gap: 10 }}>
          <Controller control={control} name="name" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Product Name *" placeholder="Product name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} leftIcon={<Ionicons name="pricetag-outline" size={18} color="#94A3B8" />} />
          )} />
          <Controller control={control} name="description" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Description *" placeholder="Product description..." value={value} onChangeText={onChange} onBlur={onBlur} error={errors.description?.message} multiline style={{ height: 100, paddingTop: 14 }} />
          )} />
          <Controller control={control} name="price" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Price (₦) *" placeholder="0.00" keyboardType="numeric" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.price?.message} leftIcon={<Ionicons name="cash-outline" size={18} color="#94A3B8" />} />
          )} />
          <Controller control={control} name="category" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Category *" placeholder="Category" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.category?.message} />
          )} />
          <Controller control={control} name="brand" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Brand" placeholder="Brand name" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="sku" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="SKU / Code" placeholder="SKU-001" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
          <Controller control={control} name="quantityInStock" render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Quantity in Stock" placeholder="50" keyboardType="numeric" value={value} onChangeText={onChange} onBlur={onBlur} leftIcon={<Ionicons name="layers-outline" size={18} color="#94A3B8" />} />
          )} />
        </View>
        <View style={{ height: 24 }} />
        <Button title="Save Changes" fullWidth size="lg" loading={updateMutation.isPending} onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({});
