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
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { TAB_BAR_RESERVED } from '../constants/chrome';

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

/** Screen shell with keyboard lift on all platforms. */
export function ScreenScaffold({
  children, testID, scrollable = true, contentStyle, showTabBar = true,
  refreshControl, keyboardAware = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });
  const wsPad = useWorkspacePadding();

  const padTop = insets.top + wsPad.paddingTop + spacing.lg;
  const padRight = wsPad.paddingRight + spacing.lg;
  const tabReserve = showTabBar ? TAB_BAR_RESERVED + insets.bottom : spacing.xl;
  const padBottom = tabReserve + (keyboardAware ? keyboardInset : 0) + spacing.lg;

  const scrollContent = scrollable ? (
    <AScroll
      onScroll={onScroll}
      scrollEventThrottle={16}
      decelerationRate="normal"
      overScrollMode="never"
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
      refreshControl={refreshControl}
      contentContainerStyle={[{
        paddingTop: padTop,
        paddingBottom: padBottom,
        paddingLeft: spacing.lg,
        paddingRight: padRight,
        flexGrow: 1,
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
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
