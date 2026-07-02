import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../core/theme/premium_icons.dart';
import '../models/platform_data.dart';
import 'glass_card.dart';

/// Hero decision — largest, first action.
class HeroDecisionCard extends StatelessWidget {
  const HeroDecisionCard({super.key, required this.item, this.onTap});

  final DecisionItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [
                  AppColors.primary.withValues(alpha: 0.45),
                  AppColors.bgCard.withValues(alpha: 0.92),
                  AppColors.gold.withValues(alpha: 0.12),
                ],
              ),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.4), width: 1.2),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primaryGlow.withValues(alpha: 0.2),
                  blurRadius: 40,
                  offset: const Offset(0, 16),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    PremiumIcons.inCircle(PremiumIcons.decision, gold: true),
                    const SizedBox(width: 12),
                    Text('قرارك الأول الآن', style: AppTypography.englishCaps.copyWith(fontSize: 9)),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  item.title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                        height: 1.25,
                      ),
                ),
                const SizedBox(height: 10),
                Text(
                  item.subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.55,
                      ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      decoration: BoxDecoration(
                        gradient: AppColors.goldGradient,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        item.actionLabel,
                        style: const TextStyle(
                          color: AppColors.bgDeep,
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Icon(PremiumIcons.arrow, color: AppColors.gold.withValues(alpha: 0.7), size: 18),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.08, curve: Curves.easeOutCubic);
  }
}

/// Compact horizontal metric chip.
class CompactMetricCard extends StatelessWidget {
  const CompactMetricCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.color,
    this.index = 0,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color? color;
  final int index;

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.accent;
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: c, size: 20),
          const Spacer(),
          Text(value, style: AppTypography.metric.copyWith(fontSize: 22)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
        ],
      ),
    )
        .animate(delay: (80 * index).ms)
        .fadeIn()
        .slideY(begin: 0.06);
  }
}

/// Wide insight strip — horizontal layout.
class WideInsightCard extends StatelessWidget {
  const WideInsightCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.onTap,
    this.accent = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback? onTap;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      luxury: accent,
      onTap: onTap,
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          PremiumIcons.inCircle(icon, gold: accent),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Icon(PremiumIcons.arrow, size: 14, color: AppColors.textMuted.withValues(alpha: 0.8)),
        ],
      ),
    );
  }
}

/// Small sensor pill.
class SensorPill extends StatelessWidget {
  const SensorPill({super.key, required this.label, required this.value, required this.alert});

  final String label;
  final String value;
  final bool alert;

  @override
  Widget build(BuildContext context) {
    final c = alert ? AppColors.danger : AppColors.success;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 6, height: 6, decoration: BoxDecoration(color: c, shape: BoxShape.circle)),
          const SizedBox(width: 8),
          Text('$label · $value', style: TextStyle(color: c, fontWeight: FontWeight.w700, fontSize: 12)),
        ],
      ),
    );
  }
}
