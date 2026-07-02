import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
  SharedValue, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { colors, motion } from '../theme';

type Props = {
  /** Optional scroll shared value — enables cinematic parallax. */
  scrollY?: SharedValue<number>;
};

/**
 * Cinematic ambient background.
 * - Deep navy base, three vignettes for realistic depth.
 * - Two aurora orbs (emerald + gold) that breathe on independent phases.
 * - Parallax reacts to scroll (~0.35x factor) so the world feels alive.
 */
export function AmbientBackground({ scrollY }: Props) {
  const emerald = useSharedValue(0);
  const gold = useSharedValue(0);

  useEffect(() => {
    emerald.value = withRepeat(
      withTiming(1, { duration: motion.breath, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
    gold.value = withRepeat(
      withTiming(1, { duration: motion.breath + 800, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
  }, [emerald, gold]);

  const emeraldStyle = useAnimatedStyle(() => {
    const shift = scrollY
      ? interpolate(scrollY.value, [0, 600], [0, -140], Extrapolation.CLAMP)
      : 0;
    return {
      opacity: 0.42 + emerald.value * 0.22,
      transform: [
        { translateY: shift },
        { scale: 1 + emerald.value * 0.05 },
      ],
    };
  });

  const goldStyle = useAnimatedStyle(() => {
    const shift = scrollY
      ? interpolate(scrollY.value, [0, 600], [0, -90], Extrapolation.CLAMP)
      : 0;
    return {
      opacity: 0.24 + (1 - gold.value) * 0.2,
      transform: [
        { translateY: shift },
        { scale: 1 + (1 - gold.value) * 0.04 },
      ],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base ink */}
      <LinearGradient
        colors={[colors.heroTop, colors.heroMid, '#03060B']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Emerald aurora — top right */}
      <Animated.View style={[styles.emeraldOrb, emeraldStyle]}>
        <LinearGradient
          colors={['rgba(80,200,120,0.55)', 'rgba(80,200,120,0)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Gold aurora — left mid */}
      <Animated.View style={[styles.goldOrb, goldStyle]}>
        <LinearGradient
          colors={['rgba(212,175,55,0.42)', 'rgba(212,175,55,0)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Bottom fade so tab bar has depth */}
      <LinearGradient
        colors={['rgba(6,11,20,0)', 'rgba(3,6,11,0.85)']}
        style={styles.bottomFade}
      />
      {/* Master vignette */}
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  emeraldOrb: {
    position: 'absolute',
    top: -220, right: -160,
    width: 560, height: 560,
    borderRadius: 280,
    overflow: 'hidden',
  },
  goldOrb: {
    position: 'absolute',
    top: 260, left: -200,
    width: 520, height: 520,
    borderRadius: 260,
    overflow: 'hidden',
  },
  bottomFade: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0, height: 260,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,11,20,0.32)',
  },
});
