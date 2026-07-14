import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { AliveEmpty } from '@/src/components/AliveEmpty';
import { NotificationCard } from '@/src/components/NotificationCard';
import { api, type NotifT } from '@/src/api/client';
import { formatNotification } from '@/src/utils/format-notification';
import {
  NOTIF_CATEGORIES,
  categorizeNotification,
  type NotifCategory,
} from '@/src/utils/notification-category';
import { colors, radius, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { useAttentionPulse } from '@/src/hooks/useAttentionPulse';

type Filter = 'all' | NotifCategory;

const FILTERS: Filter[] = ['all', ...NOTIF_CATEGORIES];

export default function Notifications() {
  const { t, isRTL } = useI18n();
  const { acknowledge } = useAttentionPulse();
  const [items, setItems] = useState<NotifT[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    api.notifications().then((list) => {
      setItems(list);
      void acknowledge();
    }).catch(() => {});
  }, [acknowledge]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((n) => categorizeNotification(n) === filter);
  }, [filter, items]);

  return (
    <ScreenScaffold testID="notifications-screen">
      <StoryScreenHeader
        question={t('notif.center.title')}
        hint={t('notifications.sub')}
        testID="notifications-header"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chips, isRTL && styles.chipsRtl]}
        style={styles.chipsScroll}
        testID="notif-filters"
      >
        {FILTERS.map((key) => {
          const active = filter === key;
          const label = t(`notif.filter.${key}` as Parameters<typeof t>[0]);
          return (
            <Pressable
              key={key}
              testID={`notif-filter-${key}`}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(key);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {items.length === 0 ? (
        <AliveEmpty title={t('alive.notifications.title')} body={t('alive.notifications.body')} />
      ) : filtered.length === 0 ? (
        <AliveEmpty title={t('notif.filter.empty')} body={t('notif.filter.empty.hint')} />
      ) : (
        filtered.map((n, i) => (
          <Animated.View key={n.id} entering={FadeInDown.duration(500).delay(40 * i)} style={styles.card}>
            <NotificationCard
              formatted={formatNotification(n, (k) => t(k as Parameters<typeof t>[0]))}
              at={n.at}
              priority={n.priority}
              testID={`notif-${n.id}`}
            />
          </Animated.View>
        ))
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  chipsScroll: { marginBottom: spacing.md, maxHeight: 44 },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chipsRtl: { flexDirection: 'row-reverse' },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipActive: {
    borderColor: `${colors.gold}88`,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  chipText: { color: colors.textMuted, fontSize: typography.small, fontWeight: typography.weight.medium },
  chipTextActive: { color: colors.gold },
  card: { marginBottom: spacing.md },
});
