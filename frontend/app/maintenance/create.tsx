import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { MaintenanceJourney } from '@/src/components/maintenance/MaintenanceJourney';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useOperational } from '@/src/hooks/useOperational';
import { useTechnicians } from '@/src/hooks/useTechnicians';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';

export default function MaintenanceCreateScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ unitId?: string }>();
  const { countEnabled } = useNotificationPrefs();
  const { state } = usePropertyOS(countEnabled);
  const { openTicket } = useOperational();
  const { technicians, create } = useTechnicians();
  const [done, setDone] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const unit = params.unitId
    ? state.units.find((u) => u.id === params.unitId)
    : state.units[0];

  if (!unit) {
    return (
      <ScreenScaffold testID="maintenance-create">
        <StoryScreenHeader question={t('opsv2.maint.new' as any)} showBack />
        <Text style={styles.dim}>{t('alive.maintenance.body')}</Text>
      </ScreenScaffold>
    );
  }

  if (done && ticketId) {
    return (
      <ScreenScaffold testID="maintenance-create-done">
        <StoryScreenHeader question={t('opsv2.maint.step.tracking' as any)} showBack />
        <Text style={styles.success}>{t('opsv2.maint.submit' as any)} ✓</Text>
        <Pressable style={styles.btn} onPress={() => router.replace(`/maintenance/${ticketId}` as any)}>
          <Text style={styles.btnText}>{t('maint.detail' as any)}</Text>
        </Pressable>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold testID="maintenance-create">
      <StoryScreenHeader
        question={t('opsv2.maint.new' as any)}
        hint={t('opsv2.maintenance.hint' as any)}
        showBack
      />
      <MaintenanceJourney
        unitId={unit.id}
        unitLabel={`${t('op.tenant.unit')} ${unit.number}`}
        technicianList={technicians}
        onCreateTechnician={create}
        onSubmit={async (data) => {
          const ticket = await openTicket(unit.id, data.title, undefined, data.description, unit.number, {
            category: data.category,
            priority: data.priority,
            technicianId: data.technicianId,
            technicianName: data.technicianName,
            media: data.media,
          });
          setTicketId(ticket.id);
          setDone(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onCancel={() => router.back()}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, marginTop: spacing.lg },
  success: { color: colors.emerald, fontSize: 18, marginTop: spacing.xl, fontWeight: typography.weight.semibold },
  btn: {
    marginTop: spacing.lg, padding: 14, borderRadius: 12,
    backgroundColor: colors.emerald, alignItems: 'center',
  },
  btnText: { color: colors.bg, fontWeight: typography.weight.semibold },
});
