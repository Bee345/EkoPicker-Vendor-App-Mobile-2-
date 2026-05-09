import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useCreateProduct } from '../../hooks/useProducts';
import { useAuthStore } from '../../store/auth.store';
import { COLORS } from '../../utils/constants';

const schema = z.object({
  name: z.string().min(2, 'Enter product name'),
  description: z.string().min(10, 'Describe the product (min 10 chars)'),
  price: z
    .string()
    .min(1, 'Enter price')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Price must be a positive number'),
  category: z.string().min(2, 'Enter a category'),
  brand: z.string().optional(),
  sku: z.string().optional(),
  quantityInStock: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const CATEGORIES: Record<string, string[]> = {
  restaurant: ['Meals', 'Drinks', 'Combos', 'Add-ons', 'Desserts'],
  retail: ['Groceries', 'Household', 'Electronics', 'Fashion', 'Packaged Goods'],
  pharmacy: ['Prescription Drugs', 'OTC Drugs', 'Supplements', 'Medical Equipment'],
  orders: ['Spare Parts', 'Farm Produce', 'Raw Materials', 'Bulk Goods'],
  others: ['General', 'Supplies', 'Services', 'Misc'],
};

export function AddProductScreen() {
  const navigation = useNavigation<any>();
  const { vendor } = useAuthStore();
  const createMutation = useCreateProduct();
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const cats = CATEGORIES[vendor?.businessType ?? 'retail'] ?? CATEGORIES.retail;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description,
        price: Number(values.price),
        category: values.category,
        images,
        brand: values.brand,
        sku: values.sku,
        quantityInStock: values.quantityInStock ? Number(values.quantityInStock) : undefined,
        status: 'active',
      });
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to add product.');
    }
  };

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Add Product" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <View style={styles.imageRow}>
            {images.map((uri, i) => (
              <View key={i} style={styles.imageThumbWrap}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  style={styles.imageRemove}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                <Ionicons name="add" size={28} color="#94A3B8" />
                <Text style={styles.imagePickerText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.catGrid}>
            {cats.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setSelectedCategory(cat);
                  setValue('category', cat);
                }}
                style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              >
                <Text
                  style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && <Text style={styles.errText}>{errors.category.message}</Text>}
        </View>

        {/* Form fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Product Name *"
                placeholder="e.g. Premium Headphones"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon={<Ionicons name="pricetag-outline" size={18} color="#94A3B8" />}
              />
            )}
          />
          <View style={{ height: 10 }} />
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description *"
                placeholder="Describe your product..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                multiline
                style={{ height: 100, paddingTop: 14 }}
              />
            )}
          />
          <View style={{ height: 10 }} />
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Price (₦) *"
                placeholder="0.00"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.price?.message}
                leftIcon={<Ionicons name="cash-outline" size={18} color="#94A3B8" />}
              />
            )}
          />
          <View style={{ height: 10 }} />
          <Controller
            control={control}
            name="brand"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Brand (optional)"
                placeholder="e.g. Sony"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon={<Ionicons name="business-outline" size={18} color="#94A3B8" />}
              />
            )}
          />
          <View style={{ height: 10 }} />
          <Controller
            control={control}
            name="sku"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="SKU / Code (optional)"
                placeholder="e.g. SKU-001"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon={<Ionicons name="barcode-outline" size={18} color="#94A3B8" />}
              />
            )}
          />
          <View style={{ height: 10 }} />
          <Controller
            control={control}
            name="quantityInStock"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Quantity in Stock (optional)"
                placeholder="e.g. 50"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon={<Ionicons name="layers-outline" size={18} color="#94A3B8" />}
              />
            )}
          />
        </View>

        <Button
          title="Add Product"
          fullWidth
          size="lg"
          loading={createMutation.isPending}
          onPress={handleSubmit(onSubmit)}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageThumbWrap: { position: 'relative' },
  imageThumb: { width: 80, height: 80, borderRadius: 12 },
  imageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePicker: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imagePickerText: { fontSize: 9, color: '#94A3B8', fontWeight: '700', textAlign: 'center' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  catChipTextActive: { color: '#fff' },
  errText: { color: '#F43F5E', fontSize: 11, marginTop: 4 },
});
