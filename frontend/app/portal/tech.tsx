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

export default function TechPortalScreen() {
  const { t, isRTL } = useI18n();
  const params = useLocalSearchParams<{ t?: string }>();
  const { countEnabled } = useNotificationPrefs();
  const { state } = usePropertyOS(countEnabled);
  const { openTickets, assignTicket, updateTicketStatus } = useOperational();
  const [note, setNote] = useState<Record<string, string>>({});

  const valid = Boolean(params.t && state.technicianPortalToken && params.t === state.technicianPortalToken);

  if (!valid) {
    return (
      <ScreenScaffold testID="tech-portal">
        <StoryScreenHeader question={t('op.tech.title')} hint={t('op.tech.invalid')} showBack />
        <AliveEmpty title={t('op.tech.title')} body={t('op.tech.invalid')} />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold testID="tech-portal">
      <StoryScreenHeader question={t('op.tech.title')} hint={t('op.tech.sub')} showBack />

      {openTickets.length === 0 ? (
        <AliveEmpty title={t('op.tech.title')} body={t('op.tech.noTickets')} />
      ) : (
        openTickets.map((tk) => {
          const unit = state.units.find((u) => u.id === tk.unitId);
          return (
            <GlassCard key={tk.id} padding={16} radiusToken="md" style={styles.card}>
              <Text style={[styles.title, isRTL && styles.rtl]}>{tk.title}</Text>
              <Text style={[styles.dim, isRTL && styles.rtl]}>
                {t('op.tenant.unit')} {unit?.number ?? '—'} · {tk.status}
              </Text>
              {tk.notes.length ? (
                <Text style={[styles.note, isRTL && styles.rtl]} numberOfLines={3}>
                  {tk.notes.join(' · ')}
                </Text>
              ) : null}
              <TextInput
                value={note[tk.id] ?? ''}
                onChangeText={(v) => setNote((n) => ({ ...n, [tk.id]: v }))}
                placeholder={t('op.tech.notePh')}
                placeholderTextColor={colors.textSubtle}
                style={[styles.input, isRTL && styles.rtl]}
              />
              <View style={[styles.row, isRTL && styles.rowRtl]}>
                {tk.status === 'open' ? (
                  <Pressable
                    style={styles.btn}
                    onPress={() => { Haptics.selectionAsync(); assignTicket(tk.id, 'Tech'); }}
                  >
                    <Text style={styles.btnText}>{t('op.tech.accept')}</Text>
                  </Pressable>
                ) : null}
                {tk.status === 'assigned' ? (
                  <Pressable
                    style={styles.btn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      const n = note[tk.id]?.trim();
                      updateTicketStatus(tk.id, 'in_progress', n || undefined, unit?.number);
                    }}
                  >
                    <Text style={styles.btnText}>{t('op.tech.start')}</Text>
                  </Pressable>
                ) : null}
                {tk.status !== 'closed' ? (
                  <Pressable
                    style={[styles.btn, styles.btnClose]}
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      const n = note[tk.id]?.trim();
                      updateTicketStatus(tk.id, 'closed', n || undefined, unit?.number);
                    }}
                  >
                    <Text style={[styles.btnText, { color: colors.gold }]}>{t('op.tech.close')}</Text>
                  </Pressable>
                ) : null}
              </View>
            </GlassCard>
          );
        })
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  title: { color: colors.text, fontSize: typography.body, fontWeight: typography.weight.semibold },
  dim: { color: colors.textMuted, fontSize: typography.small, marginTop: 4 },
  note: { color: colors.textDim, fontSize: 12, marginTop: 8 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  input: {
    marginTop: 10, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border, padding: 10, color: colors.text, fontSize: typography.small,
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  rowRtl: { flexDirection: 'row-reverse' },
  btn: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.emeraldEdge,
    backgroundColor: colors.emeraldSoft,
  },
  btnClose: { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
  btnText: { color: colors.emerald, fontSize: 12, fontWeight: typography.weight.semibold },
});
