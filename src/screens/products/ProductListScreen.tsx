import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Image,
  Alert, StyleSheet, RefreshControl, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useProducts, useDeleteProduct, useToggleProductStatus } from '../../hooks/useProducts';
import { SCREENS, COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { Product } from '../../types/product.types';

export function ProductListScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: products, isLoading, refetch } = useProducts();
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductStatus();

  const categories = ['All', ...Array.from(new Set(products?.map((p) => p.category) ?? []))];

  const filtered = (products ?? []).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleDelete = (item: Product) => {
    Alert.alert('Delete Product', `Delete "${item.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteMutation.mutate(item._id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate(SCREENS.PRODUCT_DETAILS, { productId: item._id })}
      style={styles.card}
    >
      <Image source={{ uri: item.images[0] ?? 'https://picsum.photos/200' }} style={styles.image} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        {item.brand && <Text style={styles.cardBrand}>{item.brand}</Text>}
        <Text style={styles.cardCategory}>{item.category}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>{formatCurrency(item.price)}</Text>
          <Badge
            label={item.status.replace('_', ' ')}
            variant={item.status === 'active' ? 'success' : item.status === 'out_of_stock' ? 'warning' : 'neutral'}
            size="sm"
          />
        </View>

        {/* Stock toggle */}
        <View style={styles.cardToggleRow}>
          <Text style={styles.cardToggleLabel}>In Stock</Text>
          <Switch
            value={item.status === 'active'}
            onValueChange={() => toggleMutation.mutate(item._id)}
            trackColor={{ false: '#E2E8F0', true: '#D1FAE5' }}
            thumbColor={item.status === 'active' ? '#10B981' : '#94A3B8'}
          />
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.EDIT_PRODUCT, { productId: item._id })}
            style={styles.editBtn}
          >
            <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={14} color="#F43F5E" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader
        title="Products"
        showBack={false}
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.ADD_PRODUCT)}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(s) => s}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cats}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            onPress={() => setActiveCategory(cat)}
            style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      <FlatList
        data={isLoading ? [] : filtered}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.accent} />}
        ListEmptyComponent={
          isLoading
            ? <View style={{ padding: 16, gap: 12 }}>{[1, 2, 3].map((k) => <SkeletonCard key={k} />)}</View>
            : <EmptyState icon="📦" title="No products yet" subtitle="Add your first product to start selling." actionLabel="Add Product" onAction={() => navigation.navigate(SCREENS.ADD_PRODUCT)} />
        }
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, color: COLORS.primary, fontSize: 14 },
  cats: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  catTextActive: { color: '#fff' },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  image: { width: '100%', height: 130, resizeMode: 'cover' },
  cardBody: { padding: 12 },
  cardName: { fontSize: 13, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  cardBrand: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  cardCategory: { fontSize: 10, color: '#CBD5E1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardPrice: { fontSize: 14, fontWeight: '900', color: COLORS.primary },
  cardToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardToggleLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#F8FAFC', borderRadius: 8, paddingVertical: 6 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center' },
});
