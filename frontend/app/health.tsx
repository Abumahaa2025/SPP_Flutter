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
import { BrainVerdict } from '@/src/components/BrainVerdict';
import { api, type Briefing, type PropertyT } from '@/src/api/client';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';

export default function Health() {
  const { t } = useI18n();
  const router = useRouter();
  const [b, setB] = useState<Briefing | null>(null);
  const [props, setProps] = useState<PropertyT[]>([]);

  useEffect(() => {
    api.briefing().then(setB).catch(() => {});
    api.properties().then(setProps).catch(() => {});
  }, []);

  const sorted = props.slice().sort((a, z) => z.health_score - a.health_score);

  return (
    <ScreenScaffold testID="health-screen">
      <ScreenHeader
        eyebrow="Portfolio"
        title={t('health.title')}
        sub={t('health.sub')}
        showBack
      />

      <BrainVerdict screen="health" />

      {/* Composite score */}
      <Animated.View entering={FadeInDown.duration(650)}>
        <GlassCard padding={26} radiusToken="lg" edge="emerald">
          <View style={styles.center}>
            <HealthRing score={b?.avg_health ?? 0} size={200} stroke={14} label="Composite" sublabel="across your portfolio" />
          </View>
          <Text style={styles.caption}>
            {b && b.avg_health >= 85 ? 'Your portfolio is in world-class condition.' :
              b && b.avg_health >= 70 ? 'Stable overall. A few items need attention.' :
                'Attention required across multiple properties.'}
          </Text>
        </GlassCard>
      </Animated.View>

      {/* Ranked list */}
      <View style={{ marginTop: spacing.xl }}>
        <Text style={styles.eyebrow}>Ranked by health</Text>
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {sorted.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.duration(600).delay(80 * i)}>
              <Pressable
                testID={`health-row-${p.id}`}
                onPress={() => { Haptics.selectionAsync(); router.push(`/property/${p.id}` as any); }}
              >
                <GlassCard padding={18} radiusToken="lg">
                  <View style={styles.row}>
                    <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{p.name}</Text>
                      <Text style={styles.city}>{p.city}</Text>
                    </View>
                    <View style={styles.scoreWrap}>
                      <Text style={[styles.score, { color: p.health_score >= 85 ? colors.emerald : p.health_score >= 70 ? colors.gold : colors.danger }]}>
                        {p.health_score}
                      </Text>
                      <Feather name="chevron-right" size={14} color={colors.textMuted} />
                    </View>
                  </View>
                  <View style={styles.bar}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${p.health_score}%`,
                          backgroundColor: p.health_score >= 85 ? colors.emerald : p.health_score >= 70 ? colors.gold : colors.danger,
                        },
                      ]}
                    />
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  caption: {
    color: colors.textDim, textAlign: 'center', fontSize: 14, lineHeight: 22,
    marginTop: spacing.lg, paddingHorizontal: 12,
  },
  eyebrow: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rank: {
    color: colors.textSubtle, fontSize: 11, letterSpacing: 2,
    fontVariant: ['tabular-nums'], width: 24,
  },
  name: { color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold, letterSpacing: typography.letter.tight },
  city: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  score: { fontSize: 22, fontWeight: typography.weight.semibold, fontVariant: ['tabular-nums'], letterSpacing: typography.letter.tight },
  bar: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.04)', marginTop: 14, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
});
