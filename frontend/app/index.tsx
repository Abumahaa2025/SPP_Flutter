import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, Pressable,
} from 'react-native';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedScrollHandler,
  useAnimatedStyle, withRepeat, withTiming, Easing, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { storage } from '@/src/utils/storage';

import { AmbientBackground } from '@/src/components/AmbientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { HealthRing } from '@/src/components/HealthRing';
import { ActionCard } from '@/src/components/ActionCard';
import { GlassTabBar } from '@/src/components/GlassTabBar';
import { LoadingOrb } from '@/src/components/LoadingOrb';
import { api, type Briefing } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';

const AnimatedScroll = Animated.ScrollView;

function QuickLink({ icon, label, onPress, testID }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={quickLinkStyles.wrap}
    >
      <View style={quickLinkStyles.iconWrap}>
        <Feather name={icon} size={14} color={colors.textDim} />
      </View>
      <Text style={quickLinkStyles.label}>{label}</Text>
    </Pressable>
  );
}
const quickLinkStyles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  label: {
    color: colors.textDim, fontSize: 11, letterSpacing: 1.4,
    textTransform: 'uppercase', fontWeight: '500',
  },
});

const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
};

/** Breathing status pulse — used in the brand row & Live chip */
function Pulse({ color = colors.emerald, size = 6 }: { color?: string; size?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [p]);
  const halo = useAnimatedStyle(() => ({
    opacity: 0.35 + p.value * 0.55,
    transform: [{ scale: 1 + p.value * 0.6 }],
  }));
  return (
    <View style={{ width: size * 2.4, height: size * 2.4, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute', width: size * 2.4, height: size * 2.4,
            borderRadius: size * 1.2, backgroundColor: color, opacity: 0.35,
          },
          halo,
        ]}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

/** Localized date eyebrow */
function useDateEyebrow() {
  const [label] = useState(() => {
    const d = new Date();
    const day = d.toLocaleDateString(undefined, { weekday: 'long' });
    const date = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    return `${day} · ${date}`;
  });
  return label;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dateEyebrow = useDateEyebrow();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // header collapses subtly on scroll
  const heroAnim = useAnimatedStyle(() => {
    const shift = interpolate(scrollY.value, [0, 220], [0, -20], Extrapolation.CLAMP);
    const fade = interpolate(scrollY.value, [0, 180], [1, 0.85], Extrapolation.CLAMP);
    return { opacity: fade, transform: [{ translateY: shift }] };
  });

  const load = async () => {
    try {
      const b = await api.briefing();
      setBriefing(b);
    } catch {
      // Silent — the ambient screen speaks for itself.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      const done = await storage.getItem<boolean>('spp.onboarded', false);
      if (!done) {
        router.replace('/onboarding');
        return;
      }
      load();
    })();
  }, []);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    load();
  };

  return (
    <View style={styles.root} testID="ai-employee-home">
      <StatusBar style="light" />
      <AmbientBackground scrollY={scrollY} />

      {loading && !briefing ? (
        <View style={styles.loading}>
          <LoadingOrb size={72} />
          <Text style={styles.loadingText}>Preparing your briefing…</Text>
        </View>
      ) : (
        <AnimatedScroll
          testID="home-scroll"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.xl, paddingBottom: 180 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
            />
          }
        >
          {/* ============ TOP BAR ============ */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.topRow}>
            <View style={styles.brandRow}>
              <Pulse color={colors.emerald} />
              <Text style={styles.brandName}>S P P</Text>
            </View>
            <Pressable
              testID="notifications-btn"
              onPress={() => { Haptics.selectionAsync(); router.push('/notifications'); }}
              style={styles.iconButton}
              hitSlop={8}
            >
              <Feather name="bell" size={16} color={colors.textDim} />
              <View style={styles.badge} />
            </Pressable>
          </Animated.View>

          {/* ============ HERO ============ */}
          <Animated.View
            entering={FadeInDown.duration(700).delay(80)}
            style={[styles.hero, heroAnim]}
          >
            <Text style={styles.eyebrow} testID="date-eyebrow">
              {dateEyebrow}
            </Text>
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

          {/* ============ PORTFOLIO HEALTH ============ */}
          <Animated.View entering={FadeInDown.duration(750).delay(200)}>
            <Pressable
              testID="health-card-btn"
              onPress={() => { Haptics.selectionAsync(); router.push('/health'); }}
            >
              <GlassCard padding={28} radiusToken="lg" edge="emerald" testID="health-card">
              <View style={styles.healthTop}>
                <Text style={styles.sectionEyebrow}>Portfolio Health</Text>
                <View style={styles.liveChip}>
                  <Pulse color={colors.emerald} size={4} />
                  <Text style={styles.liveChipText}>Live</Text>
                </View>
              </View>

              <Text style={styles.healthCaption}>
                {briefing && briefing.avg_health >= 85
                  ? 'Excellent condition.'
                  : briefing && briefing.avg_health >= 70
                    ? 'Stable · items to review.'
                    : 'Attention required.'}
              </Text>

              <View style={styles.healthBody}>
                <HealthRing
                  score={briefing?.avg_health ?? 0}
                  label="Health"
                  sublabel="synced just now"
                />
                <View style={styles.statsCol}>
                  <View>
                    <Text style={styles.statLabel}>Occupancy</Text>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>{briefing?.occupancy ?? 0}</Text>
                      <Text style={styles.statUnit}>%</Text>
                    </View>
                    <Text style={styles.statHint}>{briefing?.properties_count ?? 0} properties</Text>
                  </View>
                  <View style={styles.hair} />
                  <View>
                    <Text style={styles.statLabel}>Annualized</Text>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statUnitLead}>AED</Text>
                      <Text style={styles.statValue}>
                        {fmtCurrency(briefing?.portfolio_annual_revenue ?? 0)}
                      </Text>
                    </View>
                    <Text style={styles.statHint}>projected revenue</Text>
                  </View>
                  <View style={styles.hair} />
                  <View>
                    <Text style={styles.statLabel}>Signal</Text>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>{briefing?.sensor_alerts.length ?? 0}</Text>
                      <Text style={styles.statUnit}>alerts</Text>
                    </View>
                    <Text style={styles.statHint}>from virtual sensors</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
            </Pressable>
          </Animated.View>

          {/* ============ TODAY'S PRIORITIES ============ */}
          <Animated.View
            entering={FadeInDown.duration(650).delay(320)}
            style={styles.sectionHead}
          >
            <Pressable
              testID="priorities-header-btn"
              onPress={() => { Haptics.selectionAsync(); router.push('/maintenance'); }}
              style={{ flex: 1 }}
            >
              <Text style={styles.sectionTitle}>Today&apos;s priorities</Text>
              <Text style={styles.sectionSub}>Ranked by projected impact</Text>
            </Pressable>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{briefing?.decisions.length ?? 0}</Text>
            </View>
          </Animated.View>

          {briefing?.decisions.map((d, i) => (
            <Animated.View
              key={d.id}
              entering={FadeInDown.duration(650).delay(360 + i * 90)}
            >
              <ActionCard
                decision={d}
                rank={i + 1}
                onAccept={() => {
                  if (d.kind === 'maintenance') router.push('/maintenance');
                  else if (d.property_id) router.push(`/property/${d.property_id}` as any);
                }}
                onDetails={() => {
                  if (d.property_id) router.push(`/property/${d.property_id}` as any);
                  else router.push('/maintenance');
                }}
              />
            </Animated.View>
          ))}

          {/* ============ ASK THE BRAIN ============ */}
          <Animated.View entering={FadeInDown.duration(700).delay(720)} style={{ marginTop: spacing.md }}>
            <Pressable
              testID="open-brain-btn"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/brain');
              }}
            >
              <GlassCard padding={22} radiusToken="lg">
                <View style={styles.brainRow}>
                  <View style={styles.brainIcon}>
                    <Feather name="message-circle" size={18} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.brainTitle}>Ask the Unified Brain</Text>
                    <Text style={styles.brainSub}>
                      &ldquo;Should I renew Marcus Reed at 4%?&rdquo;
                    </Text>
                  </View>
                  <View style={styles.brainArrow}>
                    <Feather name="arrow-up-right" size={16} color={colors.textDim} />
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>

          {/* ============ QUICK NAV ============ */}
          <Animated.View entering={FadeIn.duration(700).delay(820)} style={styles.quickNav}>
            <QuickLink icon="activity" label="Sensors" onPress={() => router.push('/sensors')} testID="qn-sensors" />
            <QuickLink icon="heart" label="Health" onPress={() => router.push('/health')} testID="qn-health" />
            <QuickLink icon="settings" label="Settings" onPress={() => router.push('/settings')} testID="qn-settings" />
          </Animated.View>

          {/* ============ FOOTER SIGNATURE ============ */}
          <Animated.View entering={FadeIn.duration(700).delay(900)} style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>SPP · your AI employee, always working</Text>
          </Animated.View>
        </AnimatedScroll>
      )}

      <GlassTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24,
  },
  loadingText: {
    color: colors.textMuted, fontSize: typography.small, letterSpacing: 1.2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },

  // ---- Top bar ----
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: {
    color: colors.text,
    fontSize: 13,
    letterSpacing: 6,
    fontWeight: typography.weight.semibold,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  badge: {
    position: 'absolute', top: 10, right: 12,
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold,
    shadowColor: colors.gold, shadowOpacity: 0.9, shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },

  // ---- Hero ----
  hero: { marginBottom: spacing['2xl'] },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
    marginBottom: spacing.md,
  },
  salutation: {
    color: colors.textDim,
    fontSize: typography.title,
    letterSpacing: typography.letter.tight,
    lineHeight: 28,
  },
  headline: {
    color: colors.text,
    fontSize: typography.display,
    lineHeight: 40,
    fontWeight: typography.weight.semibold,
    letterSpacing: -0.8,
    marginTop: 6,
  },
  subhead: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.md,
    maxWidth: '92%',
  },

  // ---- Health card ----
  healthTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
  },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.emeraldEdge,
    backgroundColor: colors.emeraldSoft,
  },
  liveChipText: {
    color: colors.emerald,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
  },
  healthCaption: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
    marginTop: spacing.sm,
  },
  healthBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  statsCol: { flex: 1, gap: spacing.md },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  statUnitLead: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    marginRight: 2,
  },
  statHint: {
    color: colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  hair: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },

  // ---- Section header ----
  sectionHead: {
    marginTop: spacing['2xl'],
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  countBadge: {
    minWidth: 26, height: 26, borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldEdge,
    backgroundColor: colors.goldSoft,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: typography.weight.semibold,
    fontVariant: ['tabular-nums'],
  },

  // ---- Brain row ----
  brainRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  brainIcon: {
    width: 44, height: 44, borderRadius: radius.pill,
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
    marginTop: 4,
    color: colors.textMuted,
    fontSize: typography.small,
    fontStyle: 'italic',
  },
  brainArrow: {
    width: 34, height: 34, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },

  // ---- Footer signature ----
  footer: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
  },
  quickNav: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerLine: {
    width: 40, height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  footerText: {
    color: colors.textSubtle,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
  },
});
