import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: '#E2E8F0',
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Pre-built skeleton card for lists */
export function SkeletonCard() {
  return (
    <View
      style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, gap: 10 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width={'60%' as any} height={14} />
          <Skeleton width={'40%' as any} height={10} />
        </View>
      </View>
      <Skeleton height={1} borderRadius={0} style={{ backgroundColor: '#F1F5F9' }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width={'30%' as any} height={10} />
        <Skeleton width={'20%' as any} height={10} />
      </View>
    </View>
  );
}
