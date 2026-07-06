import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { BrandOrb, Wordmark } from '@/src/components/BrandOrb';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';

export default function About() {
  const { t, isRTL } = useI18n();

  const items = [
    { label: t('about.version'), value: t('about.versionVal') },
    { label: t('about.codename'), value: t('about.codenameVal') },
    { label: t('about.design'), value: t('about.designVal') },
    { label: t('about.team'), value: t('about.teamVal') },
    { label: t('about.built'), value: t('about.builtVal') },
  ];

  return (
    <ScreenScaffold testID="about-screen">
      <StoryScreenHeader question={t('page.q.about')} hint={t('about.sub')} showBack testID="about-header" />

      <Animated.View entering={FadeInDown.duration(650)}>
        <GlassCard padding={26} radiusToken="lg" edge="emerald" bright>
          <View style={{ alignItems: 'center', gap: 14 }}>
            <BrandOrb size={56} />
            <Wordmark size="lg" />
            <Text style={styles.tagline}>{t('about.tagline').toUpperCase()}</Text>
            <Text style={[styles.mission, isRTL && styles.rtl]}>{t('about.mission')}</Text>
          </View>
        </GlassCard>
      </Animated.View>

      <View style={{ marginTop: spacing.lg }}>
        <GlassCard padding={22} radiusToken="lg">
          <Text style={styles.section}>{t('about.platform').toUpperCase()}</Text>
          {items.map((it, i) => (
            <View key={it.label}>
              <View style={[styles.row, isRTL && styles.rowRtl]}>
                <Text style={[styles.rowLabel, isRTL && styles.rtl]}>{it.label}</Text>
                <Text style={[styles.rowValue, isRTL && styles.rtl]}>{it.value}</Text>
              </View>
              {i < items.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </GlassCard>
      </View>

      <View style={styles.credits}>
        <Text style={styles.creditText}>{t('about.credit1')}</Text>
        <Text style={styles.creditText}>{t('about.credit2')}</Text>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  tagline: { color: colors.textSubtle, fontSize: 10, letterSpacing: 2.5, fontWeight: typography.weight.medium },
  mission: { color: colors.textDim, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, maxWidth: 300 },
  section: { color: colors.textMuted, fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', fontWeight: typography.weight.medium, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowRtl: { flexDirection: 'row-reverse' },
  rowLabel: { color: colors.textDim, fontSize: 13.5 },
  rowValue: { color: colors.text, fontSize: 13.5, fontWeight: typography.weight.semibold, letterSpacing: -0.1, flexShrink: 1, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  credits: { alignItems: 'center', marginTop: spacing.xl, gap: 4 },
  creditText: { color: colors.textSubtle, fontSize: 11, letterSpacing: 0.3, textAlign: 'center' },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
