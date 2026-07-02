import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from './GlassCard';
import { colors, radius, spacing, typography } from '../theme';
import type { DecisionT } from '../api/client';

const kindIcon: Record<string, keyof typeof Feather.glyphMap> = {
  maintenance: 'tool',
  financial: 'trending-up',
  tenant: 'users',
  opportunity: 'star',
};

const priorityMeta: Record<DecisionT['priority'], { label: string; color: string }> = {
  critical: { label: 'Critical', color: colors.danger },
  high: { label: 'High priority', color: colors.gold },
  medium: { label: 'Recommended', color: colors.emerald },
  low: { label: 'Watch', color: colors.textMuted },
};

type Props = {
  decision: DecisionT;
  rank?: number;
  onAccept?: () => void;
  onDetails?: () => void;
};

/**
 * Linear/Stripe-inspired priority card.
 * Ordinal rank + reasoning + impact + one clear gold CTA. Massive breathing.
 */
export function ActionCard({ decision, rank, onAccept, onDetails }: Props) {
  const meta = priorityMeta[decision.priority];
  const iconName = kindIcon[decision.kind] ?? 'zap';
  const highPriority = decision.priority === 'critical' || decision.priority === 'high';

  return (
    <GlassCard
      testID={`decision-card-${decision.id}`}
      edge={highPriority ? 'gold' : 'neutral'}
      padding={26}
      radiusToken="lg"
      style={{ marginBottom: spacing.md }}
    >
      {/* Rank + priority pill */}
      <View style={styles.topRow}>
        {typeof rank === 'number' ? (
          <Text style={styles.rank}>
            {String(rank).padStart(2, '0')}
          </Text>
        ) : null}
        <View style={styles.priorityPill}>
          <View style={[styles.dot, { backgroundColor: meta.color }]} />
          <Text style={[styles.priorityLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.confidence}>
          <Text style={styles.confidenceValue}>{decision.confidence}</Text>
          <Text style={styles.confidenceLabel}>conf.</Text>
        </View>
      </View>

      {/* Kind icon */}
      <View style={[styles.iconWrap, highPriority && styles.iconWrapGold]}>
        <Feather name={iconName} size={16} color={highPriority ? colors.gold : colors.textDim} />
      </View>

      <Text style={styles.title}>{decision.title}</Text>
      <Text style={styles.reason}>{decision.reason}</Text>

      <View style={styles.impactRow}>
        <View style={styles.impactBar} />
        <Text style={styles.impact}>{decision.impact}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          testID={`decision-accept-${decision.id}`}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAccept?.();
          }}
          style={({ pressed }) => [
            styles.primaryBtn,
            highPriority ? styles.primaryBtnGold : styles.primaryBtnGhost,
            pressed && { opacity: 0.82, transform: [{ scale: 0.995 }] },
          ]}
        >
          <Text
            style={[
              styles.primaryBtnText,
              highPriority ? styles.primaryBtnTextGold : styles.primaryBtnTextGhost,
            ]}
            numberOfLines={2}
          >
            {decision.recommended_action}
          </Text>
        </Pressable>

        <Pressable
          testID={`decision-details-${decision.id}`}
          onPress={() => {
            Haptics.selectionAsync();
            onDetails?.();
          }}
          hitSlop={12}
          style={styles.secondaryBtn}
        >
          <Feather name="arrow-up-right" size={16} color={colors.textDim} />
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rank: {
    fontSize: 11,
    color: colors.textSubtle,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    fontWeight: typography.weight.medium,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  priorityLabel: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: typography.weight.medium,
  },
  confidence: { alignItems: 'flex-end' },
  confidenceValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
    fontVariant: ['tabular-nums'],
  },
  confidenceLabel: {
    color: colors.textSubtle,
    fontSize: 9.5,
    marginTop: -2,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  iconWrap: {
    marginTop: spacing.lg,
    width: 34, height: 34, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  iconWrapGold: {
    borderColor: colors.goldEdge,
    backgroundColor: colors.goldSoft,
  },
  title: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: typography.cardTitle,
    lineHeight: 25,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
  },
  reason: {
    marginTop: spacing.sm,
    color: colors.textDim,
    fontSize: typography.body,
    lineHeight: 22,
  },
  impactRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  impactBar: {
    width: 2, height: 14,
    backgroundColor: colors.emerald,
    borderRadius: 1,
    opacity: 0.85,
  },
  impact: {
    flex: 1,
    color: colors.emerald,
    fontSize: 13,
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  actionRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  primaryBtnGold: {
    backgroundColor: colors.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldEdge,
  },
  primaryBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  primaryBtnText: {
    fontSize: 13.5,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.2,
    lineHeight: 18,
    textAlign: 'center',
  },
  primaryBtnTextGold: { color: colors.gold },
  primaryBtnTextGhost: { color: colors.text },
  secondaryBtn: {
    width: 46,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
});
