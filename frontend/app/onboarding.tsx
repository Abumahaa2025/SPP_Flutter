import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AmbientBackground } from '@/src/components/AmbientBackground';
import { LoadingOrb } from '@/src/components/LoadingOrb';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';
import { storage } from '@/src/utils/storage';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);

  const slides = [
    { title: t('onboarding.slide1.title'), body: t('onboarding.slide1.body'), icon: 'star' as const },
    { title: t('onboarding.slide2.title'), body: t('onboarding.slide2.body'), icon: 'compass' as const },
    { title: t('onboarding.slide3.title'), body: t('onboarding.slide3.body'), icon: 'message-circle' as const },
  ];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== idx) { setIdx(i); Haptics.selectionAsync(); }
  };

  const next = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (idx < slides.length - 1) {
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      scrollRef.current?.scrollTo({ x: width * nextIdx, animated: true });
    } else {
      await storage.setItem('spp.onboarded', true);
      router.replace('/');
    }
  };

  return (
    <View style={styles.root} testID="onboarding-screen">
      <StatusBar style="light" />
      <AmbientBackground />

      <View style={[styles.orbWrap, { top: insets.top + 40 }]} pointerEvents="none">
        <LoadingOrb size={54} />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { width, paddingTop: insets.top + 200 }]}>
            <Animated.View entering={FadeIn.duration(600)} style={styles.iconChip}>
              <Feather name={s.icon} size={14} color={colors.gold} />
              <Text style={styles.iconChipText}>SPP</Text>
            </Animated.View>
            <Animated.Text entering={FadeInDown.duration(700).delay(120)} style={styles.title}>
              {s.title}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(700).delay(220)} style={styles.body}>
              {s.body}
            </Animated.Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { bottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.pDot, i === idx && styles.pDotActive]} />
          ))}
        </View>
        <Pressable
          testID="onboarding-cta"
          onPress={next}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.ctaText}>
            {idx === slides.length - 1 ? t('onboarding.cta') : 'Continue'}
          </Text>
          <Feather name="arrow-right" size={16} color={colors.bg} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  orbWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  slide: {
    paddingHorizontal: spacing.xl,
    alignItems: 'flex-start',
  },
  iconChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.goldEdge,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
  },
  iconChipText: {
    color: colors.gold, fontSize: 10.5, letterSpacing: 2.4,
    textTransform: 'uppercase', fontWeight: typography.weight.medium,
  },
  title: {
    color: colors.text, fontSize: 34, lineHeight: 40,
    fontWeight: typography.weight.semibold, letterSpacing: -0.8,
    marginTop: spacing.xl, maxWidth: '92%',
  },
  body: {
    color: colors.textMuted, fontSize: 15.5, lineHeight: 24,
    marginTop: spacing.md, maxWidth: '92%',
  },
  footer: {
    position: 'absolute', left: spacing.lg, right: spacing.lg,
    gap: spacing.lg,
  },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  pDot: {
    width: 20, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  pDotActive: {
    backgroundColor: colors.gold,
    shadowColor: colors.gold, shadowOpacity: 0.6, shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: colors.gold,
    height: 56, borderRadius: radius.pill,
    shadowColor: colors.gold, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ctaText: { color: colors.bg, fontSize: 15, fontWeight: typography.weight.semibold, letterSpacing: 0.4 },
});
