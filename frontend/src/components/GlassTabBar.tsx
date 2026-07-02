import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';
import { colors, radius, spacing, typography } from '../theme';
import { useI18n } from '../i18n';

type Tab = { key: string; path: string; icon: keyof typeof Feather.glyphMap; tKey: any };

export const SPP_TABS: Tab[] = [
  { key: 'home', path: '/', icon: 'home', tKey: 'nav.home' },
  { key: 'properties', path: '/portfolio', icon: 'grid', tKey: 'nav.portfolio' },
  { key: 'brain', path: '/brain', icon: 'message-circle', tKey: 'nav.brain' },
  { key: 'analytics', path: '/insights', icon: 'bar-chart-2', tKey: 'nav.insights' },
];

export function GlassTabBar() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const active =
    SPP_TABS.find((t) => (t.path === '/' ? pathname === '/' : pathname.startsWith(t.path)))?.key
    ?? 'home';

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.shadow}>
        <BlurView intensity={Platform.OS === 'android' ? 30 : 80} tint="dark" style={styles.bar}>
          <View style={styles.highlight} />
          <View style={styles.inner}>
            {SPP_TABS.map((t) => {
              const isActive = t.key === active;
              return (
                <Pressable
                  key={t.key}
                  testID={`tab-${t.key}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.replace(t.path as any);
                  }}
                  style={styles.item}
                  hitSlop={8}
                >
                  <Feather
                    name={t.icon}
                    size={20}
                    color={isActive ? colors.text : colors.textMuted}
                    style={{ opacity: isActive ? 1 : 0.85 }}
                  />
                  {isActive
                    ? <Animated.View entering={FadeIn.duration(220)} style={styles.dot} />
                    : <View style={styles.dotHidden} />}
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg, alignItems: 'center' },
  shadow: {
    width: '100%', borderRadius: radius.pill, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(6,11,20,0.55)',
    shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 }, elevation: 18,
  },
  bar: { width: '100%' },
  highlight: { position: 'absolute', left: 24, right: 24, top: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)' },
  inner: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingTop: 16, paddingBottom: 14 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold,
    shadowColor: colors.gold, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  dotHidden: { width: 4, height: 4 },
});
