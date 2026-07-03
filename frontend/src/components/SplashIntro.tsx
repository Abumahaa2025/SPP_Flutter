import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, useSharedValue, useAnimatedStyle,
  withTiming, Easing,
} from 'react-native-reanimated';
import { BrandOrb, Wordmark } from './BrandOrb';
import { colors, typography } from '../theme';

type Props = {
  visible: boolean;
  /** How long the intro remains fully opaque before fading. */
  holdMs?: number;
};

/**
 * SPP Intro — the launch signature.
 * Every cold start begins here: deep ink, breathing brand orb, wordmark, tagline.
 * Fades out to reveal Home after `holdMs`.
 */
export function SplashIntro({ visible, holdMs = 1400 }: Props) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: 520, easing: Easing.inOut(Easing.cubic) });
    }
  }, [visible, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: (opacity.value > 0.02 ? 'auto' : 'none') as any,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style, { zIndex: 999 }]}
      pointerEvents={visible ? 'auto' : 'none'}
      testID="splash-intro"
    >
      <LinearGradient
        colors={['#08121F', '#050A12', '#020509']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient breathe behind orb */}
      <View style={styles.orbHalo}>
        <LinearGradient
          colors={['rgba(80,200,120,0.28)', 'rgba(80,200,120,0)']}
          style={[StyleSheet.absoluteFill, { borderRadius: 260 }]}
        />
      </View>

      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(700)}>
          <BrandOrb size={72} />
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(700).delay(280)} style={{ marginTop: 20 }}>
          <Wordmark size="lg" />
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(700).delay(420)}>
          <Text style={styles.tagline}>AI OPERATING SYSTEM · REAL ESTATE</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.duration(600).delay(700)} style={styles.footer}>
        <Text style={styles.footerText}>Preparing your executive briefing…</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  orbHalo: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -260, marginTop: -260,
    width: 520, height: 520,
    overflow: 'hidden',
  },
  tagline: {
    color: colors.textSubtle,
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: typography.weight.medium,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60, left: 0, right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSubtle,
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: typography.weight.medium,
  },
});
