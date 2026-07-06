import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { HOME_SHORTCUTS } from '@/src/data/home-directory';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type Props = {
  onScrollToPriorities?: () => void;
  delay?: number;
  testID?: string;
};

export function HomeShortcuts({ onScrollToPriorities, delay = 100, testID = 'home-shortcuts' }: Props) {
  const { t, isRTL } = useI18n();
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(delay)} style={styles.wrap} testID={testID}>
      <Text style={[styles.title, isRTL && styles.rtl]}>{t('org.shortcuts.title')}</Text>
      <Text style={[styles.sub, isRTL && styles.rtl]}>{t('org.shortcuts.sub')}</Text>
      <View style={styles.grid}>
        {HOME_SHORTCUTS.map((sc) => {
          const accent = sc.accent === 'emerald' ? colors.emerald : colors.gold;
          return (
            <Pressable
              key={sc.key}
              testID={`shortcut-${sc.key}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (sc.anchor === 'priorities') {
                  onScrollToPriorities?.();
                  return;
                }
                if (sc.route) router.push(sc.route as any);
              }}
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            >
              <View style={[styles.iconWrap, sc.accent && { borderColor: `${accent}55` }]}>
                <Feather name={sc.icon} size={16} color={sc.accent ? accent : colors.textDim} />
              </View>
              <Text style={[styles.label, isRTL && styles.rtl]} numberOfLines={2}>
                {t(sc.labelKey as 'org.short.today')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  title: {
    color: colors.text, fontSize: 17, fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
  },
  sub: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: spacing.md },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '23%',
    minWidth: 72,
    flexGrow: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  tilePressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  label: {
    color: colors.text, fontSize: 10.5, lineHeight: 14,
    textAlign: 'center', fontWeight: typography.weight.medium,
  },
});
