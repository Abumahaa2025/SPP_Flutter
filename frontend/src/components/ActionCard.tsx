import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from './GlassCard';
import { colors, radius, spacing, typography } from '../theme';
import type { DecisionT } from '../api/client';

const kindIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  maintenance: 'construct-outline',
  financial: 'trending-up-outline',
  tenant: 'people-outline',
  opportunity: 'sparkles-outline',
};

const priorityMeta: Record<DecisionT['priority'], { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: colors.danger, dot: colors.danger },
  high: { label: 'High priority', color: colors.gold, dot: colors.gold },
  medium: { label: 'Recommended', color: colors.emerald, dot: colors.emerald },
  low: { label: 'Watch', color: colors.textMuted, dot: colors.textMuted },
};

type Props = {
  decision: DecisionT;
  onAccept?: () => void;
  onDetails?: () => void;
};

/**
 * "What should I do next?" — a beautifully spaced action card.
 * Zero data density. Reasoning + impact + one clear next step.
 */
export function ActionCard({ decision, onAccept, onDetails }: Props) {
  const meta = priorityMeta[decision.priority];
  const iconName = kindIcon[decision.kind] ?? 'flash-outline';

  return (
    <GlassCard
      testID={`decision-card-${decision.id}`}
      edge={decision.priority === 'critical' || decision.priority === 'high' ? 'gold' : 'neutral'}
      padding={22}
      radiusToken="lg"
      style={{ marginBottom: spacing.md }}
    >
      <View style={styles.header}>
        <View style={[styles.iconChip, { borderColor: meta.color }]}>
          <Ionicons name={iconName} size={18} color={meta.color} />
        </View>
        <View style={styles.priorityRow}>
          <View style={[styles.dot, { backgroundColor: meta.dot }]} />
          <Text style={[styles.priorityLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <View style={styles.confidence}>
          <Text style={styles.confidenceValue}>{decision.confidence}</Text>
          <Text style={styles.confidenceLabel}>confidence</Text>
        </View>
      </View>

      <Text style={styles.title}>{decision.title}</Text>
      <Text style={styles.reason}>{decision.reason}</Text>

      <View style={styles.impactRow}>
        <Ionicons name="pulse-outline" size={14} color={colors.emerald} />
        <Text style={styles.impact}>{decision.impact}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          testID={`decision-accept-${decision.id}`}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAccept?.();
          }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.primaryBtnText}>{decision.recommended_action}</Text>
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
          <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconChip: {
    width: 36, height: 36, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  priorityRow: {
    marginLeft: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  priorityLabel: {
    fontSize: typography.small,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  confidence: { alignItems: 'flex-end' },
  confidenceValue: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.letter.tight,
  },
  confidenceLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    marginTop: -2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.cardTitle,
    lineHeight: 24,
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
    gap: 8,
  },
  impact: {
    color: colors.emerald,
    fontSize: typography.small,
    letterSpacing: 0.2,
  },
  actionRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.goldSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldEdge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primaryBtnText: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: typography.weight.medium,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    width: 48, height: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
});
