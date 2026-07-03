import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { colors, spacing, typography } from '@/src/theme';

type Doc = { title: string; sub: string; sections: { h: string; p: string }[] };

export function LegalScreen({ doc, eyebrow, testID }: { doc: Doc; eyebrow: string; testID: string }) {
  return (
    <ScreenScaffold testID={testID}>
      <ScreenHeader eyebrow={eyebrow} title={doc.title} sub={doc.sub} showBack />
      <Animated.View entering={FadeInDown.duration(600)}>
        <GlassCard padding={22} radiusToken="lg">
          {doc.sections.map((s, i) => (
            <View key={s.h}>
              <Text style={styles.h}>{s.h}</Text>
              <Text style={styles.p}>{s.p}</Text>
              {i < doc.sections.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </GlassCard>
      </Animated.View>
      <View style={styles.footer}>
        <View style={styles.line} />
        <Text style={styles.updated}>Last updated · February 2026</Text>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  h: { color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold, letterSpacing: -0.2, marginTop: spacing.md },
  p: { color: colors.textDim, fontSize: 13.5, lineHeight: 22, marginTop: 8, letterSpacing: -0.05 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginTop: spacing.md },
  footer: { alignItems: 'center', marginTop: spacing.xl, gap: 10 },
  line: { width: 32, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  updated: { color: colors.textSubtle, fontSize: 10.5, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: typography.weight.medium },
});
