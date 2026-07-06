import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/src/components/GlassCard';
import { AppIcon } from '@/src/components/ui/AppIcon';
import type { PortfolioAnalysis } from '@/src/api/portfolio-analysis';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type Props = { analysis: PortfolioAnalysis; delay?: number };

/** Phase 2 — executive report from portfolio analysis. */
export function UploadExecutiveReport({ analysis, delay = 0 }: Props) {
  const { t, isRTL } = useI18n();
  const { executive_report: report, metrics, month_comparison } = analysis;

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(delay)} style={styles.wrap}>
      <View style={[styles.header, isRTL && styles.rowRtl]}>
        <AppIcon name="bar-chart-2" size="md" accent="gold" />
        <Text style={[styles.title, isRTL && styles.rtl]}>{report.title}</Text>
      </View>

      <GlassCard padding={20} radiusToken="lg" edge="gold">
        <Text style={[styles.phase, isRTL && styles.rtl]}>{t('upload.phase.analysis')}</Text>
        <View style={styles.metricGrid}>
          {[
            { k: t('upload.metric.properties'), v: metrics.properties },
            { k: t('upload.metric.units'), v: metrics.units },
            { k: t('upload.metric.tenants'), v: metrics.tenants },
            { k: t('upload.metric.occupancy'), v: `${metrics.occupancy_pct}%` },
          ].map((m) => (
            <View key={m.k} style={styles.metricCell}>
              <Text style={[styles.metricLabel, isRTL && styles.rtl]}>{m.k}</Text>
              <Text style={styles.metricValue}>{m.v}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {report.sections.map((sec, i) => (
        <Animated.View key={sec.key} entering={FadeInDown.duration(500).delay(delay + 80 + i * 50)}>
          <GlassCard padding={18} radiusToken="md" style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{sec.title}</Text>
            {sec.items.map((item) => (
              <View key={item.label} style={[styles.row, isRTL && styles.rowRtl]}>
                <Text style={[styles.rowLabel, isRTL && styles.rtl]}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            ))}
          </GlassCard>
        </Animated.View>
      ))}

      {month_comparison.length > 0 ? (
        <GlassCard padding={18} radiusToken="md" edge="emerald">
          <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{t('upload.metric.monthCompare')}</Text>
          {month_comparison.slice(0, 6).map((m) => (
            <View key={m.month} style={[styles.row, isRTL && styles.rowRtl]}>
              <Text style={[styles.rowLabel, isRTL && styles.rtl]}>{m.month}</Text>
              <Text style={styles.rowValue}>
                {m.revenue.toLocaleString()} / {m.expenses.toLocaleString()}
              </Text>
            </View>
          ))}
        </GlassCard>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  rowRtl: { flexDirection: 'row-reverse' },
  title: { color: colors.text, fontSize: 18, fontWeight: typography.weight.semibold, flex: 1 },
  phase: {
    color: colors.gold, fontSize: 10, letterSpacing: 1.6,
    textTransform: 'uppercase', marginBottom: 14, fontWeight: typography.weight.medium,
  },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCell: {
    width: '47%',
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  metricLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.6 },
  metricValue: { color: colors.text, fontSize: 18, fontWeight: typography.weight.semibold, marginTop: 4 },
  sectionCard: { marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: typography.weight.semibold, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  rowLabel: { color: colors.textDim, fontSize: 13, flex: 1 },
  rowValue: { color: colors.gold, fontSize: 13, fontWeight: typography.weight.medium },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
