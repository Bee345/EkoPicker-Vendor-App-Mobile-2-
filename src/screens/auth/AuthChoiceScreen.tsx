import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/ui/Button';
import { SCREENS, COLORS } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function AuthChoiceScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      {/* Background circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          <Ionicons name="bag-handle" size={44} color={COLORS.primary} />
        </View>
        <Text style={styles.brand}>Eko<Text style={styles.brandAccent}>Picker</Text></Text>
        <Text style={styles.tagline}>Vendor Portal</Text>

        <View style={styles.divider} />

        <Text style={styles.headline}>Grow your business{'\n'}with smart tools.</Text>
        <Text style={styles.body}>
          Accept orders, manage products, chat with customers, and track earnings — all in one app.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Create Vendor Account"
          fullWidth
          size="lg"
          onPress={() => navigation.navigate(SCREENS.REGISTER_STEP1)}
        />
        <Button
          title="I Already Have an Account"
          variant="outline"
          fullWidth
          size="lg"
          style={{ marginTop: 12 }}
          onPress={() => navigation.navigate(SCREENS.LOGIN)}
        />
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, justifyContent: 'space-between' },
  circle1: { position: 'absolute', top: -100, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: '#FEF9C3', opacity: 0.6 },
  circle2: { position: 'absolute', bottom: -120, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#EEF2FF', opacity: 0.5 },
  hero: { flex: 1, justifyContent: 'center' },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  brand: { fontSize: 32, fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
  brandAccent: { color: COLORS.accent },
  tagline: { color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
  divider: { width: 40, height: 3, backgroundColor: COLORS.accent, borderRadius: 2, marginVertical: 28 },
  headline: { fontSize: 28, fontWeight: '900', color: COLORS.primary, lineHeight: 36, letterSpacing: -0.5, marginBottom: 12 },
  body: { fontSize: 14, color: '#64748B', lineHeight: 22 },
  actions: { paddingBottom: 8 },
  terms: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 20, lineHeight: 18 },
  link: { color: COLORS.accent, fontWeight: '700' },
});
