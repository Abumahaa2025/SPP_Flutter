import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { MaintenanceTimeline } from '@/src/components/maintenance/MaintenanceTimeline';
import { useOperational } from '@/src/hooks/useOperational';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';

export default function MaintenanceDetailScreen() {
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { countEnabled } = useNotificationPrefs();
  const { state } = usePropertyOS(countEnabled);
  const { tickets } = useOperational();

  const ticket = tickets.find((tk) => tk.id === id);
  const unit = ticket ? state.units.find((u) => u.id === ticket.unitId) : undefined;

  if (!ticket) {
    return (
      <ScreenScaffold>
        <StoryScreenHeader question={t('maint.detail' as any)} showBack />
        <Text style={styles.dim}>{t('alive.maintenance.body')}</Text>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold testID="maintenance-detail">
      <StoryScreenHeader question={ticket.title} hint={unit?.number} showBack />

      <MaintenanceTimeline ticket={ticket} />

      {(ticket.beforeMedia?.length || ticket.afterMedia?.length) ? (
        <GlassCard padding={16} radiusToken="md" style={styles.gap}>
          <Text style={[styles.section, isRTL && styles.rtl]}>{t('maint.compare' as any)}</Text>
          <Text style={styles.dim}>
            {t('maint.before' as any)}: {ticket.beforeMedia?.length ?? 0} · {t('maint.after' as any)}: {ticket.afterMedia?.length ?? 0}
          </Text>
        </GlassCard>
      ) : null}

      {ticket.rating ? (
        <GlassCard padding={16} radiusToken="md" style={styles.gap}>
          <Text style={styles.dim}>{'⭐'.repeat(ticket.rating)}</Text>
          {ticket.tenantComment ? <Text style={styles.body}>{ticket.tenantComment}</Text> : null}
        </GlassCard>
      ) : null}

      {unit ? (
        <Pressable
          style={styles.archiveBtn}
          onPress={() => router.push(`/maintenance/archive?unitId=${unit.id}` as any)}
        >
          <Text style={styles.archiveText}>{t('maint.archive' as any)} →</Text>
        </Pressable>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, marginTop: spacing.lg },
  gap: { marginTop: spacing.md },
  section: { color: colors.textMuted, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  body: { color: colors.text, marginTop: 6 },
  archiveBtn: { marginTop: spacing.lg, padding: 12 },
  archiveText: { color: colors.gold, fontWeight: typography.weight.semibold },
});
