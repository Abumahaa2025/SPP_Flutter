import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../theme';

type Tab = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap };

export const SPP_TABS: Tab[] = [
  { key: 'home', label: 'Home', icon: 'sparkles-outline', iconActive: 'sparkles' },
  { key: 'properties', label: 'Portfolio', icon: 'business-outline', iconActive: 'business' },
  { key: 'brain', label: 'Brain', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
  { key: 'analytics', label: 'Insights', icon: 'analytics-outline', iconActive: 'analytics' },
];

type Props = {
  active: string;
  onChange: (key: string) => void;
};

/**
 * Floating glass tab bar. Max 4 tabs. Selected chip uses gold ink; unselected muted.
 */
export function GlassTabBar({ active, onChange }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.shadow}>
        <BlurView intensity={Platform.OS === 'android' ? 30 : 60} tint="dark" style={styles.bar}>
          <View style={styles.inner}>
            {SPP_TABS.map((t) => {
              const isActive = t.key === active;
              return (
                <Pressable
                  key={t.key}
                  testID={`tab-${t.key}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange(t.key);
                  }}
                  style={styles.item}
                  hitSlop={8}
                >
                  <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                    <Ionicons
                      name={isActive ? t.iconActive : t.icon}
                      size={20}
                      color={isActive ? colors.gold : colors.textMuted}
                    />
                  </View>
                  <Text style={[styles.label, isActive && styles.labelActive]}>{t.label}</Text>
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
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    alignItems: 'center',
  },
  shadow: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(6,11,20,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  bar: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  iconWrap: {
    width: 34, height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldEdge,
  },
  label: {
    fontSize: 10.5,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
  },
  labelActive: {
    color: colors.text,
  },
});
