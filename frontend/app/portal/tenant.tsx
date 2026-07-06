import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { AliveEmpty } from '@/src/components/AliveEmpty';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useOperational } from '@/src/hooks/useOperational';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { formatDate } from '@/src/utils/locale';

export default function TenantPortalScreen() {
  const { t, isRTL } = useI18n();
  const params = useLocalSearchParams<{ id?: string; t?: string }>();
  const { countEnabled } = useNotificationPrefs();
  const { state } = usePropertyOS(countEnabled);
  const { tickets, openTicket } = useOperational();
  const [requestText, setRequestText] = useState('');

  const tenant = state.tenants.find((x) => x.id === params.id && x.portalToken === params.t);
  const unit = tenant ? state.units.find((u) => u.id === tenant.unitId) : undefined;
  const contract = tenant
    ? state.contracts.find((c) => c.tenantId === tenant.id)
    : undefined;
  const myTickets = tenant
    ? tickets.filter((tk) => tk.tenantId === tenant.id || tk.unitId === tenant.unitId)
    : [];

  const submitRequest = async () => {
    if (!tenant || !requestText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await openTicket(tenant.unitId, requestText.trim(), tenant.id, undefined, unit?.number);
    setRequestText('');
  };

  if (!tenant) {
    return (
      <ScreenScaffold testID="tenant-portal">
        <StoryScreenHeader question={t('op.tenant.title')} hint={t('op.tenant.invalid')} showBack />
        <AliveEmpty title={t('op.tenant.title')} body={t('op.tenant.invalid')} />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold testID="tenant-portal">
      <StoryScreenHeader question={t('op.tenant.title')} hint={t('op.tenant.sub')} showBack />

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
        <Text style={[styles.section, isRTL && styles.rtl]}>{t('op.tenant.requestMaintenance')}</Text>
        <TextInput
          value={requestText}
          onChangeText={setRequestText}
          placeholder={t('op.tenant.requestPh')}
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, isRTL && styles.rtl]}
          multiline
        />
        <Pressable style={styles.submit} onPress={submitRequest} testID="tenant-submit-ticket">
          <Text style={styles.submitText}>{t('op.tenant.submit')}</Text>
        </Pressable>
      </GlassCard>

      {myTickets.length ? (
        <View style={styles.gap}>
          <Text style={[styles.section, isRTL && styles.rtl]}>{t('op.tenant.myTickets')}</Text>
          {myTickets.map((tk) => (
            <GlassCard key={tk.id} padding={14} radiusToken="md" style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.body, isRTL && styles.rtl]}>{tk.title}</Text>
              <Text style={[styles.dim, isRTL && styles.rtl]}>{tk.status}</Text>
            </GlassCard>
          ))}
        </View>
      ) : null}
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
  input: {
    marginTop: 10, minHeight: 72, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    padding: 12, color: colors.text, fontSize: typography.body,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  submit: {
    marginTop: 12, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.emerald, alignItems: 'center',
  },
  submitText: { color: colors.bg, fontWeight: typography.weight.semibold },
});
