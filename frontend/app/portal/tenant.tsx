import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { AliveEmpty } from '@/src/components/AliveEmpty';
import { MaintenanceJourney } from '@/src/components/maintenance/MaintenanceJourney';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useOperational } from '@/src/hooks/useOperational';
import { usePortalAccess } from '@/src/hooks/usePortalAccess';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { formatDate } from '@/src/utils/locale';

export default function TenantPortalScreen() {
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; t?: string }>();
  const { countEnabled } = useNotificationPrefs();
  const { state } = usePropertyOS(countEnabled);
  const { tickets, openTicket } = useOperational();
  const { logLogin } = usePortalAccess();
  const [showJourney, setShowJourney] = useState(false);

  const tenant = state.tenants.find((x) => x.id === params.id && x.portalToken === params.t);
  const unit = tenant ? state.units.find((u) => u.id === tenant.unitId) : undefined;
  const contract = tenant ? state.contracts.find((c) => c.tenantId === tenant.id) : undefined;
  const payments = state.payments?.filter((p) => p.tenantId === tenant?.id) ?? [];
  const myTickets = tenant
    ? tickets.filter((tk) => tk.tenantId === tenant.id || tk.unitId === tenant.unitId)
    : [];

  useEffect(() => {
    if (tenant) void logLogin(tenant.id, 'tenant', tenant.name);
  }, [tenant?.id]);

  if (!tenant) {
    return (
      <ScreenScaffold testID="tenant-portal">
        <StoryScreenHeader question={t('op.tenant.title')} hint={t('op.tenant.invalid')} showBack />
        <AliveEmpty title={t('op.tenant.title')} body={t('op.tenant.invalid')} />
      </ScreenScaffold>
    );
  }

  const paymentOk = payments.length > 0;

  return (
    <ScreenScaffold testID="tenant-portal">
      <StoryScreenHeader
        question={`${t('opsv2.tenant.welcome' as any)}، ${tenant.name}`}
        hint={t('op.tenant.sub')}
        showBack
      />

      <GlassCard padding={18} radiusToken="md" edge="gold">
        <Text style={[styles.section, isRTL && styles.rtl]}>{t('op.tenant.unit')}</Text>
        <Text style={[styles.body, isRTL && styles.rtl]}>
          {unit?.number ?? '—'} · {state.property?.name ?? ''}
        </Text>
        {unit ? (
          <Text style={[styles.dim, isRTL && styles.rtl]}>
            {unit.rentAmount.toLocaleString()} / {t(`pos.rent.${unit.rentPeriod}` as any)}
          </Text>
        ) : null}
      </GlassCard>

      {contract ? (
        <GlassCard padding={18} radiusToken="md" style={styles.gap}>
          <Text style={[styles.section, isRTL && styles.rtl]}>{t('op.tenant.contract')}</Text>
          <Text style={[styles.body, isRTL && styles.rtl]}>#{contract.number}</Text>
          <Text style={[styles.dim, isRTL && styles.rtl]}>
            {formatDate(contract.startDate)} — {formatDate(contract.endDate)}
          </Text>
        </GlassCard>
      ) : null}

      <GlassCard padding={18} radiusToken="md" edge="emerald" style={styles.gap}>
        <Text style={[styles.section, isRTL && styles.rtl]}>{t('opsv2.tenant.payments' as any)}</Text>
        <Text style={[styles.body, isRTL && styles.rtl]}>
          {paymentOk ? t('opsv2.tenant.paid' as any) : t('opsv2.tenant.due' as any)}
        </Text>
      </GlassCard>

      {!showJourney ? (
        <Pressable style={styles.requestBtn} onPress={() => setShowJourney(true)}>
          <Feather name="tool" size={16} color={colors.bg} />
          <Text style={styles.requestBtnText}>{t('op.tenant.requestMaintenance')}</Text>
        </Pressable>
      ) : (
        <View style={styles.gap}>
          <MaintenanceJourney
            unitId={tenant.unitId}
            unitLabel={`${t('op.tenant.unit')} ${unit?.number ?? ''}`}
            tenantId={tenant.id}
            onSubmit={async (data) => {
              await openTicket(tenant.unitId, data.title, tenant.id, data.description, unit?.number, {
                category: data.category,
                priority: data.priority,
                technicianName: data.technicianName,
                media: data.media,
              });
              setShowJourney(false);
            }}
            onCancel={() => setShowJourney(false)}
          />
        </View>
      )}

      {myTickets.length ? (
        <View style={styles.gap}>
          <Text style={[styles.section, isRTL && styles.rtl]}>{t('opsv2.tenant.track' as any)}</Text>
          {myTickets.map((tk) => (
            <GlassCard key={tk.id} padding={14} radiusToken="md" style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.body, isRTL && styles.rtl]}>{tk.title}</Text>
              <Text style={[styles.dim, isRTL && styles.rtl]}>
                {tk.status}
                {tk.workflowStep ? ` · ${t(`opsv2.maint.step.${tk.workflowStep}` as any)}` : ''}
              </Text>
              {(tk.media?.length ?? 0) > 0 ? (
                <Text style={styles.mediaCount}>{tk.media!.length} مرفق</Text>
              ) : null}
            </GlassCard>
          ))}
        </View>
      ) : null}

      <GlassCard padding={16} radiusToken="md" style={styles.gap}>
        <Text style={[styles.section, isRTL && styles.rtl]}>{t('opsv2.tenant.contact' as any)}</Text>
        <Text style={[styles.dim, isRTL && styles.rtl]}>{state.property?.name}</Text>
        <Pressable style={styles.contactBtn} onPress={() => router.push('/brain')}>
          <Text style={styles.contactText}>{t('opsv2.tenant.notifications' as any)} →</Text>
        </Pressable>
      </GlassCard>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: spacing.md },
  section: {
    color: colors.textMuted, fontSize: 11, letterSpacing: 0.8,
    textTransform: 'uppercase', fontWeight: typography.weight.semibold,
  },
  body: { color: colors.text, fontSize: typography.body, marginTop: 6 },
  dim: { color: colors.textDim, fontSize: typography.small, marginTop: 4 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  requestBtn: {
    marginTop: spacing.md, flexDirection: 'row', gap: 8, alignItems: 'center',
    justifyContent: 'center', padding: 14, borderRadius: radius.md, backgroundColor: colors.emerald,
  },
  requestBtnText: { color: colors.bg, fontWeight: typography.weight.semibold },
  mediaCount: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  contactBtn: { marginTop: 10 },
  contactText: { color: colors.gold, fontSize: 13 },
});
