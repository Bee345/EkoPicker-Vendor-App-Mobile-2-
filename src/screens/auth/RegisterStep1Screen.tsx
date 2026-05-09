import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/ui/Button';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { SCREENS, COLORS } from '../../utils/constants';
import type { BusinessType } from '../../types/auth.types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const BUSINESS_TYPES: { type: BusinessType; label: string; icon: string; description: string; color: string }[] = [
  { type: 'restaurant', label: 'Restaurant / Food', icon: 'restaurant', description: 'Meals, drinks, snacks, catering', color: '#FFF7ED' },
  { type: 'retail', label: 'Retail Store', icon: 'bag-handle', description: 'Groceries, electronics, fashion', color: '#EFF6FF' },
  { type: 'pharmacy', label: 'Pharmacy', icon: 'medkit', description: 'Drugs, supplements, medical supplies', color: '#F0FDF4' },
  { type: 'orders', label: 'Wholesale / Supply', icon: 'cube', description: 'Bulk goods, raw materials, spare parts', color: '#F5F3FF' },
  { type: 'others', label: 'Other Business', icon: 'storefront', description: 'Any other product or service type', color: '#FFF1F2' },
];

export function RegisterStep1Screen() {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<BusinessType | null>(null);

  const handleNext = () => {
    if (!selected) return;
    navigation.navigate(SCREENS.REGISTER_STEP2, { businessType: selected });
  };

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
        </View>

        <Text style={styles.step}>Step 1 of 2</Text>
        <Text style={styles.title}>What type of business{'\n'}do you run?</Text>
        <Text style={styles.subtitle}>We'll customise the app experience for your business type.</Text>

        <View style={styles.list}>
          {BUSINESS_TYPES.map((bt) => {
            const isSelected = selected === bt.type;
            return (
              <TouchableOpacity
                key={bt.type}
                activeOpacity={0.8}
                onPress={() => setSelected(bt.type)}
                style={[styles.card, isSelected && styles.cardSelected, { backgroundColor: isSelected ? COLORS.primary : bt.color }]}
              >
                <View style={[styles.cardIcon, { backgroundColor: isSelected ? COLORS.accent : '#fff' }]}>
                  <Ionicons name={bt.icon as any} size={22} color={isSelected ? COLORS.primary : '#64748B'} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardLabel, isSelected && { color: '#fff' }]}>{bt.label}</Text>
                  <Text style={[styles.cardDesc, isSelected && { color: 'rgba(255,255,255,0.65)' }]}>{bt.description}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Continue"
          fullWidth size="lg"
          disabled={!selected}
          onPress={handleNext}
          style={{ marginTop: 8 }}
          leftIcon={<Ionicons name="arrow-forward" size={18} color={COLORS.primary} />}
        />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 0, marginBottom: 16 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E2E8F0' },
  progressDotActive: { backgroundColor: COLORS.accent, width: 24, borderRadius: 5 },
  progressLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 6 },
  step: { color: '#94A3B8', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 28 },
  list: { gap: 12, marginBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: 'transparent' },
  cardSelected: { borderColor: COLORS.accent },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  cardDesc: { fontSize: 12, color: '#64748B' },
});
