import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { HealthRing } from '@/src/components/HealthRing';
import { api, type Briefing, type PropertyT } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
};

export default function Insights() {
  const { t } = useI18n();
  const router = useRouter();
  const [b, setB] = useState<Briefing | null>(null);
  const [props, setProps] = useState<PropertyT[]>([]);

  useEffect(() => {
    api.briefing().then(setB).catch(() => {});
    api.properties().then(setProps).catch(() => {});
  }, []);

  const bars = props
    .slice()
    .sort((a, z) => z.monthly_revenue - a.monthly_revenue);
  const maxRev = Math.max(1, ...bars.map((p) => p.monthly_revenue));

  return (
    <ScreenScaffold testID="insights-screen">
      <ScreenHeader
        eyebrow={t('nav.insights')}
        title={t('insights.title')}
        sub={t('insights.sub')}
      />

      {/* KPI Row */}
      <Animated.View entering={FadeInDown.duration(650).delay(60)}>
        <GlassCard padding={22} radiusToken="lg" edge="emerald">
          <View style={styles.kpiTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kpiEyebrow}>Annualized revenue</Text>
              <View style={styles.kpiRow}>
                <Text style={styles.kpiLead}>AED</Text>
                <Text style={styles.kpiValue}>{fmtCurrency(b?.portfolio_annual_revenue ?? 0)}</Text>
              </View>
              <View style={styles.trendRow}>
                <Feather name="trending-up" size={12} color={colors.emerald} />
                <Text style={styles.trendText}>+8.2% vs last quarter</Text>
              </View>
            </View>
            <HealthRing score={b?.avg_health ?? 0} size={110} stroke={9} label="Health" />
          </View>
        </GlassCard>
      </Animated.View>

      {/* Revenue bars */}
      <Animated.View entering={FadeInDown.duration(650).delay(140)} style={{ marginTop: spacing.lg }}>
        <GlassCard padding={22} radiusToken="lg">
          <Text style={styles.sectionEyebrow}>Revenue by property · monthly</Text>
          <View style={{ marginTop: spacing.md, gap: 14 }}>
            {bars.map((p) => {
              const w = (p.monthly_revenue / maxRev) * 100;
              return (
                <Pressable
                  key={p.id}
                  testID={`insight-bar-${p.id}`}
                  onPress={() => { Haptics.selectionAsync(); router.push(`/property/${p.id}` as any); }}
                >
                  <View style={styles.barRow}>
                    <Text style={styles.barName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.barValue}>AED {fmtCurrency(p.monthly_revenue)}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${w}%` }]} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>
      </Animated.View>

      {/* Occupancy + Signal grid */}
      <View style={styles.grid}>
        <GridStat
          delay={220}
          label="Occupancy"
          value={`${b?.occupancy ?? 0}%`}
          hint={`${b?.properties_count ?? 0} properties`}
          icon="users"
        />
        <GridStat
          delay={280}
          label="Signals"
          value={`${b?.sensor_alerts.length ?? 0}`}
          hint="active alerts"
          icon="activity"
          accent={colors.gold}
        />
      </View>

      {/* Decisions distribution */}
      <Animated.View entering={FadeInDown.duration(650).delay(340)} style={{ marginTop: spacing.lg }}>
        <GlassCard padding={22} radiusToken="lg">
          <Text style={styles.sectionEyebrow}>AI activity · today</Text>
          <View style={styles.aiRow}>
            <Feather name="cpu" size={16} color={colors.gold} />
            <Text style={styles.aiText}>
              {b?.decisions.length ?? 0} decisions surfaced · {b?.sensor_alerts.length ?? 0} sensor
              signals · continuously learning your preferences.
            </Text>
          </View>
        </GlassCard>
      </Animated.View>
    </ScreenScaffold>
  );
}

function GridStat({
  label, value, hint, icon, delay = 0, accent = colors.emerald,
}: { label: string; value: string; hint: string; icon: keyof typeof Feather.glyphMap; delay?: number; accent?: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(650).delay(delay)} style={{ flex: 1 }}>
      <GlassCard padding={18} radiusToken="lg">
        <Feather name={icon} size={14} color={accent} />
        <Text style={styles.gsLabel}>{label}</Text>
        <Text style={styles.gsValue}>{value}</Text>
        <Text style={styles.gsHint}>{hint}</Text>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  kpiTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  kpiEyebrow: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  kpiRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  kpiLead: { color: colors.textMuted, fontSize: 12, letterSpacing: 1.2 },
  kpiValue: {
    color: colors.text, fontSize: 30, fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight, fontVariant: ['tabular-nums'],
  },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  trendText: { color: colors.emerald, fontSize: 12 },
  sectionEyebrow: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barName: { color: colors.text, fontSize: 13, flex: 1, marginRight: 12 },
  barValue: { color: colors.textDim, fontSize: 12, fontVariant: ['tabular-nums'] },
  barTrack: {
    height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 8, overflow: 'hidden',
  },
  barFill: {
    height: 6, borderRadius: 3, backgroundColor: colors.gold,
    shadowColor: colors.gold, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
  },
  grid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  gsLabel: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 1.8,
    textTransform: 'uppercase', fontWeight: typography.weight.medium, marginTop: 10,
  },
  gsValue: {
    color: colors.text, fontSize: 26, fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight, marginTop: 4, fontVariant: ['tabular-nums'],
  },
  gsHint: { color: colors.textSubtle, fontSize: 11, marginTop: 4 },
  aiRow: { flexDirection: 'row', gap: 12, marginTop: 14, alignItems: 'flex-start' },
  aiText: { flex: 1, color: colors.textDim, fontSize: 13, lineHeight: 20 },
});
