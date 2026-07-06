import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/src/components/GlassCard';
import { SmartEmployeeMark } from '@/src/components/SmartEmployeeMark';
import { ExecutiveAskBar } from '@/src/components/ExecutiveAskBar';
import { HomeStatusPulseCard } from '@/src/components/HomeStatusPulseCard';
import { AppIcon } from '@/src/components/ui/AppIcon';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { PulseRow } from '@/src/components/PulseRow';
import type { Briefing, NotifT } from '@/src/api/client';
import { formatNotification } from '@/src/utils/format-notification';
import { buildPulseItems } from '@/src/utils/pulse-items';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type Props = {
  briefing: Briefing | null;
  notifications: NotifT[];
  dateEyebrow: string;
  onBriefLayout?: (y: number) => void;
};

/** Alive command center — employee, ask, brief, alerts. */
export function HomeCommandCenter({ briefing, notifications, dateEyebrow, onBriefLayout }: Props) {
  const { t, isRTL } = useI18n();
  const router = useRouter();

  return (
    <View testID="home-command-center">
      <HomeStatusPulseCard briefing={briefing} notifications={notifications} />

      <Animated.View entering={FadeInDown.duration(600).delay(40)}>
        <GlassCard padding={22} radiusToken="lg" edge="gold" testID="employee-card">
          <View style={[styles.employeeRow, isRTL && styles.rowRtl]}>
            <SmartEmployeeMark size={52} />
            <View style={styles.employeeText}>
              <Text style={[styles.eyebrow, isRTL && styles.rtl]}>{dateEyebrow}</Text>
              <Text style={[styles.salutation, isRTL && styles.rtl]}>
                {briefing?.salutation ? `${briefing.salutation}، ${briefing.owner_name}` : t('home.greeting')}
              </Text>
              <Text style={[styles.headline, isRTL && styles.rtl]} numberOfLines={2}>
                {briefing?.headline || t('home.command.lead')}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(550).delay(90)} style={styles.gap}>
        <PulseRow
          testID="home-pulse-row"
          items={buildPulseItems(briefing, (k) => t(k as Parameters<typeof t>[0])).map((item) => ({
            ...item,
            onPress: item.key === 'tasks' && briefing?.decisions.length
              ? () => router.push('/hub')
              : item.key === 'maintenance'
                ? () => router.push('/maintenance')
                : item.key === 'late'
                  ? () => router.push('/billing')
                  : item.key === 'collection'
                    ? () => router.push('/insights')
                    : item.onPress,
          }))}
        />
      </Animated.View>

      <View style={styles.gap}>
        <ExecutiveAskBar delay={80} />
      </View>

      {briefing?.narrative?.length ? (
        <Animated.View
          entering={FadeInDown.duration(650).delay(120)}
          style={styles.gap}
          onLayout={(e) => onBriefLayout?.(e.nativeEvent.layout.y)}
        >
          <GlassCard padding={22} radiusToken="lg" testID="brief-card">
            <View style={[styles.briefHead, isRTL && styles.rowRtl]}>
              <AppIcon name="sunrise" size="sm" accent="gold" />
              <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{t('home.command.brief')}</Text>
            </View>
            <View style={{ marginTop: 12, gap: 10 }}>
              {briefing.narrative.map((line, i) => (
                <View key={i} style={[styles.briefLine, isRTL && styles.rowRtl]}>
                  <View style={styles.briefDot} />
                  <Text style={[styles.briefText, isRTL && styles.rtl]}>{line}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.duration(650).delay(180)}>
        <View style={[styles.sectionHead, isRTL && styles.rowRtl]}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{t('home.command.notifications')}</Text>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
            <Text style={styles.seeAll}>{t('home.command.seeAll')}</Text>
          </Pressable>
        </View>
        {notifications.length === 0 ? (
          <GlassCard padding={18} radiusToken="md">
            <Text style={[styles.emptyNotif, isRTL && styles.rtl]}>{t('home.command.noNotifications')}</Text>
          </GlassCard>
        ) : (
          notifications.slice(0, 3).map((n) => {
            const f = formatNotification(n, (k) => t(k as Parameters<typeof t>[0]));
            return (
              <PressableScale
                key={n.id}
                testID={`home-notif-${n.id}`}
                onPress={() => { Haptics.selectionAsync(); router.push(f.actionRoute as any); }}
                style={{ marginBottom: spacing.sm }}
              >
                <GlassCard padding={16} radiusToken="md" edge={n.priority === 'high' ? 'gold' : 'neutral'}>
                  <Text style={[styles.notifTitle, isRTL && styles.rtl]} numberOfLines={2}>{f.headline}</Text>
                  <Text style={[styles.notifRec, isRTL && styles.rtl]} numberOfLines={2}>{f.recommendation}</Text>
                  <Text style={styles.notifAction}>{t(f.actionLabelKey as 'notif.action.review')}</Text>
                </GlassCard>
              </PressableScale>
            );
          })
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: spacing.lg },
  employeeRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  rowRtl: { flexDirection: 'row-reverse' },
  employeeText: { flex: 1, gap: 4 },
  eyebrow: {
    color: colors.textMuted, fontSize: 10, letterSpacing: 1.6,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  salutation: { color: colors.textDim, fontSize: 14, lineHeight: 20 },
  headline: {
    color: colors.text, fontSize: 20, lineHeight: 28,
    fontWeight: typography.weight.semibold, letterSpacing: typography.letter.tight,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emerald,
  },
  liveText: { color: colors.emerald, fontSize: 11, fontWeight: typography.weight.medium },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  briefHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold },
  briefLine: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  briefDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold, marginTop: 8 },
  briefText: { flex: 1, color: colors.textDim, fontSize: 14, lineHeight: 22 },
  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  seeAll: { color: colors.gold, fontSize: 12, fontWeight: typography.weight.medium },
  emptyNotif: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  notifTitle: { color: colors.text, fontSize: 14, fontWeight: typography.weight.semibold, lineHeight: 20 },
  notifRec: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginTop: 6 },
  notifAction: { color: colors.gold, fontSize: 11, marginTop: 10, fontWeight: typography.weight.medium },
});
