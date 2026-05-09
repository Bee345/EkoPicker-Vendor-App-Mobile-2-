import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { SCREENS, COLORS } from '../../utils/constants';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace(SCREENS.ONBOARDING);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background decorations */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logoBox}>
          <Ionicons name="bag-handle" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.logoText}>
          Eko<Text style={styles.logoAccent}>Picker</Text>
        </Text>
        <Text style={styles.tagline}>Vendor Portal</Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.accent,
    opacity: 0.08,
  },
  circle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.accent,
    opacity: 0.05,
  },
  logoWrap: { alignItems: 'center' },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logoText: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  logoAccent: { color: COLORS.accent },
  tagline: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 2,
  },
  bottom: { position: 'absolute', bottom: 40 },
  version: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '500' },
});
