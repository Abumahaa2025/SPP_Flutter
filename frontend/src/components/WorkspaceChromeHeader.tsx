import React from 'react';

import { View, StyleSheet, Platform } from 'react-native';

import { BlurView } from 'expo-blur';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import { BrandAnchor } from '@/src/components/BrandAnchor';

import { useWorkspace } from '@/src/context/WorkspaceContext';

import { WORKSPACE_TOTAL_HEADER_HEIGHT } from '@/src/data/workspace-nav';

import { colors, spacing } from '@/src/theme';



/** Calm brand-only header — logo and tagline, nothing else. */

export function WorkspaceChromeHeader() {

  const insets = useSafeAreaInsets();

  const { contentInsets } = useWorkspace();



  return (

    <View

      style={[

        styles.wrap,

        {

          paddingTop: insets.top,

          height: insets.top + WORKSPACE_TOTAL_HEADER_HEIGHT,

          paddingRight: contentInsets.right + spacing.sm,

          paddingLeft: spacing.sm,

        },

      ]}

      testID="workspace-chrome-header"

    >

      <BlurView intensity={Platform.OS === 'android' ? 28 : 72} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={styles.brandCenter}>

        <BrandAnchor testID="ws-brand-anchor" />

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: {

    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 35,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: colors.border,

    overflow: 'hidden',

  },

  brandCenter: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    height: WORKSPACE_TOTAL_HEADER_HEIGHT,

  },

});

