import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { BrandOrb, Wordmark } from '@/src/components/BrandOrb';
import { colors, spacing, typography } from '@/src/theme';

const items = [
  { label: 'Version', value: '1.0.0 · build 128' },
  { label: 'Codename', value: 'Executive' },
  { label: 'Design system', value: 'Dark Luxury · v3.6' },
  { label: 'AI engine', value: 'GPT-5.2 · modular' },
  { label: 'Data plane', value: 'MongoDB · Google Sheets (Phase 4)' },
];

export default function About() {
  return (
    <ScreenScaffold testID="about-screen">
      <ScreenHeader eyebrow="About" title="About SPP" sub="The AI Operating System for Real Estate." showBack />

      <Animated.View entering={FadeInDown.duration(650)}>
        <GlassCard padding={26} radiusToken="lg" edge="emerald" bright>
          <View style={{ alignItems: 'center', gap: 14 }}>
            <BrandOrb size={56} />
            <Wordmark size="lg" />
            <Text style={styles.tagline}>AI OPERATING SYSTEM · REAL ESTATE</Text>
            <Text style={styles.mission}>
              SPP thinks, analyzes and recommends — so owners no longer manage
              properties alone. Every screen answers one question:
              what should you do next?
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      <View style={{ marginTop: spacing.lg }}>
        <GlassCard padding={22} radiusToken="lg">
          <Text style={styles.section}>Platform</Text>
          {items.map((it, i) => (
            <View key={it.label}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{it.label}</Text>
                <Text style={styles.rowValue}>{it.value}</Text>
              </View>
              {i < items.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </GlassCard>
      </View>

      <View style={styles.credits}>
        <Text style={styles.creditText}>© SPP Labs · 2026 · All rights reserved.</Text>
        <Text style={styles.creditText}>Made with obsessive attention to every pixel.</Text>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  tagline: { color: colors.textSubtle, fontSize: 10, letterSpacing: 2.5, fontWeight: typography.weight.medium },
  mission: { color: colors.textDim, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, maxWidth: 300 },
  section: { color: colors.textMuted, fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', fontWeight: typography.weight.medium, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  rowLabel: { color: colors.textDim, fontSize: 13.5 },
  rowValue: { color: colors.text, fontSize: 13.5, fontWeight: typography.weight.semibold, letterSpacing: -0.1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  credits: { alignItems: 'center', marginTop: spacing.xl, gap: 4 },
  creditText: { color: colors.textSubtle, fontSize: 11, letterSpacing: 0.3 },
});
