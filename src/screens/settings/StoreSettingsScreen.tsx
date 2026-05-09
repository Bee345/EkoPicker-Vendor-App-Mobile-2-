import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';
import { COLORS } from '../../utils/constants';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StoreSettingsScreen() {
  const { vendor } = useAuthStore();
  const [isOpen, setIsOpen] = useState(true);
  const [openDays, setOpenDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [openTime, setOpenTime] = useState('08:00 AM');
  const [closeTime, setCloseTime] = useState('09:00 PM');
  const [minOrder, setMinOrder] = useState('1500');
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: string) => {
    setOpenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    Alert.alert('Saved!', 'Store settings updated successfully.');
  };

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader title="Store Settings" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Store Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Store Status</Text>
          </View>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>{isOpen ? '🟢 Open for orders' : '🔴 Closed'}</Text>
              <Text style={styles.rowSub}>Customers {isOpen ? 'can' : 'cannot'} place orders now</Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: '#E2E8F0', true: '#D1FAE5' }}
              thumbColor={isOpen ? '#10B981' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Operating Hours</Text>
          </View>
          <Text style={styles.subLabel}>Open Days</Text>
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => toggleDay(d)}
                style={[styles.dayChip, openDays.includes(d) && styles.dayChipActive]}
              >
                <Text style={[styles.dayText, openDays.includes(d) && styles.dayTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Opening Time</Text>
              <View style={styles.timeBox}>
                <Ionicons name="time-outline" size={16} color="#94A3B8" />
                <TextInput
                  style={styles.timeInput}
                  value={openTime}
                  onChangeText={setOpenTime}
                  placeholder="08:00 AM"
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Closing Time</Text>
              <View style={styles.timeBox}>
                <Ionicons name="time-outline" size={16} color="#94A3B8" />
                <TextInput
                  style={styles.timeInput}
                  value={closeTime}
                  onChangeText={setCloseTime}
                  placeholder="09:00 PM"
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bicycle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Delivery Settings</Text>
          </View>
          <View style={{ gap: 10 }}>
            <Input
              label="Minimum Order Amount (₦)"
              placeholder="1500"
              keyboardType="numeric"
              value={minOrder}
              onChangeText={setMinOrder}
              leftIcon={<Ionicons name="cash-outline" size={16} color="#94A3B8" />}
            />
          </View>
        </View>

        {/* Notification Prefs */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Notifications</Text>
          </View>
          {[
            { label: 'New Order Alerts', sub: 'Get notified when a new order arrives', on: true },
            { label: 'Chat Messages', sub: 'Notify when a customer sends a message', on: true },
            { label: 'Order Status Updates', sub: 'When EkoPicker updates your order', on: false },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.notifRow, i < arr.length - 1 && styles.notifBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifLabel}>{item.label}</Text>
                <Text style={styles.notifSub}>{item.sub}</Text>
              </View>
              <Switch
                value={item.on}
                trackColor={{ false: '#E2E8F0', true: COLORS.primary }}
                thumbColor={item.on ? COLORS.accent : '#fff'}
              />
            </View>
          ))}
        </View>

        <Button title="Save Settings" fullWidth size="lg" loading={saving} onPress={handleSave} style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  rowSub: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  subLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: { width: 44, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  dayTextActive: { color: '#fff' },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: '#E2E8F0' },
  timeInput: { flex: 1, color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  notifBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifLabel: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  notifSub: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
});
