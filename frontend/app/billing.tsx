import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ScreenScaffold } from '@/src/components/ScreenScaffold';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { GlassCard } from '@/src/components/GlassCard';
import { colors, spacing, typography, radius } from '@/src/theme';

const plans = [
  { key: 'starter', name: 'Starter', priceMo: 49, blurb: 'Up to 2 properties · daily brief', features: ['Unified Brain (100 msg/mo)', 'Property Health', 'Email support'] },
  { key: 'executive', name: 'Executive', priceMo: 199, blurb: 'Up to 20 properties · full AI Employee', features: ['Unified Brain unlimited', 'Predictive Maintenance', 'Virtual Sensors', 'WhatsApp priority'], current: true, accent: 'gold' as const },
  { key: 'estate', name: 'Estate', priceMo: 499, blurb: 'Unlimited · dedicated concierge', features: ['Everything in Executive', 'Green API integration', 'Home Assistant bridge', 'Named CX manager'], accent: 'emerald' as const },
];

const invoices = [
  { id: 'in_1', date: 'Feb 01 · 2026', amount: 199, status: 'Paid' },
  { id: 'in_2', date: 'Jan 01 · 2026', amount: 199, status: 'Paid' },
  { id: 'in_3', date: 'Dec 01 · 2025', amount: 199, status: 'Paid' },
];

export default function Billing() {
  return (
    <ScreenScaffold testID="billing-screen">
      <ScreenHeader eyebrow="Account" title="Subscription & Billing" sub="Your plan, invoices and payment method." showBack />

      {/* Current plan card */}
      <Animated.View entering={FadeInDown.duration(650)}>
        <GlassCard padding={24} radiusToken="lg" edge="gold" bright>
          <View style={styles.currentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.currentEyebrow}>CURRENT PLAN</Text>
              <View style={styles.currentTitle}>
                <Text style={styles.planName}>Executive</Text>
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.planPrice}>AED 199<Text style={styles.planPer}> · month</Text></Text>
              <Text style={styles.renews}>Renews on March 1 · Visa ·· 4242</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Plans */}
      <View style={{ marginTop: spacing.xl }}>
        <Text style={styles.section}>PLANS</Text>
        {plans.map((p, i) => (
          <Animated.View key={p.key} entering={FadeInDown.duration(600).delay(80 * i)} style={{ marginTop: spacing.sm }}>
            <GlassCard padding={20} radiusToken="lg" edge={p.accent ?? 'neutral'}>
              <View style={styles.planTop}>
                <Text style={styles.planNameSmall}>{p.name}</Text>
                {p.current ? <Text style={styles.currentLabel}>YOUR PLAN</Text> : null}
                <View style={{ flex: 1 }} />
                <Text style={styles.planPriceSmall}>AED {p.priceMo}<Text style={styles.planPerSmall}>/mo</Text></Text>
              </View>
              <Text style={styles.blurb}>{p.blurb}</Text>
              <View style={{ marginTop: 12, gap: 6 }}>
                {p.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Feather name="check" size={12} color={p.current ? colors.gold : colors.emerald} />
                    <Text style={styles.feature}>{f}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </View>

      {/* Invoices */}
      <View style={{ marginTop: spacing.xl }}>
        <Text style={styles.section}>INVOICES</Text>
        <GlassCard padding={0} radiusToken="lg" style={{ marginTop: spacing.sm }}>
          {invoices.map((inv, i) => (
            <View key={inv.id}>
              <Pressable
                testID={`invoice-${inv.id}`}
                onPress={() => Haptics.selectionAsync()}
                style={styles.invRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.invDate}>{inv.date}</Text>
                  <Text style={styles.invStatus}>{inv.status}</Text>
                </View>
                <Text style={styles.invAmount}>AED {inv.amount}</Text>
                <Feather name="download" size={13} color={colors.textMuted} style={{ marginLeft: 12 }} />
              </Pressable>
              {i < invoices.length - 1 ? <View style={styles.invDivider} /> : null}
            </View>
          ))}
        </GlassCard>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  currentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  currentEyebrow: { color: colors.gold, fontSize: 10.5, letterSpacing: 2, fontWeight: typography.weight.medium },
  currentTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  planName: { color: colors.text, fontSize: 26, fontWeight: typography.weight.semibold, letterSpacing: -0.6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.emeraldSoft, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.emeraldEdge },
  badgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.emerald },
  badgeText: { color: colors.emerald, fontSize: 9.5, letterSpacing: 1.2, fontWeight: typography.weight.medium },
  planPrice: { color: colors.text, fontSize: 22, fontWeight: typography.weight.semibold, letterSpacing: -0.5, marginTop: 8, fontVariant: ['tabular-nums'] },
  planPer: { color: colors.textMuted, fontSize: 13, letterSpacing: 0 },
  renews: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  section: { color: colors.textMuted, fontSize: 10.5, letterSpacing: 2, fontWeight: typography.weight.medium },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planNameSmall: { color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold, letterSpacing: -0.2 },
  currentLabel: { color: colors.gold, fontSize: 9.5, letterSpacing: 1.4, fontWeight: typography.weight.medium },
  planPriceSmall: { color: colors.text, fontSize: 15, fontWeight: typography.weight.semibold, fontVariant: ['tabular-nums'] },
  planPerSmall: { color: colors.textMuted, fontSize: 11 },
  blurb: { color: colors.textMuted, fontSize: 12.5, marginTop: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feature: { color: colors.textDim, fontSize: 13 },
  invRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  invDate: { color: colors.text, fontSize: 14, letterSpacing: -0.1 },
  invStatus: { color: colors.emerald, fontSize: 11, marginTop: 2, letterSpacing: 0.4 },
  invAmount: { color: colors.text, fontSize: 14, fontWeight: typography.weight.semibold, letterSpacing: -0.1, fontVariant: ['tabular-nums'] },
  invDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginHorizontal: 20 },
});
