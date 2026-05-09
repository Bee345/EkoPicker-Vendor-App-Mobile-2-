import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useProduct, useDeleteProduct, useToggleProductStatus } from '../../hooks/useProducts';
import { SCREENS, COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';

export function ProductDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { productId } = route.params;
  const { data: product, isLoading } = useProduct(productId);
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductStatus();
  const [imgIndex, setImgIndex] = useState(0);

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      </SafeScreen>
    );
  }
  if (!product) {
    return (
      <SafeScreen edges={['top']}>
        <ScreenHeader title="Product Details" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.muted} />
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '800', marginTop: 12 }}>
            Product not found
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            It may have been deleted. Please go back and refresh.
          </Text>
          <Button
            title="Go back"
            variant="outline"
            style={{ marginTop: 20 }}
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeScreen>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMutation.mutateAsync(product._id);
          navigation.goBack();
        },
      },
    ]);
  };

  const images =
    product.images.length > 0 ? product.images : ['https://picsum.photos/seed/product/400/400'];

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader
        title="Product Details"
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.EDIT_PRODUCT, { productId })}
          >
            <Ionicons name="pencil-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Images */}
        <View>
          <Image source={{ uri: images[imgIndex] }} style={styles.mainImage} />
          {images.length > 1 && (
            <View style={styles.thumbRow}>
              {images.map((uri, i) => (
                <TouchableOpacity key={i} onPress={() => setImgIndex(i)}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumb, i === imgIndex && styles.thumbActive]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Name & Status */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{product.name}</Text>
            <Badge
              label={product.status.replace('_', ' ')}
              variant={
                product.status === 'active'
                  ? 'success'
                  : product.status === 'out_of_stock'
                    ? 'warning'
                    : 'neutral'
              }
            />
          </View>
          {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
          <Text style={styles.category}>{product.category}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
            {product.discount && product.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount}% OFF</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {product.quantityInStock !== undefined && (
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{product.quantityInStock}</Text>
                <Text style={styles.statLabel}>In Stock</Text>
              </View>
            )}
            {product.sku && (
              <View style={styles.statBox}>
                <Text style={styles.statValue} numberOfLines={1}>
                  {product.sku}
                </Text>
                <Text style={styles.statLabel}>SKU</Text>
              </View>
            )}
            {product.prescriptionRequired !== undefined && (
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{product.prescriptionRequired ? 'Yes' : 'No'}</Text>
                <Text style={styles.statLabel}>Rx Required</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Pharmacy-specific */}
          {product.dosage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Drug Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Generic Name</Text>
                <Text style={styles.detailVal}>{product.genericName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Dosage</Text>
                <Text style={styles.detailVal}>{product.dosage}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Manufacturer</Text>
                <Text style={styles.detailVal}>{product.manufacturer}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Expiry Date</Text>
                <Text style={styles.detailVal}>{product.expiryDate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Batch #</Text>
                <Text style={styles.detailVal}>{product.batchNumber}</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={product.status === 'active' ? 'Mark Out of Stock' : 'Mark In Stock'}
              variant="outline"
              fullWidth
              loading={toggleMutation.isPending}
              onPress={() => toggleMutation.mutate(product._id)}
            />
            <View style={{ height: 10 }} />
            <Button
              title="Delete Product"
              variant="danger"
              fullWidth
              loading={deleteMutation.isPending}
              onPress={handleDelete}
            />
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  mainImage: { width: '100%', height: 280, resizeMode: 'cover' },
  thumbRow: { flexDirection: 'row', gap: 8, padding: 12 },
  thumb: { width: 60, height: 60, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: COLORS.accent },
  body: { padding: 20 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  name: { flex: 1, fontSize: 22, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  brand: { fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  category: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  price: { fontSize: 28, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  discountBadge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: { color: '#92400E', fontSize: 11, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  description: { fontSize: 14, color: '#475569', lineHeight: 22 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailKey: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  detailVal: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  actions: { marginTop: 8 },
});
