import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, StyleSheet, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { SCREENS, COLORS } from '../../utils/constants';
import { formatCurrencyCompact } from '../../utils/formatCurrency';

const MENU_ITEMS = [
  {
    section: 'Business',
    items: [
      { icon: 'trending-up-outline', label: 'Earnings & Reports', screen: SCREENS.EARNINGS, color: '#D1FAE5', iconColor: '#10B981' },
      { icon: 'storefront-outline', label: 'Store Settings', screen: SCREENS.STORE_SETTINGS, color: '#EFF6FF', iconColor: '#3B82F6' },
    ],
  },
  {
    section: 'Account',
    items: [
      { icon: 'person-outline', label: 'My Profile', screen: SCREENS.PROFILE, color: '#FFF7ED', iconColor: '#F59E0B' },
      { icon: 'lock-closed-outline', label: 'Change Password', screen: SCREENS.CHANGE_PASSWORD, color: '#FFF1F2', iconColor: '#F43F5E' },
      { icon: 'settings-outline', label: 'Settings', screen: SCREENS.SETTINGS, color: '#F5F3FF', iconColor: '#8B5CF6' },
    ],
  },
  {
    section: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help & Support', screen: null, color: '#F0FDF4', iconColor: '#10B981' },
      { icon: 'document-text-outline', label: 'Terms & Privacy', screen: null, color: '#F8FAFC', iconColor: '#64748B' },
    ],
  },
];

export function MoreScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { vendor, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useUIStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate(SCREENS.PROFILE)}
        style={styles.profileCard}
      >
        <View style={styles.profileLeft}>
          {vendor?.avatar ? (
            <Image source={{ uri: vendor.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 22 }}>
                {vendor?.name?.[0]?.toUpperCase() ?? 'V'}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{vendor?.name ?? 'Vendor'}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{vendor?.email ?? ''}</Text>
            <View style={styles.businessBadge}>
              <Text style={styles.businessBadgeText}>{vendor?.businessName ?? 'My Business'}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Products', value: '24', icon: 'bag-outline' },
          { label: 'Orders', value: '145', icon: 'receipt-outline' },
          { label: 'Revenue', value: '₦982K', icon: 'wallet-outline' },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon as any} size={16} color={COLORS.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu Items */}
      {MENU_ITEMS.map((section) => (
        <View key={section.section} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.section}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.7}
                onPress={() => item.screen ? navigation.navigate(item.screen) : Alert.alert('Coming Soon', 'This feature is coming soon!')}
                style={[styles.menuItem, i < section.items.length - 1 && styles.menuItemBorder]}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Dark Mode Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.sectionCard}>
          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: isDarkMode ? '#1E293B' : '#FEF9C3' }]}>
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={18} color={isDarkMode ? '#FACC15' : '#F59E0B'} />
            </View>
            <Text style={styles.menuLabel}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#E2E8F0', true: COLORS.primary }}
              thumbColor={isDarkMode ? COLORS.accent : '#fff'}
            />
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={18} color="#F43F5E" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>EkoPicker Vendor v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  profileCard: { margin: 16, backgroundColor: '#fff', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  avatar: { width: 60, height: 60, borderRadius: 20, borderWidth: 2, borderColor: COLORS.accent },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '900', color: COLORS.primary, marginBottom: 2 },
  profileEmail: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 6 },
  businessBadge: { backgroundColor: '#FEF9C3', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  businessBadgeText: { color: '#92400E', fontSize: 11, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statValue: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.primary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, backgroundColor: '#FFF1F2', borderRadius: 16, padding: 14 },
  logoutText: { color: '#F43F5E', fontWeight: '800', fontSize: 15 },
  version: { textAlign: 'center', color: '#CBD5E1', fontSize: 12, fontWeight: '500', marginTop: 20 },
});
