import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { EmptyState } from '@/src/components/EmptyState';
import { BrainVerdict } from '@/src/components/BrainVerdict';
import { api, type GuideT } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

export default function Guides() {
  const { t } = useI18n();
  const [items, setItems] = useState<GuideT[]>([]);
  useEffect(() => { api.guides().then(setItems).catch(() => {}); }, []);

  return (
    <ScreenScaffold testID="guides-screen">
      <ScreenHeader eyebrow="Install" title={t('guides.title')} sub={t('guides.sub')} showBack />
      <BrainVerdict screen="guides" />
      {items.length === 0 ? (
        <EmptyState icon="play-circle" title="Video guides landing soon." />
      ) : items.map((g, i) => (
        <Animated.View key={g.id} entering={FadeInDown.duration(600).delay(60 * i)}>
          <Pressable
            testID={`guide-${g.id}`}
            onPress={() => Haptics.selectionAsync()}
            style={{ marginBottom: spacing.md }}
          >
            <GlassCard padding={0} radiusToken="lg">
              <View style={styles.card}>
                <Image source={{ uri: g.poster }} style={styles.poster} contentFit="cover" transition={340} />
                <View style={styles.overlay} />
                <View style={styles.gradTop} />
                <View style={styles.gradBottom} />
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{g.level.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.playWrap}>
                  <View style={styles.playChip}>
                    <Feather name="play" size={22} color={colors.bg} />
                  </View>
                </View>
                <View style={styles.durationRow}>
                  <Feather name="clock" size={11} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.duration}>{g.duration}</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.title}>{g.title}</Text>
                  <View style={styles.metaRow}>
                    <Feather name="layers" size={11} color={colors.textMuted} />
                    <Text style={styles.meta}>{g.chapters} {t('guides.chapters')}</Text>
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

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  poster: { width: '100%', height: 200 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(5,10,18,0.32)' },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 70, backgroundColor: 'rgba(5,10,18,0.55)' },
  gradBottom: { position: 'absolute', top: 130, left: 0, right: 0, height: 70, backgroundColor: 'rgba(5,10,18,0.55)' },
  badgeRow: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', gap: 6 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(5,10,18,0.55)',
  },
  badgeText: { color: colors.text, fontSize: 9.5, letterSpacing: 1.4, fontWeight: typography.weight.medium },
  playWrap: { position: 'absolute', top: 200 / 2 - 26, left: 0, right: 0, alignItems: 'center' },
  playChip: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.gold, shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  durationRow: { position: 'absolute', top: 168, right: 16, flexDirection: 'row', alignItems: 'center', gap: 5 },
  duration: { color: 'rgba(255,255,255,0.9)', fontSize: 11, letterSpacing: 0.4 },
  body: { padding: 20 },
  title: { color: colors.text, fontSize: 16, fontWeight: typography.weight.semibold, letterSpacing: -0.2, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  meta: { color: colors.textMuted, fontSize: 12 },
});
