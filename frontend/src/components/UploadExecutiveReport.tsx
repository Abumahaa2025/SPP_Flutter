import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/src/components/GlassCard';
import { LatePaymentsSection } from '@/src/components/LatePaymentsSection';
import { AppIcon } from '@/src/components/ui/AppIcon';
import type { PortfolioAnalysis, ReportSection } from '@/src/api/portfolio-analysis';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type Props = { analysis: PortfolioAnalysis; delay?: number };

function isKoilSection(key: string): boolean {
  return key.startsWith('koil_');
}

function isUnderstanding(key: string): boolean {
  return key.startsWith('koil_understanding');
}

function primaryText(value: string): string {
  const lines = (value || '').split('\n');
  return lines[0]?.trim() || value;
}

function evidenceFromItem(item: { value: string; evidence?: string[] }): string[] {
  if (item.evidence?.length) return item.evidence;
  const lines = (item.value || '').split('\n').slice(1);
  return lines
    .map((l) => l.replace(/^(دليل|Evidence)\s*:\s*/i, '').trim())
    .filter(Boolean);
}

function severityTone(label: string): 'critical' | 'high' | 'medium' | 'neutral' {
  const s = label.toLowerCase();
  if (s.includes('critical') || s.includes('حرج')) return 'critical';
  if (s.includes('high') || s.includes('مرتفع') || s.includes('مهم') || s.includes('عاجل')) return 'high';
  if (s.includes('medium') || s.includes('متوسط')) return 'medium';
  return 'neutral';
}

/** Phase 2 — executive report: Koil as property manager, then supporting data. */
export function UploadExecutiveReport({ analysis, delay = 0 }: Props) {
  const { t, isRTL } = useI18n();
  const { executive_report: report, metrics, month_comparison, late_payments, success_message } = analysis;

  const koilSections = report.sections.filter((s) => isKoilSection(s.key));
  const otherSections = report.sections.filter((s) => !isKoilSection(s.key));

  const renderKoilSection = (sec: ReportSection, i: number) => {
    const understanding = isUnderstanding(sec.key);
    const edge = understanding ? 'emerald' : 'gold';
    return (
      <Animated.View key={sec.key} entering={FadeInDown.duration(500).delay(delay + 60 + i * 45)}>
        <GlassCard padding={18} radiusToken="md" style={styles.sectionCard} edge={edge}>
          <Text style={[styles.koilSectionTitle, isRTL && styles.rtl]}>{sec.title}</Text>
          {sec.items.map((item, idx) => {
            const tone = severityTone(item.label);
            const body = primaryText(item.value);
            const evidence = evidenceFromItem(item);
            return (
              <View
                key={`${sec.key}-${item.label}-${idx}`}
                style={[styles.finding, idx > 0 && styles.findingBorder]}
              >
                {item.label && item.label !== '—' && item.label !== 'كويل' && item.label !== 'Koil' ? (
                  <Text
                    style={[
                      styles.findingBadge,
                      tone === 'critical' && styles.badgeCritical,
                      tone === 'high' && styles.badgeHigh,
                      isRTL && styles.rtl,
                    ]}
                  >
                    {item.label}
                  </Text>
                ) : null}
                <Text style={[styles.findingBody, isRTL && styles.rtl]}>{body}</Text>
                {evidence.map((ev) => (
                  <Text key={ev} style={[styles.evidence, isRTL && styles.rtl]}>
                    {isRTL ? `دليل: ${ev}` : `Evidence: ${ev}`}
                  </Text>
                ))}
              </View>
            );
          })}
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(delay)} style={styles.wrap}>
      <View style={[styles.header, isRTL && styles.rowRtl]}>
        <AppIcon name="cpu" size="md" accent="gold" />
        <Text style={[styles.title, isRTL && styles.rtl]}>
          {isRTL ? 'تقرير كويل — موظف العقار الذكي' : 'Koil report — smart property employee'}
        </Text>
      </View>

      {success_message ? (
        <GlassCard padding={18} radiusToken="lg" edge="gold">
          <Text style={[styles.briefLabel, isRTL && styles.rtl]}>
            {isRTL ? 'ملخص كويل' : 'Koil brief'}
          </Text>
          <Text style={[styles.briefText, isRTL && styles.rtl]}>{success_message}</Text>
        </GlassCard>
      ) : null}

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

      {koilSections.map((sec, i) => renderKoilSection(sec, i))}

      {otherSections.map((sec, i) => {
        if (late_payments && (sec.key === 'late_tenants' || sec.key === 'late')) {
          if (sec.key !== 'late_tenants') return null;
          return (
            <LatePaymentsSection
              key="late_payments"
              data={late_payments}
              title={sec.title}
              delay={delay + 80 + (koilSections.length + i) * 50}
            />
          );
        }
        return (
          <Animated.View
            key={sec.key}
            entering={FadeInDown.duration(500).delay(delay + 80 + (koilSections.length + i) * 50)}
          >
            <GlassCard padding={18} radiusToken="md" style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{sec.title}</Text>
              {sec.items.map((item, idx) => (
                <View
                  key={`${sec.key}-${item.label}-${idx}`}
                  style={[styles.row, isRTL && styles.rowRtl]}
                >
                  <Text style={[styles.rowLabel, isRTL && styles.rtl]}>{item.label}</Text>
                  <Text style={styles.rowValue}>{primaryText(item.value)}</Text>
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        );
      })}

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
  briefLabel: {
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: typography.weight.medium,
  },
  briefText: { color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: typography.weight.medium },
  phase: {
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 14,
    fontWeight: typography.weight.medium,
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
  metricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: typography.weight.semibold,
    marginTop: 4,
  },
  sectionCard: { marginTop: 4 },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: typography.weight.semibold,
    marginBottom: 10,
  },
  koilSectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: 12,
  },
  finding: { paddingVertical: 10, gap: 6 },
  findingBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  findingBadge: {
    alignSelf: 'flex-start',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.4,
  },
  badgeCritical: { color: colors.danger },
  badgeHigh: { color: colors.gold },
  findingBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: typography.weight.medium,
  },
  evidence: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  rowLabel: { color: colors.textDim, fontSize: 13, flex: 1 },
  rowValue: { color: colors.gold, fontSize: 13, fontWeight: typography.weight.medium, flex: 1 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
