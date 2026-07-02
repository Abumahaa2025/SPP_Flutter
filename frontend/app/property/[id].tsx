import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/src/components/AmbientBackground';
import { GlassCard } from '@/src/components/GlassCard';
import { HealthRing } from '@/src/components/HealthRing';
import { api, type PropertyT, type SensorT, type TimelineT } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type Tab = 'overview' | 'sensors' | 'timeline';

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [prop, setProp] = useState<PropertyT | null>(null);
  const [sensors, setSensors] = useState<SensorT[]>([]);
  const [timeline, setTimeline] = useState<TimelineT[]>([]);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!id) return;
    api.property(id).then(setProp).catch(() => {});
    api.sensors().then((all) => setSensors(all.filter((s) => s.property_id === id)));
    api.timeline().then((all) => setTimeline(all.filter((tl) => tl.property_id === id)));
  }, [id]);

  const tabs: { key: Tab; labelKey: any }[] = [
    { key: 'overview', labelKey: 'property.overview' },
    { key: 'sensors', labelKey: 'property.sensors' },
    { key: 'timeline', labelKey: 'property.timeline' },
  ];

  return (
    <View style={styles.root} testID="property-detail">
      <StatusBar style="light" />
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View style={styles.hero}>
          {prop ? (
            <Image source={{ uri: prop.hero_image }} style={styles.heroImg} contentFit="cover" transition={300} />
          ) : null}
          <View style={styles.heroOverlay} />
          <Pressable
            testID="detail-back"
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
            style={[styles.back, { top: insets.top + 12 }]}
            hitSlop={8}
          >
            <Feather name="arrow-left" size={16} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Text style={styles.city}>{prop?.city.toUpperCase()}</Text>
            <Text style={styles.name}>{prop?.name}</Text>
            <Text style={styles.address}>{prop?.address}</Text>
          </Animated.View>

          {/* Health & KPI card */}
          <Animated.View entering={FadeInDown.duration(650).delay(100)} style={{ marginTop: spacing.xl }}>
            <GlassCard padding={22} radiusToken="lg" edge="emerald">
              <View style={styles.healthRow}>
                <HealthRing score={prop?.health_score ?? 0} size={128} stroke={10} label="Health" />
                <View style={{ flex: 1, gap: 16 }}>
                  <Stat label="Occupancy" value={`${Math.round((prop?.occupancy ?? 0) * 100)}%`} />
                  <Divider />
                  <Stat label="Units" value={`${prop?.units ?? 0}`} />
                  <Divider />
                  <Stat label="Monthly" value={`AED ${((prop?.monthly_revenue ?? 0) / 1000).toFixed(0)}K`} />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Tab chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={{ marginTop: spacing.xl, marginHorizontal: -spacing.lg }}
          >
            {tabs.map((tt) => {
              const active = tab === tt.key;
              return (
                <Pressable
                  key={tt.key}
                  testID={`ptab-${tt.key}`}
                  onPress={() => { Haptics.selectionAsync(); setTab(tt.key); }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(tt.labelKey)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {tab === 'overview' ? (
            <View style={{ marginTop: spacing.md, gap: spacing.md }}>
              <GlassCard padding={22} radiusToken="lg">
                <Text style={styles.sectionEyebrow}>AI summary</Text>
                <Text style={styles.summary}>
                  {(prop?.health_score ?? 0) >= 85
                    ? 'This property is in excellent condition. No action required this week.'
                    : (prop?.health_score ?? 0) >= 70
                      ? 'Stable overall. A few sensor readings are worth reviewing.'
                      : 'Attention required — SPP has surfaced actions on your Home screen.'}
                </Text>
              </GlassCard>
              <GlassCard padding={22} radiusToken="lg">
                <Text style={styles.sectionEyebrow}>Kind</Text>
                <Text style={styles.summary}>{(prop?.kind ?? '').replace(/^./, (c) => c.toUpperCase())}</Text>
              </GlassCard>
            </View>
          ) : null}

          {tab === 'sensors' ? (
            <View style={{ marginTop: spacing.md, gap: spacing.md }}>
              {sensors.map((s) => (
                <GlassCard key={s.id} padding={18} radiusToken="lg">
                  <View style={styles.sensorRow}>
                    <View style={[styles.sensorDot, { backgroundColor: s.status === 'nominal' ? colors.emerald : colors.gold }]} />
                    <Text style={styles.sensorLabel}>{s.label} · {s.kind}</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.sensorValue}>{s.value}{s.unit ? ` ${s.unit}` : ''}</Text>
                  </View>
                </GlassCard>
              ))}
              {sensors.length === 0 ? <Empty text="No sensors configured yet." /> : null}
            </View>
          ) : null}

          {tab === 'timeline' ? (
            <View style={{ marginTop: spacing.md }}>
              {timeline.map((tl) => (
                <View key={tl.id} style={styles.tlRow}>
                  <View style={styles.tlSpine}>
                    <View style={styles.tlDot} />
                    <View style={styles.tlLine} />
                  </View>
                  <View style={{ flex: 1, paddingBottom: 22 }}>
                    <Text style={styles.tlTitle}>{tl.title}</Text>
                    <Text style={styles.tlSub}>{tl.subtitle}</Text>
                    <Text style={styles.tlAt}>{new Date(tl.at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))}
              {timeline.length === 0 ? <Empty text="Nothing on the timeline yet." /> : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}
function Divider() { return <View style={styles.hair} />; }
function Empty({ text }: { text: string }) {
  return (
    <GlassCard padding={22} radiusToken="lg">
      <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>{text}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 340, width: '100%' },
  heroImg: { ...StyleSheet.absoluteFillObject },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,11,20,0.35)',
  },
  back: {
    position: 'absolute', left: spacing.lg,
    width: 40, height: 40, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(6,11,20,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.lg, marginTop: -60 },
  city: { color: colors.textMuted, fontSize: 11, letterSpacing: 2.4, fontWeight: typography.weight.medium },
  name: {
    color: colors.text, fontSize: 30, fontWeight: typography.weight.semibold,
    letterSpacing: -0.6, marginTop: 8, lineHeight: 36,
  },
  address: { color: colors.textMuted, fontSize: 14, marginTop: 6 },

  healthRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  statLabel: { color: colors.textMuted, fontSize: 10.5, letterSpacing: 1.8, textTransform: 'uppercase' },
  statValue: {
    color: colors.text, fontSize: 20, fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight, marginTop: 4, fontVariant: ['tabular-nums'],
  },
  hair: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },

  chipRow: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: {
    height: 36, borderRadius: radius.pill, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipActive: { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
  chipText: { color: colors.textMuted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: typography.weight.medium },
  chipTextActive: { color: colors.gold },

  sectionEyebrow: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  summary: { color: colors.textDim, fontSize: 14.5, lineHeight: 22, marginTop: 10 },

  sensorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sensorDot: { width: 8, height: 8, borderRadius: 4 },
  sensorLabel: { color: colors.textDim, fontSize: 13 },
  sensorValue: { color: colors.text, fontSize: 15, fontVariant: ['tabular-nums'], fontWeight: typography.weight.semibold },

  tlRow: { flexDirection: 'row', gap: 14 },
  tlSpine: { width: 12, alignItems: 'center' },
  tlDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  tlLine: { flex: 1, width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 2 },
  tlTitle: { color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold },
  tlSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  tlAt: { color: colors.textSubtle, fontSize: 11, marginTop: 4 },
});
