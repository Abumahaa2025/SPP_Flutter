import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { BrainVerdict } from '@/src/components/BrainVerdict';
import { api, type PropertyT } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type Filter = 'all' | 'attention' | 'stable';

export default function Portfolio() {
  const { t } = useI18n();
  const router = useRouter();
  const [props, setProps] = useState<PropertyT[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => { api.properties().then(setProps).catch(() => {}); }, []);

  const filtered = useMemo(() => {
    if (filter === 'attention') return props.filter((p) => p.health_score < 80);
    if (filter === 'stable') return props.filter((p) => p.health_score >= 80);
    return props;
  }, [props, filter]);

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: t('portfolio.filter.all') },
    { key: 'attention', label: t('portfolio.filter.attention') },
    { key: 'stable', label: t('portfolio.filter.stable') },
  ];

  return (
    <ScreenScaffold testID="portfolio-screen">
      <ScreenHeader
        eyebrow={t('nav.portfolio')}
        title={t('portfolio.title')}
        sub={t('portfolio.sub')}
      />

      <BrainVerdict screen="portfolio" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={{ marginBottom: spacing.lg, marginHorizontal: -spacing.lg }}
      >
        {chips.map((c) => {
          const active = c.key === filter;
          return (
            <Pressable
              key={c.key}
              testID={`filter-${c.key}`}
              onPress={() => { Haptics.selectionAsync(); setFilter(c.key); }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.map((p, i) => (
        <Animated.View key={p.id} entering={FadeInDown.duration(600).delay(60 * i)}>
          <Pressable
            testID={`prop-${p.id}`}
            onPress={() => { Haptics.selectionAsync(); router.push(`/property/${p.id}` as any); }}
          >
            <GlassCard padding={0} radiusToken="lg" style={{ marginBottom: spacing.md }}>
              <View style={styles.card}>
                <Image
                  source={{ uri: p.hero_image }}
                  style={styles.image}
                  contentFit="cover"
                  transition={340}
                />
                <View style={styles.imageOverlay} />
                <View style={styles.imageGradient}>
                  <View style={styles.gradTop} />
                  <View style={styles.gradBottom} />
                </View>
                <View style={styles.imageBadgeRow}>
                  <View style={styles.imageBadge}>
                    <Text style={styles.imageBadgeText}>{p.kind.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.city}>{p.city.toUpperCase()}</Text>
                      <Text style={styles.name}>{p.name}</Text>
                    </View>
                    <HealthPill score={p.health_score} />
                  </View>
                  <View style={styles.metaRow}>
                    <Meta icon="home" label={`${p.units} unit${p.units > 1 ? 's' : ''}`} />
                    <Dot />
                    <Meta icon="users" label={`${Math.round(p.occupancy * 100)}% occ.`} />
                    <Dot />
                    <Meta icon="trending-up" label={`AED ${(p.monthly_revenue / 1000).toFixed(0)}K/mo`} />
                  </View>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      ))}
    </ScreenScaffold>
  );
}

function HealthPill({ score }: { score: number }) {
  const color = score >= 85 ? colors.emerald : score >= 70 ? colors.gold : colors.danger;
  const soft = score >= 85 ? colors.emeraldSoft : score >= 70 ? colors.goldSoft : 'rgba(239,68,68,0.14)';
  const edge = score >= 85 ? colors.emeraldEdge : score >= 70 ? colors.goldEdge : 'rgba(239,68,68,0.35)';
  return (
    <View style={[styles.pill, { backgroundColor: soft, borderColor: edge }]}>
      <Text style={[styles.pillNum, { color }]}>{score}</Text>
      <Text style={[styles.pillLabel, { color }]}>HEALTH</Text>
    </View>
  );
}

function Meta({ icon, label }: { icon: keyof typeof Feather.glyphMap; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Feather name={icon} size={12} color={colors.textMuted} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

function Dot() {
  return <View style={styles.metaDot} />;
}

const styles = StyleSheet.create({
  chipRow: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: {
    height: 36, borderRadius: radius.pill,
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)', flexShrink: 0,
  },
  chipActive: {
    borderColor: colors.goldEdge, backgroundColor: colors.goldSoft,
  },
  chipText: {
    color: colors.textMuted, fontSize: 12, letterSpacing: 1,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  chipTextActive: { color: colors.gold },
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  image: { width: '100%', height: 200 },
  imageOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 200,
    backgroundColor: 'rgba(5,10,18,0.28)',
  },
  imageGradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 200 },
  gradTop: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 60,
    backgroundColor: 'rgba(5,10,18,0.55)',
  },
  gradBottom: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 90,
    backgroundColor: 'rgba(5,10,18,0.5)',
  },
  imageBadgeRow: {
    position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8,
  },
  imageBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(5,10,18,0.55)',
  },
  imageBadgeText: {
    color: colors.text, fontSize: 9.5, letterSpacing: 1.6, fontWeight: typography.weight.medium,
  },
  cardBody: { padding: 22 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  city: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 2,
    fontWeight: typography.weight.medium,
  },
  name: {
    color: colors.text, fontSize: typography.cardTitle,
    fontWeight: typography.weight.semibold, letterSpacing: typography.letter.tight,
    marginTop: 4,
  },
  pill: {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md,
    paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center',
  },
  pillNum: { fontSize: 18, fontWeight: typography.weight.semibold, fontVariant: ['tabular-nums'] },
  pillLabel: { fontSize: 9, letterSpacing: 1.2, marginTop: -2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.textDim, fontSize: 12 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textSubtle },
});
