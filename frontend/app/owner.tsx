import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { BrandOrb, Wordmark } from '@/src/components/BrandOrb';
import { api, type OwnerT, type Briefing } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
};

export default function Owner() {
  const { t } = useI18n();
  const router = useRouter();
  const [owner, setOwner] = useState<OwnerT | null>(null);
  const [brief, setBrief] = useState<Briefing | null>(null);

  useEffect(() => {
    api.owner().then(setOwner).catch(() => {});
    api.briefing().then(setBrief).catch(() => {});
  }, []);

  return (
    <ScreenScaffold testID="owner-screen">
      <ScreenHeader eyebrow="Identity" title={t('owner.title')} sub={t('owner.sub')} showBack />

      {/* Identity card */}
      <Animated.View entering={FadeInDown.duration(650)}>
        <GlassCard padding={26} radiusToken="lg" edge="gold" bright>
          <View style={{ alignItems: 'center' }}>
            <BrandOrb size={56} />
            <Text style={styles.name}>{owner?.name ?? '—'}</Text>
            <View style={styles.tagline}>
              <Wordmark size="sm" color={colors.textMuted} />
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('owner.value')}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statLead}>AED</Text>
                <Text style={styles.statValue}>{fmt(owner?.portfolio_value ?? 0)}</Text>
              </View>
            </View>
            <View style={styles.statSep} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('owner.properties')}</Text>
              <Text style={styles.statValueSolo}>{owner?.properties ?? brief?.properties_count ?? 0}</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>HEALTH</Text>
              <Text style={styles.statValueSolo}>{brief?.avg_health ?? '—'}</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Quick links */}
      <View style={styles.linkGrid}>
        <QuickLink icon="grid" label="Portfolio" onPress={() => router.push('/portfolio')} testID="ol-portfolio" />
        <QuickLink icon="users" label="Tenants" onPress={() => router.push('/tenants')} testID="ol-tenants" />
        <QuickLink icon="file-text" label="Contracts" onPress={() => router.push('/contracts')} testID="ol-contracts" />
        <QuickLink icon="file" label="Reports" onPress={() => router.push('/reports')} testID="ol-reports" />
      </View>

      {/* Brand signature */}
      <View style={styles.signature}>
        <View style={styles.sigLine} />
        <Wordmark size="sm" color={colors.textSubtle} showTagline />
        <View style={styles.sigLine} />
      </View>
    </ScreenScaffold>
  );
}

function QuickLink({ icon, label, onPress, testID }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={styles.link}
    >
      <View style={styles.linkIcon}>
        <Feather name={icon} size={14} color={colors.textDim} />
      </View>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.text, fontSize: 22, fontWeight: typography.weight.semibold,
    letterSpacing: -0.4, marginTop: 8,
  },
  tagline: { marginTop: 6 },
  stats: { flexDirection: 'row', marginTop: spacing.xl, gap: 12, alignItems: 'flex-start' },
  stat: { flex: 1 },
  statSep: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: colors.divider },
  statLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.6, fontWeight: typography.weight.medium },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 },
  statLead: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.2 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: typography.weight.semibold, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  statValueSolo: { color: colors.text, fontSize: 22, fontWeight: typography.weight.semibold, letterSpacing: -0.4, marginTop: 6, fontVariant: ['tabular-nums'] },

  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.xl },
  link: {
    flexGrow: 1, flexBasis: '46%', maxWidth: '48%',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', gap: 8,
  },
  linkIcon: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center', justifyContent: 'center',
  },
  linkText: { color: colors.textDim, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: typography.weight.medium },

  signature: { alignItems: 'center', marginTop: spacing['2xl'], gap: 14 },
  sigLine: { width: 40, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
