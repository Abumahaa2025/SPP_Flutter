import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows } from '../theme';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  edge?: 'gold' | 'emerald' | 'neutral';
  padding?: number;
  radiusToken?: keyof typeof radius;
  testID?: string;
};

/**
 * Premium glassmorphic surface. Dark smoked glass, gentle inner sheen,
 * optional gold/emerald edge for priority.
 */
export function GlassCard({
  children, style, intensity = 40, edge = 'neutral',
  padding = 20, radiusToken = 'lg', testID,
}: Props) {
  const r = radius[radiusToken];
  const borderColor =
    edge === 'gold' ? colors.borderGold :
    edge === 'emerald' ? colors.emeraldEdge :
    colors.borderStrong;

  return (
    <View
      testID={testID}
      style={[styles.wrap, shadows.glass, { borderRadius: r }, style]}
    >
      <BlurView
        intensity={Platform.OS === 'android' ? Math.min(intensity, 30) : intensity}
        tint="dark"
        style={[styles.blur, { borderRadius: r }]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.06)',
            'rgba(255,255,255,0.02)',
            'rgba(6,11,20,0.35)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.tint, { borderRadius: r, borderColor, padding }]}
        >
          {children}
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceGlass,
  },
  blur: {
    overflow: 'hidden',
  },
  tint: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
