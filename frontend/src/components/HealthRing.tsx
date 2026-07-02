import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, typography } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  score: number;    // 0..100
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
};

/**
 * Premium circular health indicator — emerald arc on a faint gold track.
 * Glow via layered strokes; animated on mount.
 */
export function HealthRing({
  score, size = 168, stroke = 12, label, sublabel,
}: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(clamped / 100, {
      duration: 1200, easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.emerald} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.gold} stopOpacity="0.85" />
          </SvgGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none"
        />
        {/* Glow (blurred wide) */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={colors.emeraldGlow} strokeWidth={stroke + 8}
          strokeLinecap="round" fill="none" opacity={0.25}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={styles.score}>{clamped}</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: typography.numLg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    letterSpacing: typography.letter.tight,
  },
  label: {
    marginTop: 2,
    fontSize: typography.small,
    color: colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sublabel: {
    marginTop: 2,
    fontSize: typography.micro,
    color: colors.textSubtle,
  },
});
