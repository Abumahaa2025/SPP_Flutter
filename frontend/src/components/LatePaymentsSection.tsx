import React, { useState } from 'react';
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
import type { LatePaymentsReport } from '@/src/api/portfolio-analysis';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  data: LatePaymentsReport;
  title: string;
  delay?: number;
  /** When true, skip outer card/title (parent already provides them). */
  embedded?: boolean;
};

function fmt(n: number, ar: boolean) {
  return `${n.toLocaleString('ar-SA')} ${ar ? 'ر.س' : 'SAR'}`;
}

function FieldRow({
  label,
  value,
  isRTL,
  accent,
}: {
  label: string;
  value: string;
  isRTL: boolean;
  accent?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, isRTL && styles.rowRtl]}>
      <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{label}</Text>
      <Text style={[accent ? styles.fieldValueAccent : styles.fieldValue, isRTL && styles.rtl]}>{value}</Text>
    </View>
  );
}

function TenantCard({
  tenant,
  isRTL,
  ar,
}: {
  tenant: LatePaymentsReport['months'][0]['tenants'][0];
  isRTL: boolean;
  ar: boolean;
}) {
  return (
    <View style={styles.tenantCard}>
      <Text style={[styles.tenantName, isRTL && styles.rtl]}>{tenant.tenant}</Text>
      <FieldRow label={ar ? 'الوحدة' : 'Unit'} value={tenant.unit} isRTL={isRTL} />
      <FieldRow
        label={ar ? 'رقم العقد' : 'Contract'}
        value={tenant.contract || '—'}
        isRTL={isRTL}
      />
      <FieldRow
        label={ar ? 'الجوال' : 'Phone'}
        value={tenant.phone || (ar ? 'بدون جوال' : 'No phone')}
        isRTL={isRTL}
      />
      <FieldRow label={ar ? 'المستحق' : 'Due'} value={fmt(tenant.due, ar)} isRTL={isRTL} />
      <FieldRow label={ar ? 'المدفوع' : 'Paid'} value={fmt(tenant.paid, ar)} isRTL={isRTL} />
      <FieldRow
        label={ar ? 'المتبقي' : 'Remaining'}
        value={fmt(tenant.remaining, ar)}
        isRTL={isRTL}
        accent
      />
      <FieldRow label={ar ? 'الحالة' : 'Status'} value={tenant.status_label} isRTL={isRTL} />
    </View>
  );
}

function CollapsibleBlock({
  header,
  sub,
  meta,
  defaultOpen = false,
  children,
  testID,
}: {
  header: string;
  sub?: string;
  meta?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  testID?: string;
}) {
  const { isRTL } = useI18n();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={styles.blockWrap} testID={testID}>
      <Pressable onPress={toggle}>
        <View style={[styles.blockHeader, isRTL && styles.rowRtl]}>
          <View style={styles.blockHeaderText}>
            <Text style={[styles.blockTitle, isRTL && styles.rtl]}>{header}</Text>
            {sub ? <Text style={[styles.blockSub, isRTL && styles.rtl]}>{sub}</Text> : null}
            {meta ? <Text style={[styles.blockMeta, isRTL && styles.rtl]}>{meta}</Text> : null}
          </View>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </View>
      </Pressable>
      {open ? <View style={styles.blockBody}>{children}</View> : null}
    </View>
  );
}

export function LatePaymentsSection({ data, title, delay = 0, embedded = false }: Props) {
  const { isRTL } = useI18n();
  const ar = isRTL;
  const { summary, months, tenant_totals } = data;

  const topLine = summary.top_tenant
    ? ar
      ? `${summary.top_tenant.tenant} — ${summary.top_tenant.unit} (${fmt(summary.top_tenant.total_unpaid, true)})`
      : `${summary.top_tenant.tenant} — ${summary.top_tenant.unit} (${fmt(summary.top_tenant.total_unpaid, false)})`
    : '—';

  const oldestLine = summary.oldest_tenant
    ? ar
      ? `${summary.oldest_tenant.tenant} — ${summary.oldest_tenant.unit} (${summary.oldest_tenant.month_label})`
      : `${summary.oldest_tenant.tenant} — ${summary.oldest_tenant.unit} (${summary.oldest_tenant.month_label})`
    : '—';

  const inner = (
    <>
      {!embedded ? <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{title}</Text> : null}

        <View style={styles.summaryBox}>
          <FieldRow
            label={ar ? 'إجمالي المتأخرات' : 'Total overdue'}
            value={fmt(summary.total_unpaid, ar)}
            isRTL={isRTL}
            accent
          />
          <FieldRow
            label={ar ? 'عدد المستأجرين المتأخرين' : 'Late tenants'}
            value={String(summary.late_tenant_count)}
            isRTL={isRTL}
          />
          <FieldRow label={ar ? 'أعلى متأخر' : 'Highest overdue'} value={topLine} isRTL={isRTL} />
          <FieldRow label={ar ? 'أقدم متأخر' : 'Oldest overdue'} value={oldestLine} isRTL={isRTL} />
        </View>

        {months.length === 0 && tenant_totals.length === 0 ? (
          <Text style={[styles.empty, isRTL && styles.rtl]}>
            {ar ? 'لا متأخرات في الأشهر المحلّلة' : 'No late rows in parsed months'}
          </Text>
        ) : null}

        {months.map((m) => (
          <CollapsibleBlock
            key={m.key}
            testID={`late-month-${m.key}`}
            header={m.label}
            sub={
              ar
                ? `${m.tenant_count} مستأجر${m.tenant_count === 1 ? '' : 'ين'} متأخر${m.tenant_count === 1 ? '' : 'ين'}`
                : `${m.tenant_count} late tenant${m.tenant_count === 1 ? '' : 's'}`
            }
            meta={ar ? `إجمالي الشهر: ${fmt(m.month_total, true)}` : `Month total: ${fmt(m.month_total, false)}`}
          >
            {m.tenants.map((t, i) => (
              <TenantCard key={`${m.key}-${t.unit}-${t.tenant}-${i}`} tenant={t} isRTL={isRTL} ar={ar} />
            ))}
          </CollapsibleBlock>
        ))}

        {tenant_totals.length > 0 ? (
          <View style={styles.totalsSection}>
            <Text style={[styles.totalsHeading, isRTL && styles.rtl]}>
              {ar ? 'إجمالي كل مستأجر عبر الأشهر' : 'Per-tenant totals across months'}
            </Text>
            {tenant_totals.map((tt, idx) => (
              <CollapsibleBlock
                key={`${tt.unit}-${tt.tenant}-${idx}`}
                testID={`late-tenant-total-${idx}`}
                header={`${tt.tenant} — ${tt.unit}`}
                sub={
                  ar
                    ? `عدد الأشهر المتأخرة: ${tt.late_month_count}`
                    : `Late months: ${tt.late_month_count}`
                }
                meta={ar ? `إجمالي: ${fmt(tt.total_unpaid, true)}` : `Total: ${fmt(tt.total_unpaid, false)}`}
              >
                <View style={styles.tenantCard}>
                  <FieldRow
                    label={ar ? 'رقم العقد' : 'Contract'}
                    value={tt.contract || '—'}
                    isRTL={isRTL}
                  />
                  <FieldRow
                    label={ar ? 'الجوال' : 'Phone'}
                    value={tt.phone || (ar ? 'بدون جوال' : 'No phone')}
                    isRTL={isRTL}
                  />
                  {tt.months.map((mo, mi) => (
                    <FieldRow
                      key={`${mo.label}-${mi}`}
                      label={mo.label}
                      value={fmt(mo.amount, ar)}
                      isRTL={isRTL}
                    />
                  ))}
                  <FieldRow
                    label={ar ? 'إجمالي المتأخر' : 'Total overdue'}
                    value={fmt(tt.total_unpaid, ar)}
                    isRTL={isRTL}
                    accent
                  />
                </View>
              </CollapsibleBlock>
            ))}
          </View>
        ) : null}
    </>
  );

  if (embedded) {
    return <View>{inner}</View>;
  }

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay)}>
      <GlassCard padding={18} radiusToken="md" edge="gold" style={styles.sectionCard}>
        {inner}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionCard: { marginTop: 4 },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: typography.weight.semibold,
    marginBottom: 12,
  },
  summaryBox: {
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 14,
    gap: 2,
  },
  empty: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  blockWrap: {
    marginBottom: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  blockHeaderText: { flex: 1, gap: 3 },
  blockTitle: { color: colors.text, fontSize: 14, fontWeight: typography.weight.semibold },
  blockSub: { color: colors.textDim, fontSize: 12 },
  blockMeta: { color: colors.gold, fontSize: 12, fontWeight: typography.weight.medium },
  blockBody: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  tenantCard: {
    padding: 12,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    gap: 4,
  },
  tenantName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: typography.weight.semibold,
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 3,
  },
  rowRtl: { flexDirection: 'row-reverse' },
  fieldLabel: { color: colors.textMuted, fontSize: 12, flex: 1 },
  fieldValue: { color: colors.text, fontSize: 12, fontWeight: typography.weight.medium, maxWidth: '55%' },
  fieldValueAccent: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: typography.weight.semibold,
    maxWidth: '55%',
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  totalsSection: { marginTop: 8, gap: 4 },
  totalsHeading: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: typography.weight.semibold,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
});
