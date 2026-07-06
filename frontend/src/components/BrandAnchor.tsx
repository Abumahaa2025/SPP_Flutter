import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Wordmark } from '@/src/components/BrandOrb';

type Props = { testID?: string };

/** Calm SPP identity — wordmark and bilingual tagline only. */
export function BrandAnchor({ testID = 'brand-anchor' }: Props) {
  return (
    <View style={styles.col} testID={testID}>
      <Wordmark size="sm" showBilingualTagline align="center" />
    </View>
  );
}

const styles = StyleSheet.create({
  col: { alignItems: 'center', justifyContent: 'center' },
});
