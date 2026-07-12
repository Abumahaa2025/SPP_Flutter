import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/src/components/GlassCard';
import { LatePaymentsSection } from '@/src/components/LatePaymentsSection';
import { AppIcon } from '@/src/components/ui/AppIcon';
import type {
  ExecutiveBrief,
  PortfolioAnalysis,
  ReportSection,
} from '@/src/api/portfolio-analysis';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = { analysis: PortfolioAnalysis; delay?: number };

type DetailGroup = {
  id: string;
  title: string;
  summary: string;
  sections: ReportSection[];
  late?: boolean;
};

function primaryText(value: string): string {
  const lines = (value || '').split('\n');
  return lines[0]?.trim() || value;
}

function evidenceFromItem(item: { value: string; evidence?: string[] }): string[] {
  if (item.evidence?.length) return item.evidence;
  const lines = (item.value || '').split('\n').slice(1);
  return lines
    .map((l) => l.replace(/^(دليل|Evidence|المصدر|Source)\s*:\s*/i, '').trim())
    .filter(Boolean)
    .filter((l) => !/^(unit=|consecutive=|tenant=)/i.test(l));
}

function humanEvidenceLine(ev: string, ar: boolean): string {
  const cleaned = ev
    .replace(/\bunit=/gi, ar ? 'الوحدة ' : 'unit ')
    .replace(/\bconsecutive=\d+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (/^(المصدر|Source)/i.test(cleaned)) return cleaned;
  return ar ? `المصدر: ${cleaned}` : `Source: ${cleaned}`;
}

function CollapsibleSection({
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { isRTL } = useI18n();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <GlassCard padding={16} radiusToken="md" style={styles.sectionCard}>
      <Pressable onPress={toggle} accessibilityRole="button">
        <View style={[styles.collapseHeader, isRTL && styles.rowRtl]}>
          <View style={styles.collapseText}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{title}</Text>
            <Text style={[styles.sectionSummary, isRTL && styles.rtl]} numberOfLines={open ? 4 : 2}>
              {summary}
            </Text>
          </View>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </View>
      </Pressable>
      {open ? <View style={styles.collapseBody}>{children}</View> : null}
    </GlassCard>
  );
}

function SectionItems({ sec, isRTL, ar }: { sec: ReportSection; isRTL: boolean; ar: boolean }) {
  return (
    <View style={styles.itemsBlock}>
      {sec.title ? <Text style={[styles.innerTitle, isRTL && styles.rtl]}>{sec.title}</Text> : null}
      {sec.items.map((item, idx) => {
        const body = primaryText(item.value);
        const evidence = evidenceFromItem(item);
        return (
          <View key={`${sec.key}-${idx}`} style={[styles.finding, idx > 0 && styles.findingBorder]}>
            {item.label && item.label !== '—' && item.label !== 'كويل' && item.label !== 'Koil' ? (
              <Text style={[styles.findingBadge, isRTL && styles.rtl]}>{item.label}</Text>
            ) : null}
            <Text style={[styles.findingBody, isRTL && styles.rtl]}>{body}</Text>
            {evidence.map((ev) => (
              <Text key={ev} style={[styles.evidence, isRTL && styles.rtl]}>
                {humanEvidenceLine(ev, ar)}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function buildBriefFallback(analysis: PortfolioAnalysis, ar: boolean): ExecutiveBrief {
  const m = analysis.metrics;
  return {
    property_status: analysis.success_message || (ar ? 'تقرير العقار جاهز للمراجعة.' : 'Property report ready.'),
    top_risk: ar ? 'راجع التفاصيل المطوية أدناه' : 'Review folded details below',
    top_action: ar ? 'افتح الأقسام عند الحاجة فقط' : 'Open sections only if needed',
    key_numbers: [
      { label: ar ? 'الوحدات' : 'Units', value: String(m.units) },
      { label: ar ? 'الإشغال' : 'Occupancy', value: `${m.occupancy_pct}%` },
      {
        label: ar ? 'متأخرات' : 'Arrears',
        value: `${(m.late_value || 0).toLocaleString()} ${ar ? 'ر.س' : 'SAR'}`,
      },
    ],
    confidence: 75,
    confidence_level: ar ? 'مرجح' : 'Likely',
    needs_review: [ar ? 'حدّث التطبيق لعرض الملخص التنفيذي الكامل' : 'Update app for full executive brief'],
  };
}

function groupSections(
  sections: ReportSection[],
  analysis: PortfolioAnalysis,
  ar: boolean,
): DetailGroup[] {
  const byKey = Object.fromEntries(sections.map((s) => [s.key, s]));
  const take = (...keys: string[]) => keys.map((k) => byKey[k]).filter(Boolean) as ReportSection[];

  const monthsSecs = take('months', 'revenue', 'portfolio');
  const unitsSecs = take('units_summary');
  const lateSecs = take('late_tenants', 'late');
  const maintSecs = take('expenses');
  const contractSecs = take('contracts');
  const moveSecs = take('departed', 'moved_in');
  const qualitySecs = take(
    'quality',
    'files',
    'koil_understanding_summary',
    'koil_understanding_files',
    'koil_understanding_relationships',
    'koil_understanding_ambiguities',
  );
  const techSecs = take('koil_why', 'koil_what', 'koil_risks', 'koil_recommendations', 'koil_brief');

  const m = analysis.metrics;
  const late = analysis.late_payments?.summary;

  const summarize = (secs: ReportSection[], fallback: string) => {
    if (!secs.length) return fallback;
    const first = secs[0]?.items?.[0];
    if (first) return `${first.label}: ${primaryText(first.value)}`.replace(/^—:\s*/, '');
    return fallback;
  };

  const groups: DetailGroup[] = [
    {
      id: 'months',
      title: ar ? 'التحصيل والأشهر' : 'Collection & months',
      summary:
        monthsSecs.length > 0
            ? ar
            ? `تحصيل ${m.collection_rate_pct ?? '—'}% · إيراد ${(m.collected || 0).toLocaleString()} ر.س`
            : `Collection · revenue ${(m.collected || 0).toLocaleString()}`
          : ar
            ? 'لا بيانات أشهر'
            : 'No month data',
      sections: monthsSecs,
    },
    {
      id: 'units',
      title: ar ? 'الوحدات' : 'Units',
      summary: ar
        ? `${m.units} وحدة · إشغال ${m.occupancy_pct}%`
        : `${m.units} units · ${m.occupancy_pct}% occupancy`,
      sections: unitsSecs,
    },
    {
      id: 'late',
      title: ar ? 'المتأخرات المؤكدة' : 'Confirmed arrears',
      summary: late
        ? ar
          ? `${late.late_tenant_count} مستأجر · ${(late.total_unpaid || 0).toLocaleString()} ر.س`
          : `${late.late_tenant_count} tenants · ${(late.total_unpaid || 0).toLocaleString()} SAR`
        : ar
          ? `${m.late_tenants || 0} مستأجر · ${(m.late_value || 0).toLocaleString()} ر.س`
          : `${m.late_tenants || 0} tenants`,
      sections: lateSecs,
      late: true,
    },
    {
      id: 'maint',
      title: ar ? 'الصيانة والمصروفات' : 'Maintenance & expenses',
      summary: ar
        ? `مصروفات ${(m.total_expenses || 0).toLocaleString()} ر.س`
        : `Expenses ${(m.total_expenses || 0).toLocaleString()}`,
      sections: maintSecs,
    },
    {
      id: 'contracts',
      title: ar ? 'العقود' : 'Contracts',
      summary: ar
        ? `منتهية ${m.contracts_expired || 0} · قريبة ${m.contracts_expiring_soon || 0}`
        : `Expired ${m.contracts_expired || 0} · soon ${m.contracts_expiring_soon || 0}`,
      sections: contractSecs,
    },
    {
      id: 'moves',
      title: ar ? 'حركة المستأجرين' : 'Tenant movement',
      summary: summarize(moveSecs, ar ? 'لا حركة مؤكدة' : 'No confirmed movement'),
      sections: moveSecs,
    },
    {
      id: 'quality',
      title: ar ? 'جودة البيانات' : 'Data quality',
      summary: summarize(qualitySecs, ar ? 'جودة البيانات ضمن التقرير' : 'Data quality in report'),
      sections: qualitySecs,
    },
    {
      id: 'tech',
      title: ar ? 'الأدلة التقنية' : 'Technical evidence',
      summary: ar ? 'تفاصيل الاستنتاج للمراجعة عند الحاجة' : 'Inference detail when you need it',
      sections: techSecs,
    },
  ];

  // Month comparison as synthetic section under months
  if (analysis.month_comparison?.length) {
    const cmpSec: ReportSection = {
      key: 'month_comparison_inline',
      title: ar ? 'مقارنة الأشهر' : 'Month compare',
      items: analysis.month_comparison.slice(0, 8).map((row) => ({
        label: row.month,
        value: ar
          ? `إيراد ${row.revenue.toLocaleString()} · مصروف ${row.expenses.toLocaleString()}`
          : `rev ${row.revenue.toLocaleString()} · exp ${row.expenses.toLocaleString()}`,
      })),
    };
    const g = groups.find((x) => x.id === 'months');
    if (g) g.sections = [...g.sections, cmpSec];
  }

  return groups.filter((g) => g.sections.length > 0 || (g.late && analysis.late_payments));
}

/** Executive Brief first — property manager language, details folded. */
export function UploadExecutiveReport({ analysis, delay = 0 }: Props) {
  const { isRTL } = useI18n();
  const ar = isRTL;
  const { executive_report: report, late_payments } = analysis;

  const brief = useMemo(
    () => analysis.executive_brief || buildBriefFallback(analysis, ar),
    [analysis, ar],
  );

  const groups = useMemo(
    () => groupSections(report.sections || [], analysis, ar),
    [report.sections, analysis, ar],
  );

  const confTone =
    brief.confidence_level.includes('مؤكد') || brief.confidence_level.toLowerCase().includes('confirm')
      ? 'ok'
      : brief.confidence_level.includes('مراجعتك') || brief.confidence_level.toLowerCase().includes('review')
        ? 'review'
        : 'likely';

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(delay)} style={styles.wrap}>
      <View style={[styles.header, isRTL && styles.rowRtl]}>
        <AppIcon name="cpu" size="md" accent="gold" />
        <Text style={[styles.title, isRTL && styles.rtl]}>
          {ar ? 'تقرير كويل — قرار المالك' : 'Koil report — owner decision'}
        </Text>
      </View>

      <GlassCard padding={20} radiusToken="lg" edge="gold">
        <Text style={[styles.briefEyebrow, isRTL && styles.rtl]}>
          {ar ? 'الملخص التنفيذي' : 'Executive brief'}
        </Text>
        {brief.period ? (
          <Text style={[styles.period, isRTL && styles.rtl]}>{brief.period}</Text>
        ) : null}

        <Text style={[styles.statusLabel, isRTL && styles.rtl]}>{ar ? 'حالة العقار' : 'Property status'}</Text>
        <Text style={[styles.statusText, isRTL && styles.rtl]}>{brief.property_status}</Text>

        <View style={styles.briefBlock}>
          <Text style={[styles.statusLabel, isRTL && styles.rtl]}>{ar ? 'أهم خطر' : 'Top risk'}</Text>
          <Text style={[styles.riskText, isRTL && styles.rtl]}>{brief.top_risk}</Text>
        </View>

        <View style={styles.briefBlock}>
          <Text style={[styles.statusLabel, isRTL && styles.rtl]}>
            {ar ? 'أهم إجراء اليوم' : 'Action for today'}
          </Text>
          <Text style={[styles.actionText, isRTL && styles.rtl]}>{brief.top_action}</Text>
        </View>

        <View style={styles.numRow}>
          {brief.key_numbers.map((n) => (
            <View key={n.label} style={styles.numCell}>
              <Text style={[styles.numLabel, isRTL && styles.rtl]}>{n.label}</Text>
              <Text style={styles.numValue}>{n.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.confRow, isRTL && styles.rowRtl]}>
          <Text
            style={[
              styles.confBadge,
              confTone === 'ok' && styles.confOk,
              confTone === 'review' && styles.confReview,
              confTone === 'likely' && styles.confLikely,
              isRTL && styles.rtl,
            ]}
          >
            {brief.confidence_level}
          </Text>
          <Text style={[styles.confPct, isRTL && styles.rtl]}>{Math.round(brief.confidence)}%</Text>
        </View>

        <View style={styles.reviewBox}>
          <Text style={[styles.statusLabel, isRTL && styles.rtl]}>
            {ar ? 'ما يحتاج مراجعتك' : 'Needs your review'}
          </Text>
          {brief.needs_review.map((line) => (
            <Text key={line} style={[styles.reviewLine, isRTL && styles.rtl]}>
              • {line}
            </Text>
          ))}
        </View>
      </GlassCard>

      <Text style={[styles.detailsHint, isRTL && styles.rtl]}>
        {ar ? 'التفاصيل — اضغط للفتح عند الحاجة' : 'Details — tap to expand if needed'}
      </Text>

      {groups.map((g, i) => (
        <Animated.View key={g.id} entering={FadeInDown.duration(450).delay(delay + 40 + i * 35)}>
          {g.late && late_payments ? (
            <CollapsibleSection title={g.title} summary={g.summary}>
              <LatePaymentsSection data={late_payments} title={g.title} delay={0} embedded />
            </CollapsibleSection>
          ) : (
            <CollapsibleSection title={g.title} summary={g.summary}>
              {g.sections.map((sec) => (
                <SectionItems key={sec.key} sec={sec} isRTL={isRTL} ar={ar} />
              ))}
            </CollapsibleSection>
          )}
        </Animated.View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl, gap: spacing.md, paddingBottom: 96 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  rowRtl: { flexDirection: 'row-reverse' },
  title: { color: colors.text, fontSize: 18, fontWeight: typography.weight.semibold, flex: 1 },
  briefEyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: typography.weight.medium,
  },
  period: { color: colors.textMuted, fontSize: 12, marginBottom: 14 },
  statusLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
    fontWeight: typography.weight.medium,
  },
  statusText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: typography.weight.semibold,
    marginBottom: 14,
  },
  briefBlock: { marginBottom: 12 },
  riskText: { color: colors.text, fontSize: 14, lineHeight: 22 },
  actionText: { color: colors.gold, fontSize: 15, lineHeight: 24, fontWeight: typography.weight.semibold },
  numRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 14 },
  numCell: {
    minWidth: '30%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  numLabel: { color: colors.textMuted, fontSize: 10 },
  numValue: { color: colors.text, fontSize: 16, fontWeight: typography.weight.semibold, marginTop: 4 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  confBadge: {
    fontSize: 12,
    fontWeight: typography.weight.semibold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  confOk: { color: '#7dcea0', backgroundColor: 'rgba(125,206,160,0.12)' },
  confLikely: { color: colors.gold, backgroundColor: 'rgba(212,175,55,0.12)' },
  confReview: { color: colors.danger, backgroundColor: 'rgba(220,80,80,0.12)' },
  confPct: { color: colors.textDim, fontSize: 12 },
  reviewBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 4,
  },
  reviewLine: { color: colors.textDim, fontSize: 13, lineHeight: 20 },
  detailsHint: { color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 2 },
  sectionCard: { marginTop: 2 },
  collapseHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  collapseText: { flex: 1, gap: 4 },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  sectionSummary: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  collapseBody: { marginTop: 12, gap: 10 },
  itemsBlock: { gap: 2 },
  innerTitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: typography.weight.medium,
  },
  finding: { paddingVertical: 8, gap: 4 },
  findingBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 2,
  },
  findingBadge: { color: colors.textMuted, fontSize: 11, fontWeight: typography.weight.medium },
  findingBody: { color: colors.text, fontSize: 14, lineHeight: 22, fontWeight: typography.weight.medium },
  evidence: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
