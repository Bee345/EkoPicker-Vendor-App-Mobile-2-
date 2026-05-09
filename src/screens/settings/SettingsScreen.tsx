import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { useUIStore } from '../../store/ui.store';
import { COLORS } from '../../utils/constants';

interface SettingsRow {
  icon: string;
  label: string;
  sub: string;
  toggle: boolean;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  action?: () => void;
}

export function SettingsScreen() {
  const { isDarkMode, toggleDarkMode } = useUIStore();

  const rows: { section: string; items: SettingsRow[] }[] = [
    {
      section: 'Security',
      items: [
        { icon: 'finger-print-outline', label: 'Biometric Login', sub: 'Use Face ID / fingerprint', toggle: true, value: false },
        { icon: 'shield-outline', label: 'Two-Factor Auth', sub: 'Extra security for your account', toggle: false, action: () => Alert.alert('Coming Soon', '2FA is coming in a future update.') },
      ],
    },
    {
      section: 'General',
      items: [
        { icon: isDarkMode ? 'moon' : 'sunny-outline', label: 'Dark Mode', sub: 'Toggle app theme', toggle: true, value: isDarkMode, onToggle: toggleDarkMode },
        { icon: 'language-outline', label: 'Language', sub: 'English (Default)', toggle: false, action: () => Alert.alert('Coming Soon', 'Language settings are coming soon.') },
        { icon: 'notifications-outline', label: 'Push Notifications', sub: 'Manage system notifications', toggle: false, action: () => Alert.alert('Info', 'Manage from your device settings.') },
      ],
    },
    {
      section: 'Data',
      items: [
        { icon: 'cloud-download-outline', label: 'Download My Data', sub: 'Export your data as CSV', toggle: false, action: () => Alert.alert('Processing', 'Your data export will be emailed to you.') },
        { icon: 'trash-outline', label: 'Delete Account', sub: 'Permanently delete all data', toggle: false, action: () => Alert.alert('Danger', 'Please contact support to delete your account.') },
      ],
    },
    {
      section: 'About',
      items: [
        { icon: 'information-circle-outline', label: 'App Version', sub: 'v1.0.0', toggle: false },
        { icon: 'document-text-outline', label: 'Terms of Service', sub: 'View our Terms', toggle: false, action: () => Alert.alert('Coming Soon') },
        { icon: 'lock-closed-outline', label: 'Privacy Policy', sub: 'View how we use your data', toggle: false, action: () => Alert.alert('Coming Soon') },
      ],
    },
  ];

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {rows.map((section) => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={item.toggle || !item.action ? 1 : 0.7}
                  onPress={item.action}
                  style={[styles.row, i < section.items.length - 1 && styles.rowBorder]}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowSub}>{item.sub}</Text>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.value ?? false}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#E2E8F0', true: COLORS.primary }}
                      thumbColor={(item.value ?? false) ? COLORS.accent : '#fff'}
                    />
                  ) : item.action ? (
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  rowSub: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
});
