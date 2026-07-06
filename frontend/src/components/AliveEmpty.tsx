import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState } from '@/src/components/EmptyState';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/** Empty state that still feels alive — orb + optional CTA. */
export function AliveEmpty({ title, body, actionLabel, onAction, testID }: Props) {
  const { isRTL } = useI18n();
  return (
    <Animated.View entering={FadeInDown.duration(500)} testID={testID}>
      <EmptyState orb title={title} body={body} />
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAction(); }}
          style={styles.btn}
        >
          <Text style={[styles.btnText, isRTL && styles.rtl]}>{actionLabel}</Text>
          <Feather name={isRTL ? 'arrow-left' : 'arrow-right'} size={14} color={colors.gold} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldEdge,
    backgroundColor: colors.goldSoft,
    alignSelf: 'center',
  },
  btnText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: typography.weight.semibold,
  },
  rtl: { writingDirection: 'rtl' },
});
