import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { colors, spacing, typography, radius } from '@/src/theme';

const channels = [
  { icon: 'message-circle' as const, label: 'WhatsApp priority line', hint: 'Reply within 15 min', href: 'https://wa.me/971000000000', accent: 'emerald' },
  { icon: 'mail' as const, label: 'Email your executive', hint: 'support@spp.ai · 4h SLA', href: 'mailto:support@spp.ai', accent: 'gold' },
  { icon: 'phone' as const, label: 'Concierge call', hint: 'By appointment · 24/7', href: 'tel:+971000000000' },
] as const;

const faqs = [
  { q: 'How is the Morning Brief generated?', a: 'The Unified Brain composes it from your live portfolio state, sensor drift and open decisions — nightly.' },
  { q: 'Where is my data stored?', a: 'Encrypted at rest. Only your organization can access it.' },
  { q: 'Can I switch AI models?', a: 'Yes. GPT-5.2 today; Claude and Gemini are drop-in via one config line.' },
];

export default function Support() {
  return (
    <ScreenScaffold testID="support-screen">
      <ScreenHeader eyebrow="Help" title="Contact & Support" sub="Talk to a human, or ask the Brain." showBack />

      {channels.map((c, i) => (
        <Animated.View key={c.label} entering={FadeInDown.duration(600).delay(60 * i)}>
          <Pressable
            testID={`support-${c.icon}`}
            onPress={() => { Haptics.selectionAsync(); Linking.openURL(c.href).catch(() => {}); }}
            style={{ marginBottom: spacing.md }}
          >
            <GlassCard padding={20} radiusToken="lg" edge={('accent' in c ? c.accent : 'neutral') as any}>
              <View style={styles.row}>
                <View style={[
                  styles.iconChip,
                  ('accent' in c && c.accent === 'gold') && { borderColor: colors.goldEdge, backgroundColor: colors.goldSoft },
                  ('accent' in c && c.accent === 'emerald') && { borderColor: colors.emeraldEdge, backgroundColor: colors.emeraldSoft },
                ]}>
                  <Feather
                    name={c.icon}
                    size={16}
                    color={('accent' in c && c.accent === 'gold') ? colors.gold : ('accent' in c && c.accent === 'emerald') ? colors.emerald : colors.textDim}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{c.label}</Text>
                  <Text style={styles.hint}>{c.hint}</Text>
                </View>
                <Feather name="arrow-up-right" size={16} color={colors.textDim} />
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      ))}

      <View style={{ marginTop: spacing.lg }}>
        <Text style={styles.faqTitle}>FREQUENT QUESTIONS</Text>
        {faqs.map((f, i) => (
          <Animated.View key={f.q} entering={FadeInDown.duration(600).delay(200 + 60 * i)} style={{ marginTop: spacing.sm }}>
            <GlassCard padding={18} radiusToken="lg">
              <Text style={styles.q}>{f.q}</Text>
              <Text style={styles.a}>{f.a}</Text>
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
});
