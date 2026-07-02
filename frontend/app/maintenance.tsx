import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { api, type DecisionT, type PropertyT } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

export default function Maintenance() {
  const { t } = useI18n();
  const [decisions, setDecisions] = useState<DecisionT[]>([]);
  const [props, setProps] = useState<PropertyT[]>([]);

  useEffect(() => {
    api.decisions().then((d) => setDecisions(d.filter((x) => x.kind === 'maintenance')));
    api.properties().then(setProps);
  }, []);

  const propMap = useMemo(() => {
    const m = new Map<string, PropertyT>();
    props.forEach((p) => m.set(p.id, p));
    return m;
  }, [props]);

  return (
    <ScreenScaffold testID="maintenance-screen">
      <ScreenHeader
        eyebrow="Predictive"
        title={t('maintenance.title')}
        sub={t('maintenance.sub')}
        showBack
      />

      {/* Explainer */}
      <Animated.View entering={FadeInDown.duration(650)}>
        <GlassCard padding={22} radiusToken="lg" edge="emerald">
          <View style={styles.explainRow}>
            <View style={styles.iconWrap}>
              <Feather name="activity" size={16} color={colors.emerald} />
            </View>
            <Text style={styles.explainText}>
              SPP watches every sensor and every service log. Interventions are proposed
              before a failure, not after.
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Timeline */}
      <View style={{ marginTop: spacing.xl }}>
        <Text style={styles.sectionEyebrow}>Upcoming interventions</Text>
        {decisions.length === 0 ? (
          <GlassCard padding={22} radiusToken="lg" style={{ marginTop: spacing.md }}>
            <Text style={styles.empty}>Nothing predicted right now. Your properties are calm.</Text>
          </GlassCard>
        ) : (
          decisions.map((d, i) => {
            const prop = d.property_id ? propMap.get(d.property_id) : null;
            return (
              <Animated.View
                key={d.id}
                entering={FadeInDown.duration(650).delay(100 + i * 80)}
                style={styles.row}
              >
                <View style={styles.spine}>
                  <View style={[styles.dot, { backgroundColor: d.priority === 'critical' ? colors.danger : colors.gold }]} />
                  {i < decisions.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <GlassCard padding={20} radiusToken="lg" edge={d.priority === 'critical' ? 'gold' : 'neutral'}>
                    {prop ? <Text style={styles.eyebrow}>{prop.name}</Text> : null}
                    <Text style={styles.title}>{d.title}</Text>
                    <Text style={styles.reason}>{d.reason}</Text>
                    <View style={styles.impactRow}>
                      <View style={styles.impactBar} />
                      <Text style={styles.impact}>{d.impact}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Feather name="target" size={12} color={colors.textMuted} />
                      <Text style={styles.metaText}>{d.confidence}% confidence</Text>
                      <View style={styles.metaDot} />
                      <Feather name="clock" size={12} color={colors.textMuted} />
                      <Text style={styles.metaText}>{new Date(d.created_at).toLocaleDateString()}</Text>
                    </View>
                  </GlassCard>
                </View>
              </Animated.View>
            );
          })
        )}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  explainRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.emeraldEdge,
    backgroundColor: colors.emeraldSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  explainText: { flex: 1, color: colors.textDim, fontSize: 14, lineHeight: 21 },
  sectionEyebrow: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
    marginBottom: spacing.md,
  },
  empty: { color: colors.textMuted, textAlign: 'center', fontSize: 13 },
  row: { flexDirection: 'row', gap: 12 },
  spine: { width: 12, alignItems: 'center', paddingTop: 20 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    shadowColor: colors.gold, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  line: { flex: 1, width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginTop: 6, marginBottom: -spacing.md },
  eyebrow: {
    color: colors.textMuted, fontSize: 10.5, letterSpacing: 1.8,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  title: {
    color: colors.text, fontSize: typography.cardTitle, fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight, marginTop: 8, lineHeight: 24,
  },
  reason: { color: colors.textDim, fontSize: 14, lineHeight: 21, marginTop: 8 },
  impactRow: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  impactBar: { width: 2, height: 14, backgroundColor: colors.emerald, borderRadius: 1 },
  impact: { color: colors.emerald, fontSize: 12.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  metaText: { color: colors.textMuted, fontSize: 12 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textSubtle, marginHorizontal: 4 },
});
