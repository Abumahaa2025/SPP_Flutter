import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { JourneyGuide } from '@/src/components/JourneyGuide';
import { useOperational } from '@/src/hooks/useOperational';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type HubLink = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  labelKey: string;
  hintKey: string;
  route: string;
  tone?: 'gold' | 'emerald';
};

/** Daily operations only — Spec §3 / §5.5. Reports & connections live under More. */
const LINKS: HubLink[] = [
  { key: 'properties', icon: 'home', labelKey: 'op.owner.properties', hintKey: 'op.owner.properties.hint', route: '/portfolio', tone: 'gold' },
  { key: 'units', icon: 'grid', labelKey: 'op.owner.units', hintKey: 'op.owner.units.hint', route: '/portfolio' },
  { key: 'contracts', icon: 'file-text', labelKey: 'op.owner.contracts', hintKey: 'op.owner.contracts.hint', route: '/contracts', tone: 'gold' },
  { key: 'tenants', icon: 'users', labelKey: 'op.owner.tenants', hintKey: 'op.owner.tenants.hint', route: '/tenants' },
  { key: 'payments', icon: 'dollar-sign', labelKey: 'op.owner.payments', hintKey: 'op.owner.payments.hint', route: '/operational/payments', tone: 'emerald' },
  { key: 'electricity', icon: 'zap', labelKey: 'op.owner.electricity', hintKey: 'op.owner.electricity.hint', route: '/sensors?utility=electricity', tone: 'gold' },
  { key: 'water', icon: 'droplet', labelKey: 'op.owner.water', hintKey: 'op.owner.water.hint', route: '/sensors?utility=water', tone: 'emerald' },
  { key: 'maintenance', icon: 'tool', labelKey: 'op.owner.maintenance', hintKey: 'op.owner.maintenance.hint', route: '/maintenance', tone: 'emerald' },
  { key: 'wallet', icon: 'credit-card', labelKey: 'op.owner.wallet', hintKey: 'op.owner.wallet.hint', route: '/wallet', tone: 'gold' },
  { key: 'portals', icon: 'link', labelKey: 'opsv2.portals.title', hintKey: 'opsv2.portals.sub', route: '/operational/portals', tone: 'emerald' },
];

function fmtEvent(t: (k: any) => string, key: string, params?: Record<string, string>) {
  let s = t(key);
  if (params) Object.entries(params).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
  return s;
}

export default function Owner() {
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const { countEnabled } = useNotificationPrefs();
  const { state, nextPhase, isFullyReady } = usePropertyOS(countEnabled);
  const { recentEvents } = useOperational();

  const payments = state.payments?.length ?? 0;

  return (
    <ScreenScaffold testID="owner-screen">
      <StoryScreenHeader
        question={t('op.owner.title')}
        hint={t('op.owner.sub')}
        showBack
        testID="owner-header"
      />

      <JourneyGuide
        where={t('journey.owner.guide.where' as any)}
        now={t('journey.owner.guide.now' as any)}
        benefit={t('journey.owner.guide.benefit' as any)}
        next={!isFullyReady && nextPhase
          ? t('pos.progress.nextLine' as any).replace('{next}', t(`pos.phase.${nextPhase === 'alerts' ? 'operations' : nextPhase}` as any))
          : t('journey.launch.ask' as any)}
        testID="owner-journey-guide"
      />

      {state.property ? (
        <Animated.View entering={FadeInDown.duration(500)}>
          <GlassCard padding={20} radiusToken="lg" edge="gold">
            <Text style={[styles.propName, isRTL && styles.rtl]}>{state.property.name}</Text>
            <Text style={[styles.propCity, isRTL && styles.rtl]}>{state.property.city}</Text>
            <View style={[styles.kpiRow, isRTL && styles.rowRtl]}>
              <Kpi label={t('op.owner.kpi.units')} value={String(state.units.length)} />
              <Kpi label={t('op.owner.kpi.tenants')} value={String(state.tenants.length)} />
              <Kpi label={t('op.owner.kpi.contracts')} value={String(state.contracts.length)} />
              <Kpi label={t('op.owner.kpi.payments')} value={String(payments)} />
            </View>
          </GlassCard>
        </Animated.View>
      ) : null}

      <View style={styles.grid}>
        {LINKS.map((link, i) => (
          <Animated.View key={link.key} entering={FadeInDown.duration(450).delay(40 + i * 30)} style={styles.tileWrap}>
            <Pressable
              testID={`owner-${link.key}`}
              onPress={() => { Haptics.selectionAsync(); router.push(link.route as any); }}
              style={({ pressed }) => [pressed && { opacity: 0.88 }]}
            >
              <GlassCard padding={14} radiusToken="md" edge={link.tone === 'gold' ? 'gold' : link.tone === 'emerald' ? 'emerald' : 'neutral'}>
                <View style={[styles.tileRow, isRTL && styles.rowRtl]}>
                  <Feather name={link.icon} size={16} color={link.tone === 'emerald' ? colors.emerald : colors.gold} />
                  <View style={styles.tileText}>
                    <Text style={[styles.tileLabel, isRTL && styles.rtl]}>{t(link.labelKey as any)}</Text>
                    <Text style={[styles.tileHint, isRTL && styles.rtl]}>{t(link.hintKey as any)}</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {state.technicianPortalToken ? (
        <Pressable
          onPress={() => router.push(`/portal/tech?t=${state.technicianPortalToken}` as any)}
          style={styles.techLink}
        >
          <Text style={styles.techLinkText}>{t('ops.technician')} →</Text>
        </Pressable>
      ) : null}

      {recentEvents.length ? (
        <View style={styles.events}>
          <Text style={[styles.eventsTitle, isRTL && styles.rtl]}>{t('op.owner.events')}</Text>
          {recentEvents.slice(0, 5).map((ev) => (
            <Text key={ev.id} style={[styles.eventLine, isRTL && styles.rtl]}>
              · {fmtEvent(t, ev.summaryKey, ev.summaryParams)}
            </Text>
          ))}
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  propName: { color: colors.text, fontSize: typography.cardTitle, fontWeight: typography.weight.semibold },
  propCity: { color: colors.textMuted, fontSize: typography.small, marginTop: 4 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  rowRtl: { flexDirection: 'row-reverse' },
  kpiRow: { flexDirection: 'row', marginTop: spacing.lg, gap: 8 },
  kpi: { flex: 1, alignItems: 'center' },
  kpiValue: { color: colors.text, fontSize: 18, fontWeight: typography.weight.semibold },
  kpiLabel: { color: colors.textMuted, fontSize: 9, marginTop: 4, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  tileWrap: { width: '48%' },
  tileRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tileText: { flex: 1, gap: 3 },
  tileLabel: { color: colors.text, fontSize: 13, fontWeight: typography.weight.semibold, lineHeight: 18 },
  tileHint: { color: colors.textMuted, fontSize: 11, lineHeight: 16, flexShrink: 1 },
  techLink: { marginTop: spacing.md, paddingVertical: 8 },
  techLinkText: { color: colors.emerald, fontSize: typography.small },
  events: { marginTop: spacing.xl },
  eventsTitle: {
    color: colors.textMuted, fontSize: 11, letterSpacing: 0.8,
    textTransform: 'uppercase', fontWeight: typography.weight.semibold, marginBottom: spacing.sm,
  },
  eventLine: { color: colors.textDim, fontSize: typography.small, lineHeight: 20, marginBottom: 4 },
});
