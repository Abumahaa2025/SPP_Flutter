import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { AmbientBackground } from '@/src/components/AmbientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { HealthRing } from '@/src/components/HealthRing';
import { ActionCard } from '@/src/components/ActionCard';
import { GlassTabBar } from '@/src/components/GlassTabBar';
import { StatPill } from '@/src/components/StatPill';
import { api, type Briefing } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';

const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `AED ${(n / 1000).toFixed(0)}K`;
  return `AED ${n}`;
};

/** Pulsing status dot — soft emerald breathing. */
function Pulse() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [p]);
  const s = useAnimatedStyle(() => ({
    opacity: 0.4 + p.value * 0.6,
    transform: [{ scale: 1 + p.value * 0.35 }],
  }));
  return (
    <View style={pulseStyles.wrap}>
      <Animated.View style={[pulseStyles.halo, s]} />
      <View style={pulseStyles.dot} />
    </View>
  );
}
const pulseStyles = StyleSheet.create({
  wrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.emerald, opacity: 0.4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emerald },
});

export default function Home() {
  const insets = useSafeAreaInsets();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('home');

  const load = async () => {
    try {
      setError(null);
      const b = await api.briefing();
      setBriefing(b);
    } catch (e: any) {
      setError(e?.message ?? 'Lost connection to SPP Brain.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    load();
  };

  return (
    <View style={styles.root} testID="ai-employee-home">
      <StatusBar style="light" />
      <AmbientBackground />

      {loading && !briefing ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={styles.loadingText}>Waking up your AI Employee…</Text>
        </View>
      ) : (
        <ScrollView
          testID="home-scroll"
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.lg, paddingBottom: 140 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.emerald}
            />
          }
        >
          {/* ------- Top row ------- */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.topRow}>
            <View style={styles.brandRow}>
              <Pulse />
              <Text style={styles.brandName}>SPP</Text>
              <Text style={styles.brandDivider}>·</Text>
              <Text style={styles.brandSub}>AI Employee</Text>
            </View>
            <Pressable
              testID="notifications-btn"
              onPress={() => Haptics.selectionAsync()}
              style={styles.iconButton}
              hitSlop={8}
            >
              <Ionicons name="notifications-outline" size={18} color={colors.textDim} />
              <View style={styles.badge} />
            </Pressable>
          </Animated.View>

          {/* ------- Hero greeting ------- */}
          <Animated.View entering={FadeInDown.duration(600).delay(80)} style={styles.hero}>
            <Text style={styles.salutation} testID="salutation">
              {briefing?.salutation}, {briefing?.owner_name}.
            </Text>
            <Text style={styles.headline} testID="headline">
              {briefing?.headline}
            </Text>
            <Text style={styles.subhead}>
              I&apos;ve reviewed your portfolio overnight. Here is what matters today.
            </Text>
          </Animated.View>

          {/* ------- Health snapshot ------- */}
          <Animated.View entering={FadeInDown.duration(650).delay(160)}>
            <GlassCard padding={24} radiusToken="lg" edge="emerald" testID="health-card">
              <View style={styles.healthTop}>
                <View>
                  <Text style={styles.eyebrow}>Portfolio Health</Text>
                  <Text style={styles.healthCaption}>
                    {briefing && briefing.avg_health >= 85
                      ? 'Excellent condition.'
                      : briefing && briefing.avg_health >= 70
                        ? 'Stable with items to review.'
                        : 'Needs your attention.'}
                  </Text>
                </View>
                <View style={styles.brainChip}>
                  <Ionicons name="sparkles" size={11} color={colors.gold} />
                  <Text style={styles.brainChipText}>Live</Text>
                </View>
              </View>

              <View style={styles.healthBody}>
                <HealthRing
                  score={briefing?.avg_health ?? 0}
                  label="Health"
                  sublabel="last synced now"
                />
                <View style={styles.statsCol}>
                  <StatPill
                    label="Occupancy"
                    value={`${briefing?.occupancy ?? 0}%`}
                    hint={`${briefing?.properties_count ?? 0} properties`}
                  />
                  <View style={styles.divider} />
                  <StatPill
                    label="Annualized"
                    value={fmtCurrency(briefing?.portfolio_annual_revenue ?? 0)}
                    hint="projected revenue"
                  />
                  <View style={styles.divider} />
                  <StatPill
                    label="Alerts"
                    value={`${briefing?.sensor_alerts.length ?? 0}`}
                    hint="from virtual sensors"
                  />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* ------- Section — Next best actions ------- */}
          <Animated.View entering={FadeInDown.duration(650).delay(240)} style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Next best actions</Text>
            <Text style={styles.sectionSub}>Ranked by projected impact</Text>
          </Animated.View>

          {briefing?.decisions.map((d, i) => (
            <Animated.View
              key={d.id}
              entering={FadeInDown.duration(600).delay(280 + i * 90)}
            >
              <ActionCard decision={d} onAccept={() => {}} onDetails={() => {}} />
            </Animated.View>
          ))}

          {/* ------- Chat entry (Unified Brain) ------- */}
          <Animated.View entering={FadeInDown.duration(650).delay(600)}>
            <Pressable
              testID="open-brain-btn"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTab('brain');
              }}
            >
              <GlassCard padding={18} radiusToken="lg">
                <View style={styles.brainRow}>
                  <View style={styles.brainIcon}>
                    <Ionicons name="sparkles" size={18} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.brainTitle}>Ask the Unified Brain</Text>
                    <Text style={styles.brainSub}>
                      &ldquo;Should I renew Marcus Reed at 4%?&rdquo;
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={colors.textDim} />
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>

          {error ? (
            <View style={styles.errorRow} testID="error-banner">
              <Ionicons name="cloud-offline-outline" size={14} color={colors.warning} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      <GlassTabBar active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: {
    color: colors.textMuted, fontSize: typography.small, letterSpacing: 0.6,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: {
    color: colors.text,
    fontSize: typography.body,
    letterSpacing: 3,
    fontWeight: typography.weight.semibold,
  },
  brandDivider: { color: colors.textSubtle, fontSize: 14, marginHorizontal: 2 },
  brandSub: {
    color: colors.textMuted,
    fontSize: typography.small,
    letterSpacing: 0.6,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  badge: {
    position: 'absolute', top: 10, right: 12,
    width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold,
  },

  hero: {
    marginBottom: spacing.xl,
  },
  salutation: {
    color: colors.textDim,
    fontSize: typography.body,
    letterSpacing: 0.2,
  },
  headline: {
    color: colors.text,
    fontSize: typography.display,
    lineHeight: 40,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
    marginTop: 6,
  },
  subhead: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: 12,
  },

  healthTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
  },
  healthCaption: {
    marginTop: 6,
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
    maxWidth: 200,
  },
  brainChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldEdge,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
    flexShrink: 0,
  },
  brainChipText: {
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
  },
  healthBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  statsCol: { flex: 1, gap: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },

  sectionHead: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
  },
  sectionSub: {
    color: colors.textMuted,
    fontSize: typography.small,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  brainRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  brainIcon: {
    width: 42, height: 42, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.goldEdge,
    backgroundColor: colors.goldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  brainTitle: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
  },
  brainSub: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: typography.small,
  },

  errorRow: {
    marginTop: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center',
  },
  errorText: { color: colors.warning, fontSize: typography.small },
});
