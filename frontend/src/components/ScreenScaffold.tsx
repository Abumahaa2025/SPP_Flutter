import React from 'react';

import { View, StyleSheet, ViewStyle, RefreshControl, type RefreshControlProps } from 'react-native';

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

  refreshControl?: React.ReactElement<RefreshControlProps>;

};



/**

 * Reusable screen shell — ambient background + safe area + optional scroll.

 * Bottom tab bar is mounted globally via WorkspaceChrome.

 */

export function ScreenScaffold({

  children, testID, scrollable = true, contentStyle, showTabBar = true, refreshControl,

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



  return (

    <View style={styles.root} testID={testID}>

      <StatusBar style="light" />

      <AmbientBackground scrollY={scrollY} />

      {scrollable ? (

        <AScroll

          onScroll={onScroll}

          scrollEventThrottle={16}

          decelerationRate="normal"

          overScrollMode="never"

          nestedScrollEnabled

          refreshControl={refreshControl}

          contentContainerStyle={[{

            paddingTop: padTop,

            paddingBottom: padBottom,

            paddingLeft: spacing.lg,

            paddingRight: padRight,

          }, contentStyle]}

          showsVerticalScrollIndicator={false}

        >

          {children}

        </AScroll>

      ) : (

        <View style={[{ flex: 1, paddingTop: padTop, paddingBottom: padBottom, paddingLeft: spacing.lg, paddingRight: padRight }, contentStyle]}>

          {children}

        </View>

      )}

    </View>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: colors.bg },

});

