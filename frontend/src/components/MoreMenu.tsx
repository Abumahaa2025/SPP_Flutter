import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/src/components/GlassCard';
import { colors, spacing, typography, radius } from '@/src/theme';
import { useI18n } from '@/src/i18n';

type MoreItem = {
  key: string;
  labelKey: string;
  hintKey: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  tone?: 'gold' | 'emerald';
};

const RARE_ITEMS: MoreItem[] = [
  { key: 'settings', labelKey: 'more.settings', hintKey: 'more.settings.hint', icon: 'settings', route: '/settings' },
  { key: 'propertyOs', labelKey: 'more.propertyOs', hintKey: 'more.propertyOs.hint', icon: 'compass', route: '/setup/property-os', tone: 'gold' },
  { key: 'upload', labelKey: 'nav.upload', hintKey: 'upload.sub', icon: 'upload-cloud', route: '/upload', tone: 'gold' },
  { key: 'sheets', labelKey: 'more.sheets', hintKey: 'more.sheets.hint', icon: 'database', route: '/setup/sheets', tone: 'emerald' },
  { key: 'greenApi', labelKey: 'more.greenApi', hintKey: 'more.greenApi.hint', icon: 'message-circle', route: '/setup/greenApi', tone: 'emerald' },
  { key: 'homeAssistant', labelKey: 'more.homeAssistant', hintKey: 'more.homeAssistant.hint', icon: 'home', route: '/setup/homeAssistant', tone: 'emerald' },
  { key: 'whatsapp', labelKey: 'op.services.whatsapp.title', hintKey: 'op.services.whatsapp.benefit', icon: 'message-circle', route: '/setup/whatsapp', tone: 'emerald' },
  { key: 'email', labelKey: 'op.services.email.title', hintKey: 'op.services.email.benefit', icon: 'mail', route: '/setup/email' },
  { key: 'integrations', labelKey: 'more.integrations', hintKey: 'more.integrations.hint', icon: 'link', route: '/operational/services' },
];

const ACCOUNT_ITEMS: MoreItem[] = [
  { key: 'profile', labelKey: 'more.profile', hintKey: 'more.profile.hint', icon: 'user', route: '/profile' },
  { key: 'billing', labelKey: 'more.billing', hintKey: 'more.billing.hint', icon: 'credit-card', route: '/billing', tone: 'gold' },
  { key: 'help', labelKey: 'more.help', hintKey: 'more.help.hint', icon: 'help-circle', route: '/support' },
];

function Section({ title, items, delayBase }: { title: string; items: MoreItem[]; delayBase: number }) {
  const { t, isRTL } = useI18n();
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{title}</Text>
      {items.map((item, i) => {
        const accent = item.tone === 'gold' ? colors.gold : item.tone === 'emerald' ? colors.emerald : colors.textDim;
        return (
          <Animated.View key={item.key} entering={FadeInDown.duration(480).delay(delayBase + i * 40)}>
            <Pressable
              testID={`more-${item.key}`}
              onPress={() => { Haptics.selectionAsync(); router.push(item.route as any); }}
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <GlassCard padding={16} radiusToken="md" style={styles.rowCard}>
                <View style={[styles.row, isRTL && styles.rowRtl]}>
                  <View style={[styles.iconWrap, { borderColor: `${accent}44` }]}>
                    <Feather name={item.icon} size={18} color={accent} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, isRTL && styles.rtl]}>{t(item.labelKey as Parameters<typeof t>[0])}</Text>
                    <Text style={[styles.rowHint, isRTL && styles.rtl]}>
                      {t(item.hintKey as Parameters<typeof t>[0])}
                    </Text>
                  </View>
                  <Feather name={isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={colors.textSubtle} style={styles.chevron} />
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

/** More screen — settings, integrations, and account. */
export function MoreMenu() {
  const { t } = useI18n();

  return (
    <View testID="more-menu">
      <Section title={t('more.section.rare')} items={RARE_ITEMS} delayBase={60} />
      <Section title={t('more.section.account')} items={ACCOUNT_ITEMS} delayBase={280} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg, gap: spacing.sm },
  sectionTitle: {
    color: colors.textMuted, fontSize: 11, letterSpacing: 1.4,
    textTransform: 'uppercase', fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs, paddingHorizontal: 2,
  },
  rowCard: { marginBottom: 0, minHeight: 72 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  rowRtl: { flexDirection: 'row-reverse' },
  iconWrap: {
    width: 42, height: 42, borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowText: { flex: 1, gap: 4, minWidth: 0 },
  rowLabel: {
    color: colors.text, fontSize: typography.body,
    fontWeight: typography.weight.semibold, lineHeight: 22, flexShrink: 1,
  },
  rowHint: {
    color: colors.textMuted, fontSize: typography.small,
    lineHeight: 20, flexShrink: 1,
  },
  chevron: { flexShrink: 0 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
