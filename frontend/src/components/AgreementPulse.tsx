import React from 'react';
import { View } from 'react-native';
import { colors } from '@/src/theme';

type Props = { color?: string; size?: number; testID?: string };

/** Agreement brand pulse — fixed emerald dot + static halo (no motion). */
export function AgreementPulse({
  color = colors.emerald,
  size = 6,
  testID = 'agreement-pulse',
}: Props) {
  const wrap = size * 2.4;
  return (
    <View
      testID={testID}
      style={{ width: wrap, height: wrap, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          position: 'absolute',
          width: wrap,
          height: wrap,
          borderRadius: wrap / 2,
          backgroundColor: color,
          opacity: 0.28,
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.75,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </View>
  );
}
