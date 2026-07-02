import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, motion } from '../theme';

/**
 * Cinematic ambient background used behind the AI Employee Home hero.
 * Deep navy base + a slow-breathing emerald/gold light leak.
 */
export function AmbientBackground() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: motion.breath, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
  }, [pulse]);

  const emeraldStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.25,
    transform: [{ scale: 1 + pulse.value * 0.05 }],
  }));
  const goldStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + (1 - pulse.value) * 0.22,
    transform: [{ scale: 1 + (1 - pulse.value) * 0.04 }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.heroTop, colors.heroMid, '#03060B']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.emeraldOrb, emeraldStyle]}>
        <LinearGradient
          colors={['rgba(80,200,120,0.45)', 'rgba(80,200,120,0)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.goldOrb, goldStyle]}>
        <LinearGradient
          colors={['rgba(212,175,55,0.35)', 'rgba(212,175,55,0)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Faint noise via layered translucent bar to avoid banding */}
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  emeraldOrb: {
    position: 'absolute',
    top: -160, right: -120,
    width: 480, height: 480,
    borderRadius: 240,
    overflow: 'hidden',
  },
  goldOrb: {
    position: 'absolute',
    top: 220, left: -180,
    width: 460, height: 460,
    borderRadius: 230,
    overflow: 'hidden',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,11,20,0.35)',
  },
});
