import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { AliveEmpty } from '@/src/components/AliveEmpty';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { formatDate } from '@/src/utils/locale';

export default function PaymentsScreen() {
  const { t, isRTL } = useI18n();
  const { countEnabled } = useNotificationPrefs();
  const { state } = usePropertyOS(countEnabled);
  const payments = [...(state.payments ?? [])].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
  );

  return (
    <ScreenScaffold testID="payments-screen">
      <StoryScreenHeader question={t('op.payments.title')} hint={t('op.payments.sub')} showBack />

      {payments.length === 0 ? (
        <AliveEmpty title={t('op.payments.title')} body={t('op.payments.empty')} />
      ) : (
        payments.map((p, i) => {
          const tenant = state.tenants.find((x) => x.id === p.tenantId);
          const unit = state.units.find((u) => u.id === p.unitId);
          return (
            <Animated.View key={p.id} entering={FadeInDown.duration(450).delay(i * 40)}>
              <GlassCard padding={16} radiusToken="md" style={styles.card}>
                <Text style={[styles.amount, isRTL && styles.rtl]}>
                  {p.amount.toLocaleString()} · {tenant?.name ?? '—'}
                </Text>
                <Text style={[styles.dim, isRTL && styles.rtl]}>
                  {t('op.tenant.unit')} {unit?.number ?? '—'} · {formatDate(p.paidAt)}
                </Text>
              </GlassCard>
            </Animated.View>
          );
        })
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  amount: { color: colors.text, fontSize: typography.body, fontWeight: typography.weight.semibold },
  dim: { color: colors.textMuted, fontSize: typography.small, marginTop: 4 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
