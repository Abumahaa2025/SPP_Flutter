import React from 'react';
import {
  View, StyleSheet, ViewStyle, RefreshControl, KeyboardAvoidingView, Platform,
  type RefreshControlProps,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { AmbientBackground } from './AmbientBackground';
import { colors, spacing } from '../theme';
import { useWorkspacePadding } from '../hooks/use-workspace-padding';

const AScroll = Animated.ScrollView;

type Props = {
  children: React.ReactNode;
  testID?: string;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
  showTabBar?: boolean;
  keyboardAware?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

/** Reusable screen shell — ambient background + safe area + optional scroll + keyboard lift. */
export function ScreenScaffold({
  children, testID, scrollable = true, contentStyle, showTabBar = true,
  refreshControl, keyboardAware = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });
  const wsPad = useWorkspacePadding();

  const padTop = insets.top + wsPad.paddingTop + spacing.lg;
  const padRight = wsPad.paddingRight + spacing.lg;
  const padBottom = showTabBar
    ? insets.bottom + wsPad.paddingBottom + spacing.lg
    : spacing.xl;

  const scrollContent = scrollable ? (
    <AScroll
      onScroll={onScroll}
      scrollEventThrottle={16}
      decelerationRate="normal"
      overScrollMode="never"
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      refreshControl={refreshControl}
      contentContainerStyle={[{
        paddingTop: padTop,
        paddingBottom: padBottom + (keyboardAware ? 80 : 0),
        paddingLeft: spacing.lg,
        paddingRight: padRight,
      }, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </AScroll>
  ) : (
    <View style={[{
      flex: 1, paddingTop: padTop, paddingBottom: padBottom,
      paddingLeft: spacing.lg, paddingRight: padRight,
    }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={styles.root} testID={testID}>
      <StatusBar style="light" />
      <AmbientBackground scrollY={scrollY} />
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top}
        >
          {scrollContent}
        </KeyboardAvoidingView>
      ) : scrollContent}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
