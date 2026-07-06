import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/src/components/GlassCard';
import { SmartEmployeeMark } from '@/src/components/SmartEmployeeMark';
import { ScreenHint } from '@/src/components/ScreenHint';
import { PendingApprovalsPanel } from '@/src/components/PendingApprovalsPanel';
import { SmartEmployeeSetupInsights } from '@/src/components/SmartEmployeeSetupInsights';
import type { Briefing, DecisionT, NotifT } from '@/src/api/client';
import { formatNotification } from '@/src/utils/format-notification';
import { usePropertyOS } from '@/src/hooks/usePropertyOS';
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

/** Calm daily home — four signals + assistant as the main control point. */
export function HomeCommandCenter({ briefing, notifications }: Props) {
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const { countEnabled } = useNotificationPrefs();
  const { state: osState, isFullyReady, ready } = usePropertyOS(countEnabled);

  const dailyMode = Boolean(osState.setupCompleted && osState.property);
  const lastNotif = notifications[0];
  const lastDecision = briefing?.decisions?.[0];
  const isLive = dailyMode || Boolean(briefing && briefing.properties_count > 0);

  const statusText = dailyMode
    ? t('home.daily.osStatus')
        .replace('{units}', String(osState.units.length))
        .replace('{tenants}', String(osState.tenants.length))
        .replace('{contracts}', String(osState.contracts.length))
    : isLive
      ? t('home.daily.statusLive')
          .replace('{count}', String(briefing?.properties_count ?? 0))
          .replace('{occupancy}', String(Math.round(briefing?.occupancy ?? 0)))
      : t('home.daily.statusReady');

  const nextStep = dailyMode
    ? (lastDecision?.title ?? t('home.daily.nextOps'))
    : !ready || (!osState.setupCompleted && !isFullyReady)
      ? t('home.daily.nextSetup')
      : lastDecision?.title
        ?? (briefing?.headline || t('home.daily.nextUpload'));

  const goAssistant = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/brain');
  };

  const goNext = () => {
    Haptics.selectionAsync();
    if (dailyMode) {
      if (lastDecision) {
        router.push(decisionRoute(lastDecision) as any);
        return;
      }
      if (lastNotif) {
        const f = formatNotification(lastNotif, (k) => t(k as Parameters<typeof t>[0]));
        router.push(f.actionRoute as any);
        return;
      }
      router.push('/owner');
      return;
    }
    if (!ready || (!osState.setupCompleted && !isFullyReady)) {
      router.push('/setup/property-os' as any);
      return;
    }
    if (lastDecision) {
      router.push(decisionRoute(lastDecision) as any);
      return;
    }
    if (lastNotif) {
      const f = formatNotification(lastNotif, (k) => t(k as Parameters<typeof t>[0]));
      router.push(f.actionRoute as any);
      return;
    }
    router.push('/upload');
  };

  return (
    <View testID="home-command-center">
      <ScreenHint text={t('home.daily.hint')} testID="home-daily-hint" />

      <Animated.View entering={FadeInDown.duration(550).delay(20)}>
        <Pressable onPress={goAssistant} testID="home-assistant-hero">
          <GlassCard padding={0} radiusToken="lg" edge="gold">
            <LinearGradient
              colors={['rgba(212,175,55,0.16)', 'rgba(80,200,120,0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.assistantGrad}
            >
              <View style={[styles.assistantRow, isRTL && styles.rowRtl]}>
                <SmartEmployeeMark size={56} />
                <View style={styles.assistantText}>
                  <Text style={[styles.assistantTitle, isRTL && styles.rtl]}>{t('home.daily.assistant')}</Text>
                  <Text style={[styles.assistantSub, isRTL && styles.rtl]} numberOfLines={2}>
                    {t('home.daily.assistantSub')}
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

      <DailyCard
        delay={80}
        testID="home-status"
        title={t('home.daily.status')}
        body={statusText}
        icon="activity"
        accent="emerald"
      />

      <DailyCard
        delay={120}
        testID="home-last-notif"
        title={t('home.daily.lastNotif')}
        body={lastNotif
          ? formatNotification(lastNotif, (k) => t(k as Parameters<typeof t>[0])).headline
          : t('home.daily.noNotif')}
        icon="bell"
        accent="gold"
        onPress={lastNotif ? () => {
          Haptics.selectionAsync();
          const f = formatNotification(lastNotif, (k) => t(k as Parameters<typeof t>[0]));
          router.push(f.actionRoute as any);
        } : undefined}
        actionLabel={lastNotif ? t('home.daily.tapNotif') : undefined}
      />

      <DailyCard
        delay={160}
        testID="home-last-decision"
        title={t('home.daily.lastDecision')}
        body={lastDecision?.title ?? t('home.daily.noDecision')}
        icon="cpu"
        accent="gold"
        onPress={lastDecision ? () => {
          Haptics.selectionAsync();
          router.push(decisionRoute(lastDecision) as any);
        } : goAssistant}
      />

      <DailyCard
        delay={200}
        testID="home-next-step"
        title={t('home.daily.nextStep')}
        body={nextStep}
        icon="arrow-right-circle"
        accent="emerald"
        onPress={goNext}
        highlight
      />

      {dailyMode ? <PendingApprovalsPanel /> : null}
      {dailyMode ? <SmartEmployeeSetupInsights briefing={briefing} /> : null}
    </View>
  );
}

function DailyCard({
  title, body, icon, accent, delay, testID, onPress, actionLabel, highlight,
}: {
  title: string;
  body: string;
  icon: keyof typeof Feather.glyphMap;
  accent: 'gold' | 'emerald';
  delay: number;
  testID: string;
  onPress?: () => void;
  actionLabel?: string;
  highlight?: boolean;
}) {
  const { isRTL } = useI18n();
  const color = accent === 'gold' ? colors.gold : colors.emerald;

  const inner = (
    <GlassCard padding={18} radiusToken="md" edge={highlight ? 'gold' : 'neutral'} testID={testID}>
      <View style={[styles.cardRow, isRTL && styles.rowRtl]}>
        <View style={[styles.cardIcon, { borderColor: `${color}44` }]}>
          <Feather name={icon} size={16} color={color} />
        </View>
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, isRTL && styles.rtl]}>{title}</Text>
          <Text style={[styles.cardBody, isRTL && styles.rtl]} numberOfLines={3}>{body}</Text>
          {actionLabel ? (
            <Text style={[styles.cardAction, isRTL && styles.rtl]}>{actionLabel}</Text>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay)} style={styles.cardWrap}>
      {onPress ? (
        <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.88 }}>
          {inner}
        </Pressable>
      ) : inner}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  assistantGrad: { borderRadius: radius.lg, padding: 20 },
  assistantRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  rowRtl: { flexDirection: 'row-reverse' },
  assistantText: { flex: 1, gap: 6 },
  assistantTitle: {
    color: colors.text, fontSize: typography.cardTitle,
    fontWeight: typography.weight.semibold, letterSpacing: typography.letter.tight,
  },
  assistantSub: { color: colors.textDim, fontSize: typography.small, lineHeight: 20 },
  assistantCta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  assistantCtaText: { color: colors.gold, fontSize: typography.small, fontWeight: typography.weight.semibold },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  cardWrap: { marginTop: spacing.md },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: {
    color: colors.textMuted, fontSize: 11, letterSpacing: 0.8,
    textTransform: 'uppercase', fontWeight: typography.weight.semibold,
  },
  cardBody: { color: colors.text, fontSize: typography.body, lineHeight: 24 },
  cardAction: { color: colors.gold, fontSize: typography.small, marginTop: 4 },
});
