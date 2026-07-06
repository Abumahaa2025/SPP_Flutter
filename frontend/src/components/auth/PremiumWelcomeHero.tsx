import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AgreementPulse } from '@/src/components/AgreementPulse';
import { Wordmark } from '@/src/components/BrandOrb';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

const FEATURE_KEYS = ['auth.hero.f1', 'auth.hero.f2', 'auth.hero.f3'] as const;

/** World-class welcome — fixed Agreement pulse + SPP wordmark + العقار الذكي. */
export function PremiumWelcomeHero() {
  const { t, isRTL } = useI18n();

  return (
    <View style={styles.wrap} testID="auth-welcome-hero">
      <LinearGradient
        colors={['rgba(212,175,95,0.14)', 'transparent', 'rgba(52,211,153,0.08)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.brandStack}>
        <AgreementPulse size={10} />
        <View style={styles.wordmarkWrap}>
          <Wordmark size="lg" showBilingualTagline />
        </View>
      </View>

      <Text style={[styles.headline, isRTL && styles.rtl]}>
        {t('auth.hero.title' as never)}
      </Text>

      <Text style={[styles.subline, isRTL && styles.rtl]}>
        {t('auth.hero.sub' as never)}
      </Text>

      <View style={styles.chipsRow}>
        {FEATURE_KEYS.map((key, i) => (
          <View key={key} style={[styles.chip, i === 1 && styles.chipGold]}>
            <Text style={[styles.chipText, isRTL && styles.rtl]}>{t(key as never)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  brandStack: { alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  wordmarkWrap: { alignItems: 'center' },
  headline: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: typography.weight.semibold,
    letterSpacing: -0.6,
    textAlign: 'center',
    maxWidth: 320,
  },
  subline: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipGold: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.goldEdge,
  },
  chipText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.2,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'center' },
});
