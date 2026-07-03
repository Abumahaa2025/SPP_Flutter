import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { AmbientBackground } from './AmbientBackground';
import { GlassTabBar } from './GlassTabBar';
import { colors, spacing } from '../theme';

const AScroll = Animated.ScrollView;

type Props = {
  children: React.ReactNode;
  testID?: string;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
  showTabBar?: boolean;
};

/**
 * Reusable screen shell — ambient background + safe area + optional scroll +
 * floating tab bar. Same visual chassis as the AI Employee Home.
 */
export function ScreenScaffold({
  children, testID, scrollable = true, contentStyle, showTabBar = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });

  const padTop = insets.top + spacing.xl;
  const padBottom = showTabBar ? 180 : spacing.xl;

  return (
    <View style={styles.root} testID={testID}>
      <StatusBar style="light" />
      <AmbientBackground scrollY={scrollY} />
      {scrollable ? (
        <AScroll
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[{ paddingTop: padTop, paddingBottom: padBottom, paddingHorizontal: spacing.lg }, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </AScroll>
      ) : (
        <View style={[{ flex: 1, paddingTop: padTop, paddingBottom: padBottom, paddingHorizontal: spacing.lg }, contentStyle]}>
          {children}
        </View>
      )}
      {showTabBar ? <GlassTabBar /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
