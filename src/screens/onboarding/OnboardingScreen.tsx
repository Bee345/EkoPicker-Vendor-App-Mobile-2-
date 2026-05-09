import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { SCREENS, COLORS } from '../../utils/constants';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    icon: 'bag-handle' as const,
    title: 'Manage Your Business',
    subtitle:
      'List products, accept orders, and grow your revenue — all from one powerful dashboard.',
    color: '#EEF2FF',
    iconBg: COLORS.primary,
  },
  {
    key: '2',
    icon: 'receipt' as const,
    title: 'Real-Time Orders',
    subtitle: 'Get instant notifications the moment a customer places an order. Never miss a sale.',
    color: '#FFF9E6',
    iconBg: COLORS.accent,
  },
  {
    key: '3',
    icon: 'chatbubbles' as const,
    title: 'Chat with Customers',
    subtitle:
      'Communicate directly with your buyers. Build trust and deliver great customer service.',
    color: '#F0FDF4',
    iconBg: '#10B981',
  },
  {
    key: '4',
    icon: 'wallet' as const,
    title: 'Track Your Earnings',
    subtitle: 'View daily, weekly, and monthly revenue. Request payouts right from the app.',
    color: '#FFF1F2',
    iconBg: '#F43F5E',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex((i) => i + 1);
    } else {
      navigation.replace(SCREENS.AUTH_CHOICE);
    }
  };

  const handleSkip = () => navigation.replace(SCREENS.AUTH_CHOICE);

  const renderSlide = ({ item }: ListRenderItemInfo<(typeof SLIDES)[0]>) => (
    <View style={[styles.slide, { backgroundColor: item.color }]}>
      <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={56} color="#fff" />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(i) => i.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? "Let's Go" : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 24, maxWidth: 300 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  skipBtn: { padding: 12 },
  skipText: { color: '#94A3B8', fontWeight: '600', fontSize: 15 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  nextText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
});
