import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { EmptyState } from '@/src/components/EmptyState';
import { api, type NotifT } from '@/src/api/client';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

const priorityColor = (p: string) => p === 'critical' ? colors.danger : p === 'high' ? colors.gold : p === 'medium' ? colors.emerald : colors.textMuted;

export default function Notifications() {
  const { t } = useI18n();
  const [items, setItems] = useState<NotifT[]>([]);

  useEffect(() => { api.notifications().then(setItems).catch(() => {}); }, []);

  return (
    <ScreenScaffold testID="notifications-screen">
      <ScreenHeader
        eyebrow="Inbox"
        title={t('notif.title')}
        sub={t('notif.sub')}
        showBack
      />

      {items.length === 0 ? (
        <EmptyState
          icon="check-circle"
          eyebrow="All quiet"
          title="You're all caught up."
          body="SPP only surfaces what matters. You'll see something here when it does."
        />
      ) : (
        items.map((n, i) => {
          const c = priorityColor(n.priority);
          return (
            <Animated.View key={n.id} entering={FadeInDown.duration(600).delay(60 * i)} style={{ marginBottom: spacing.md }}>
              <GlassCard padding={20} radiusToken="lg" edge={n.priority === 'critical' || n.priority === 'high' ? 'gold' : 'neutral'}>
                <View style={styles.row}>
                  <View style={[styles.iconWrap, { borderColor: c + '55', backgroundColor: c + '18' }]}>
                    <Feather name="bell" size={13} color={c} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.topRow}>
                      <Text style={styles.title}>{n.title}</Text>
                      <Text style={styles.at}>{new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <Text style={styles.body}>{n.body}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.dot, { backgroundColor: c }]} />
                      <Text style={[styles.priority, { color: c }]}>{n.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          );
        })
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold, letterSpacing: typography.letter.tight, flex: 1 },
  at: { color: colors.textSubtle, fontSize: 11, marginLeft: 8, fontVariant: ['tabular-nums'] },
  body: { color: colors.textDim, fontSize: 13.5, lineHeight: 20, marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  priority: { fontSize: 10, letterSpacing: 1.4, fontWeight: typography.weight.medium },
});
