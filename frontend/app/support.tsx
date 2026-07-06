import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { StoryScreenHeader } from '@/src/components/StoryScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { colors, spacing, typography } from '@/src/theme';
import { useI18n } from '@/src/i18n';

export default function Support() {
  const { t, isRTL } = useI18n();

  const channels = [
    { icon: 'message-circle' as const, labelKey: 'support.channel.whatsapp', hintKey: 'support.channel.whatsappHint', href: 'https://wa.me/971000000000', accent: 'emerald' as const },
    { icon: 'mail' as const, labelKey: 'support.channel.email', hintKey: 'support.channel.emailHint', href: 'mailto:support@spp.ai', accent: 'gold' as const },
    { icon: 'phone' as const, labelKey: 'support.channel.phone', hintKey: 'support.channel.phoneHint', href: 'tel:+971000000000' },
  ];

  const faqs = [
    { q: t('support.faq1.q'), a: t('support.faq1.a') },
    { q: t('support.faq2.q'), a: t('support.faq2.a') },
    { q: t('support.faq3.q'), a: t('support.faq3.a') },
  ];

  return (
    <ScreenScaffold testID="support-screen">
      <StoryScreenHeader question={t('page.q.support')} hint={t('support.sub')} showBack testID="support-header" />

      {channels.map((c, i) => (
        <Animated.View key={c.labelKey} entering={FadeInDown.duration(600).delay(60 * i)}>
          <Pressable
            testID={`support-${c.icon}`}
            onPress={() => { Haptics.selectionAsync(); Linking.openURL(c.href).catch(() => {}); }}
            style={{ marginBottom: spacing.md }}
          >
            <GlassCard padding={20} radiusToken="lg" edge={c.accent ?? 'neutral'}>
              <View style={styles.row}>
                <View style={[
                  styles.iconChip,
                  c.accent === 'gold' && { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
                  c.accent === 'emerald' && { borderColor: colors.emeraldEdge, backgroundColor: colors.emeraldSoft },
                ]}>
                  <Feather
                    name={c.icon}
                    size={16}
                    color={c.accent === 'gold' ? colors.gold : c.accent === 'emerald' ? colors.emerald : colors.textDim}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, isRTL && styles.rtl]}>{t(c.labelKey as 'support.channel.whatsapp')}</Text>
                  <Text style={[styles.hint, isRTL && styles.rtl]}>{t(c.hintKey as 'support.channel.whatsappHint')}</Text>
                </View>
                <Feather name="arrow-up-right" size={16} color={colors.textDim} />
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      ))}

      <View style={{ marginTop: spacing.lg }}>
        <Text style={styles.faqTitle}>{t('support.faqTitle').toUpperCase()}</Text>
        {faqs.map((f, i) => (
          <Animated.View key={f.q} entering={FadeInDown.duration(600).delay(200 + 60 * i)} style={{ marginTop: spacing.sm }}>
            <GlassCard padding={18} radiusToken="lg">
              <Text style={[styles.q, isRTL && styles.rtl]}>{f.q}</Text>
              <Text style={[styles.a, isRTL && styles.rtl]}>{f.a}</Text>
            </GlassCard>
          </Animated.View>
        ))}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconChip: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  label: { color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold, letterSpacing: -0.2 },
  hint: { color: colors.textMuted, fontSize: 12.5, marginTop: 3 },
  faqTitle: { color: colors.textMuted, fontSize: 10.5, letterSpacing: 2, fontWeight: typography.weight.medium, marginBottom: spacing.sm },
  q: { color: colors.text, fontSize: 14, fontWeight: typography.weight.semibold, letterSpacing: -0.1 },
  a: { color: colors.textDim, fontSize: 13, lineHeight: 20, marginTop: 8 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
