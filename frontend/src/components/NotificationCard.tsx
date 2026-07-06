import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '@/src/components/GlassCard';
import type { FormattedNotification } from '@/src/utils/format-notification';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { formatTime } from '@/src/utils/locale';

type Props = {
  formatted: FormattedNotification;
  at: string;
  priority: string;
  testID?: string;
};

export function NotificationCard({ formatted, at, priority, testID }: Props) {
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const accent = priority === 'critical' || priority === 'high' ? colors.gold : colors.emerald;

  return (
    <GlassCard
      padding={20}
      radiusToken="lg"
      edge={priority === 'critical' || priority === 'high' ? 'gold' : 'neutral'}
      testID={testID}
    >
      <View style={[styles.top, isRTL && styles.rtlRow]}>
        <View style={[styles.iconWrap, { borderColor: `${accent}44` }]}>
          <Feather name="bell" size={14} color={accent} />
        </View>
        <Text style={styles.time}>{formatTime(at)}</Text>
      </View>

      <Text style={[styles.headline, isRTL && styles.rtl]}>{formatted.headline}</Text>

      <Text style={[styles.recLabel, isRTL && styles.rtl]}>{t('notif.recommendedAction')}</Text>
      <Text style={[styles.recBody, isRTL && styles.rtl]}>{formatted.recommendation}</Text>

      <Pressable
        testID={`${testID}-action`}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(formatted.actionRoute as any);
        }}
        style={[styles.cta, isRTL && styles.rtlRow]}
      >
        <Text style={styles.ctaText}>{t(formatted.actionLabelKey as 'notif.action.review')}</Text>
        <Feather name={isRTL ? 'chevron-left' : 'chevron-right'} size={14} color={colors.gold} />
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rtlRow: { flexDirection: 'row-reverse' },
  iconWrap: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  time: { color: colors.textSubtle, fontSize: 11, fontVariant: ['tabular-nums'] },
  headline: {
    color: colors.text, fontSize: 16, lineHeight: 24,
    fontWeight: typography.weight.semibold, letterSpacing: typography.letter.tight,
  },
  recLabel: {
    color: colors.textMuted, fontSize: 10, letterSpacing: 1.2,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
    marginTop: spacing.md,
  },
  recBody: {
    color: colors.textDim, fontSize: 14, lineHeight: 21, marginTop: 6,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  cta: {
    marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.goldEdge,
    backgroundColor: colors.goldSoft,
  },
  ctaText: {
    color: colors.gold, fontSize: 13, fontWeight: typography.weight.semibold,
  },
});
