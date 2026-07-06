import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/src/components/GlassCard';
import { SmartEmployeeMark } from '@/src/components/SmartEmployeeMark';
import { JourneyValueTip } from '@/src/components/journey/JourneyValueTip';
import { PendingApprovalsPanel } from '@/src/components/PendingApprovalsPanel';
import { useAttentionPulse } from '@/src/hooks/useAttentionPulse';
import type { Briefing, DecisionT, NotifT } from '@/src/api/client';
import { formatNotification } from '@/src/utils/format-notification';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
import { useOperational } from '@/src/hooks/useOperational';
import { useNotificationPrefs } from '@/src/hooks/usePreferences';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type Props = {
  briefing: Briefing | null;
  notifications: NotifT[];
};

function decisionRoute(d: DecisionT): string {
  if (d.kind === 'maintenance') return '/maintenance';
  if (d.kind === 'financial') return '/billing';
  if (d.kind === 'tenant') return '/contracts';
  return '/brain';
}

function greetingKey(): 'journey.home.greetingMorning' | 'journey.home.greetingAfternoon' | 'journey.home.greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'journey.home.greetingMorning';
  if (h < 17) return 'journey.home.greetingAfternoon';
  return 'journey.home.greetingEvening';
}

/** Simplified daily home — assistant hero + "today you have" signals. */
export function HomeCommandCenter({ briefing, notifications }: Props) {
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const { countEnabled } = useNotificationPrefs();
  const { state: osState, isFullyReady, ready } = usePropertyOS(countEnabled);
  const { openTickets } = useOperational();
  const { acknowledge } = useAttentionPulse();

  const dailyMode = Boolean(osState.setupCompleted && osState.property);
  const lastDecision = briefing?.decisions?.[0];
  const expiring = briefing?.expiring_contracts ?? 0;
  const lateDecision = briefing?.decisions?.find((d) => d.kind === 'financial');
  const lastNotif = notifications[0];

  const assistantSuggestion = useMemo(() => {
    if (lastDecision?.title) return lastDecision.title;
    if (expiring > 0) return t('journey.home.contractExpiring');
    if (openTickets.length) return openTickets[0].title;
    if (!ready || (!osState.setupCompleted && !isFullyReady)) return t('home.daily.nextSetup');
    return t('home.daily.assistantSub');
  }, [lastDecision, expiring, openTickets, ready, osState.setupCompleted, isFullyReady, t]);

  const todayItems = useMemo(() => {
    const items: { key: string; label: string; body: string; route: string; active: boolean }[] = [];
    if (expiring > 0 || osState.contracts.some((c) => {
      const end = new Date(c.endDate).getTime();
      return end - Date.now() < 1000 * 60 * 60 * 24 * 45;
    })) {
      items.push({
        key: 'contract',
        label: t('journey.home.contractExpiring'),
        body: t('journey.home.tap'),
        route: '/contracts',
        active: true,
      });
    }
    if (lateDecision) {
      items.push({
        key: 'late',
        label: t('journey.home.tenantLate'),
        body: lateDecision.title,
        route: decisionRoute(lateDecision),
        active: true,
      });
    }
    if (openTickets.length) {
      items.push({
        key: 'ticket',
        label: t('journey.home.newTicket'),
        body: openTickets[0].title,
        route: '/maintenance',
        active: true,
      });
    }
    const stepBody = lastDecision?.title
      ?? (lastNotif
        ? formatNotification(lastNotif, (k) => t(k as Parameters<typeof t>[0])).headline
        : dailyMode ? t('home.daily.nextOps') : t('home.daily.nextSetup'));
    items.push({
      key: 'step',
      label: t('journey.home.suggestedStep'),
      body: stepBody,
      route: lastDecision ? decisionRoute(lastDecision) : dailyMode ? '/owner' : '/setup/property-os',
      active: true,
    });
    return items.slice(0, 4);
  }, [expiring, osState.contracts, lateDecision, openTickets, lastDecision, lastNotif, dailyMode, t]);

  const goAssistant = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/brain');
  };

  return (
    <View testID="home-command-center">
      <Animated.View entering={FadeInDown.duration(550).delay(20)}>
        <Pressable onPress={goAssistant} testID="home-assistant-hero">
          <GlassCard padding={0} radiusToken="lg" edge="gold">
            <LinearGradient
              colors={['rgba(212,175,55,0.18)', 'rgba(80,200,120,0.12)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.assistantGrad}
            >
              <View style={[styles.assistantRow, isRTL && styles.rowRtl]}>
                <SmartEmployeeMark size={64} />
                <View style={styles.assistantText}>
                  <Text style={[styles.greeting, isRTL && styles.rtl]}>{t(greetingKey())}</Text>
                  <Text style={[styles.assistantLead, isRTL && styles.rtl]}>{t('journey.home.assistantLead')}</Text>
                  <Text style={[styles.assistantSub, isRTL && styles.rtl]} numberOfLines={2}>
                    {assistantSuggestion}
                  </Text>
                  <View style={[styles.assistantCta, isRTL && styles.rowRtl]}>
                    <Text style={styles.assistantCtaText}>{t('home.daily.assistantCta')}</Text>
                    <Feather name="mic" size={14} color={colors.gold} />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </GlassCard>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.todayWrap}>
        <Text style={[styles.todayTitle, isRTL && styles.rtl]}>{t('journey.home.today')}</Text>
        {todayItems.length ? todayItems.map((item, i) => (
          <Pressable
            key={item.key}
            onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
            style={({ pressed }) => pressed && { opacity: 0.88 }}
            testID={`home-today-${item.key}`}
          >
            <GlassCard padding={16} radiusToken="md" edge={i === todayItems.length - 1 ? 'gold' : 'neutral'} style={styles.todayCard}>
              <View style={[styles.todayRow, isRTL && styles.rowRtl]}>
                <Text style={styles.todayCheck}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.todayLabel, isRTL && styles.rtl]}>{item.label}</Text>
                  <Text style={[styles.todayBody, isRTL && styles.rtl]} numberOfLines={2}>{item.body}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.textMuted} />
              </View>
            </GlassCard>
          </Pressable>
        )) : (
          <Text style={[styles.todayEmpty, isRTL && styles.rtl]}>{t('journey.home.none')}</Text>
        )}
      </Animated.View>

      <View style={{ marginTop: spacing.md }}>
        <JourneyValueTip />
      </View>

      {dailyMode ? (
        <PendingApprovalsPanel onAction={() => { void acknowledge(); }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  assistantGrad: { borderRadius: radius.lg, padding: 22 },
  assistantRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  rowRtl: { flexDirection: 'row-reverse' },
  assistantText: { flex: 1, gap: 4 },
  greeting: {
    color: colors.gold, fontSize: 13, fontWeight: typography.weight.semibold,
    letterSpacing: 0.3,
  },
  assistantLead: {
    color: colors.text, fontSize: typography.cardTitle,
    fontWeight: typography.weight.semibold,
  },
  assistantSub: { color: colors.textDim, fontSize: typography.small, lineHeight: 20, marginTop: 2 },
  assistantCta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  assistantCtaText: { color: colors.gold, fontSize: typography.small, fontWeight: typography.weight.semibold },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  todayWrap: { marginTop: spacing.lg, gap: spacing.sm },
  todayTitle: {
    color: colors.textMuted, fontSize: 11, letterSpacing: 0.8,
    textTransform: 'uppercase', fontWeight: typography.weight.semibold,
    marginBottom: 4,
  },
  todayCard: { marginBottom: spacing.xs },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayCheck: { color: colors.emerald, fontSize: 14, fontWeight: typography.weight.bold },
  todayLabel: { color: colors.text, fontSize: typography.body, fontWeight: typography.weight.medium },
  todayBody: { color: colors.textDim, fontSize: typography.small, marginTop: 2, lineHeight: 18 },
  todayEmpty: { color: colors.textDim, fontSize: typography.small, lineHeight: 20 },
});
