import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { AliveEmpty } from '@/src/components/AliveEmpty';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useOperational } from '@/src/hooks/useOperational';
import { usePortalAccess } from '@/src/hooks/usePortalAccess';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import type { MaintenanceTicket, MediaAttachment } from '@/src/types/operational';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

function TicketCard({
  tk, unitNumber, note, onNote, onAction, isRTL, t,
}: {
  tk: MaintenanceTicket;
  unitNumber?: string;
  note: string;
  onNote: (v: string) => void;
  onAction: (action: string, media?: MediaAttachment[]) => void;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  const pickMedia = async (type: 'photo' | 'video') => {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: type === 'video' ? 'video/*' : 'image/*',
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    onAction('media', [{
      uri: a.uri, type, name: a.name, addedAt: new Date().toISOString(),
    }]);
  };

  return (
    <GlassCard padding={16} radiusToken="md" style={styles.card}>
      <Text style={[styles.title, isRTL && styles.rtl]}>{tk.title}</Text>
      <Text style={[styles.dim, isRTL && styles.rtl]}>
        {t('op.tenant.unit')} {unitNumber ?? '—'} · {tk.status}
      </Text>
      {(tk.media?.length ?? 0) > 0 ? (
        <Text style={styles.media}>{tk.media!.length} مرفق</Text>
      ) : null}
      <TextInput
        value={note}
        onChangeText={onNote}
        placeholder={t('opsv2.tech.notes' as any)}
        placeholderTextColor={colors.textSubtle}
        style={[styles.input, isRTL && styles.rtl]}
      />
      <View style={[styles.row, isRTL && styles.rowRtl]}>
        <Pressable style={styles.btn} onPress={() => pickMedia('photo')}>
          <Feather name="camera" size={12} color={colors.emerald} />
          <Text style={styles.btnText}>{t('opsv2.tech.uploadPhoto' as any)}</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => pickMedia('video')}>
          <Feather name="video" size={12} color={colors.emerald} />
          <Text style={styles.btnText}>{t('opsv2.tech.uploadVideo' as any)}</Text>
        </Pressable>
      </View>
      <View style={[styles.row, isRTL && styles.rowRtl]}>
        {tk.status === 'open' ? (
          <Pressable style={styles.btn} onPress={() => onAction('accept')}>
            <Text style={styles.btnText}>{t('op.tech.accept')}</Text>
          </Pressable>
        ) : null}
        {tk.status === 'assigned' ? (
          <Pressable style={styles.btn} onPress={() => onAction('start')}>
            <Text style={styles.btnText}>{t('op.tech.start')}</Text>
          </Pressable>
        ) : null}
        {tk.status !== 'closed' ? (
          <Pressable style={[styles.btn, styles.btnClose]} onPress={() => onAction('close')}>
            <Text style={[styles.btnText, { color: colors.gold }]}>{t('opsv2.tech.closeTask' as any)}</Text>
          </Pressable>
        ) : null}
      </View>
    </GlassCard>
  );
}

export default function TechPortalScreen() {
  const { t, isRTL } = useI18n();
  const params = useLocalSearchParams<{ t?: string }>();
  const { countEnabled } = useNotificationPrefs();
  const { state } = usePropertyOS(countEnabled);
  const { tickets, openTickets, assignTicket, updateTicketStatus } = useOperational();
  const { logLogin } = usePortalAccess();
  const [note, setNote] = useState<Record<string, string>>({});

  const valid = Boolean(params.t && state.technicianPortalToken && params.t === state.technicianPortalToken);

  useEffect(() => {
    if (valid) void logLogin('tech', 'technician', t('op.tech.title'));
  }, [valid]);

  const { newTasks, activeTasks, doneTasks } = useMemo(() => ({
    newTasks: openTickets.filter((tk) => tk.status === 'open'),
    activeTasks: openTickets.filter((tk) => tk.status === 'assigned' || tk.status === 'in_progress'),
    doneTasks: tickets.filter((tk) => tk.status === 'closed').slice(0, 5),
  }), [openTickets, tickets]);

  if (!valid) {
    return (
      <ScreenScaffold testID="tech-portal">
        <StoryScreenHeader question={t('op.tech.title')} hint={t('op.tech.invalid')} showBack />
        <AliveEmpty title={t('op.tech.title')} body={t('op.tech.invalid')} />
      </ScreenScaffold>
    );
  }

  const handleAction = async (tk: MaintenanceTicket, action: string, media?: MediaAttachment[]) => {
    const unit = state.units.find((u) => u.id === tk.unitId);
    const n = note[tk.id]?.trim();
    if (action === 'media' && media) {
      await updateTicketStatus(tk.id, tk.status, n, unit?.number, { media });
      Haptics.selectionAsync();
      return;
    }
    if (action === 'accept') await assignTicket(tk.id, 'Tech');
    if (action === 'start') await updateTicketStatus(tk.id, 'in_progress', n, unit?.number, { workflowStep: 'tracking' });
    if (action === 'close') {
      await updateTicketStatus(tk.id, 'closed', n, unit?.number, { workflowStep: 'rating' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderSection = (label: string, list: MaintenanceTicket[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{label}</Text>
      {list.length === 0 ? (
        <Text style={styles.empty}>—</Text>
      ) : list.map((tk) => {
        const unit = state.units.find((u) => u.id === tk.unitId);
        return (
          <TicketCard
            key={tk.id}
            tk={tk}
            unitNumber={unit?.number}
            note={note[tk.id] ?? ''}
            onNote={(v) => setNote((n) => ({ ...n, [tk.id]: v }))}
            onAction={(a, m) => handleAction(tk, a, m)}
            isRTL={isRTL}
            t={(k) => t(k as any)}
          />
        );
      })}
    </View>
  );

  return (
    <ScreenScaffold testID="tech-portal">
      <StoryScreenHeader question={t('op.tech.title')} hint={t('op.tech.sub')} showBack />

      {tickets.length === 0 ? (
        <AliveEmpty title={t('op.tech.title')} body={t('op.tech.noTickets')} />
      ) : (
        <>
          {renderSection(t('opsv2.tech.new' as any), newTasks)}
          {renderSection(t('opsv2.tech.active' as any), activeTasks)}
          {renderSection(t('opsv2.tech.done' as any), doneTasks)}
        </>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    color: colors.textMuted, fontSize: 10, letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: spacing.sm,
  },
  empty: { color: colors.textSubtle, fontSize: 12 },
  card: { marginBottom: spacing.md },
  title: { color: colors.text, fontSize: typography.body, fontWeight: typography.weight.semibold },
  dim: { color: colors.textMuted, fontSize: typography.small, marginTop: 4 },
  media: { color: colors.textDim, fontSize: 10, marginTop: 4 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  input: {
    marginTop: 10, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border, padding: 10, color: colors.text, fontSize: typography.small,
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  rowRtl: { flexDirection: 'row-reverse' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.emeraldEdge,
    backgroundColor: colors.emeraldSoft,
  },
  btnClose: { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
  btnText: { color: colors.emerald, fontSize: 11, fontWeight: typography.weight.semibold },
});
