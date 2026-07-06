import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { AliveEmpty } from '@/src/components/AliveEmpty';
import { NotificationCard } from '@/src/components/NotificationCard';
import { api, type NotifT } from '@/src/api/client';
import { formatNotification } from '@/src/utils/format-notification';
import { spacing } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { useAttentionPulse } from '@/src/hooks/useAttentionPulse';

export default function Notifications() {
  const { t } = useI18n();
  const { acknowledge } = useAttentionPulse();
  const [items, setItems] = useState<NotifT[]>([]);

  useEffect(() => {
    api.notifications().then((list) => {
      setItems(list);
      void acknowledge();
    }).catch(() => {});
  }, [acknowledge]);

  return (
    <ScreenScaffold testID="notifications-screen">
      <StoryScreenHeader
        question={t('notif.center.title')}
        hint={t('notifications.sub')}
        testID="notifications-header"
      />

      {items.length === 0 ? (
        <AliveEmpty title={t('alive.notifications.title')} body={t('alive.notifications.body')} />
      ) : (
        items.map((n, i) => (
          <Animated.View key={n.id} entering={FadeInDown.duration(500).delay(50 * i)} style={styles.card}>
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
  card: { marginBottom: spacing.md },
});
