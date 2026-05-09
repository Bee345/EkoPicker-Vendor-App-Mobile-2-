import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { useAuthStore } from '../../store/auth.store';
import { SCREENS, COLORS } from '../../utils/constants';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { vendor } = useAuthStore();

  const fields = [
    { label: 'Full Name', value: vendor?.name ?? '-', icon: 'person-outline' },
    { label: 'Email Address', value: vendor?.email ?? '-', icon: 'mail-outline' },
    { label: 'Phone Number', value: vendor?.phone ?? '-', icon: 'call-outline' },
    { label: 'Business Name', value: vendor?.businessName ?? '-', icon: 'storefront-outline' },
    { label: 'Business Type', value: vendor?.businessType ?? '-', icon: 'briefcase-outline' },
    { label: 'Account Status', value: vendor?.status ?? '-', icon: 'shield-checkmark-outline' },
  ];

  return (
    <SafeScreen edges={['top']}>
      <ScreenHeader
        title="My Profile"
        rightElement={
          <TouchableOpacity onPress={() => navigation.navigate(SCREENS.EDIT_PROFILE)}>
            <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {vendor?.avatar ? (
            <Image source={{ uri: vendor.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 36 }}>
                {vendor?.name?.[0]?.toUpperCase() ?? 'V'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarBtn}>
            <Ionicons name="camera-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{vendor?.name ?? 'Vendor'}</Text>
        <Text style={styles.business}>{vendor?.businessName}</Text>

        {/* Fields */}
        <View style={styles.card}>
          {fields.map((f, i) => (
            <View key={f.label} style={[styles.field, i < fields.length - 1 && styles.fieldBorder]}>
              <View style={styles.fieldIcon}>
                <Ionicons name={f.icon as any} size={16} color="#64748B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>
                  {f.label === 'Account Status'
                    ? f.value.charAt(0).toUpperCase() + f.value.slice(1)
                    : f.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => navigation.navigate(SCREENS.EDIT_PROFILE)}
          style={styles.actionBtn}
        >
          <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate(SCREENS.CHANGE_PASSWORD)}
          style={[styles.actionBtn, { backgroundColor: '#F8FAFC', marginTop: 10 }]}
        >
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignSelf: 'center', position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 32, borderWidth: 3, borderColor: COLORS.accent },
  editAvatarBtn: { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 22, fontWeight: '900', color: COLORS.primary, textAlign: 'center', marginBottom: 4 },
  business: { fontSize: 14, color: '#64748B', fontWeight: '600', textAlign: 'center', marginBottom: 28 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 20 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  fieldIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  fieldValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 14 },
  actionText: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
});
