import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/theme/app_colors.dart';
import '../models/platform_data.dart';
import 'glass_card.dart';
import 'living_ai_orb.dart';

class DecisionCard extends StatelessWidget {
  const DecisionCard({
    super.key,
    required this.item,
    this.onTap,
    this.index = 0,
  });

  final DecisionItem item;
  final VoidCallback? onTap;
  final int index;

  Color get _accent {
    switch (item.priority) {
      case DecisionPriority.high:
        return AppColors.danger;
      case DecisionPriority.medium:
        return AppColors.warning;
      case DecisionPriority.low:
        return AppColors.success;
    }
  }

  IconData get _icon {
    switch (item.icon) {
      case IconsInsight.risk:
        return Icons.warning_amber_rounded;
      case IconsInsight.payment:
        return Icons.payments_outlined;
      case IconsInsight.contract:
        return Icons.description_outlined;
      case IconsInsight.maintenance:
        return Icons.handyman_outlined;
      case IconsInsight.health:
        return Icons.favorite_outline;
      case IconsInsight.calm:
        return Icons.verified_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      luxury: item.priority == DecisionPriority.high,
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [_accent.withValues(alpha: 0.25), _accent.withValues(alpha: 0.08)],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _accent.withValues(alpha: 0.35)),
            ),
            child: Icon(_icon, color: _accent, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  item.subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              gradient: item.priority == DecisionPriority.high
                  ? LinearGradient(colors: [_accent.withValues(alpha: 0.3), _accent.withValues(alpha: 0.1)])
                  : null,
              color: item.priority == DecisionPriority.high ? null : _accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Text(
              item.actionLabel,
              style: TextStyle(color: _accent, fontWeight: FontWeight.w800, fontSize: 12),
            ),
          ),
        ],
      ),
    )
        .animate(delay: (70 * index).ms)
        .fadeIn(duration: 450.ms)
        .slideX(begin: 0.06, curve: Curves.easeOutCubic);
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14, top: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShaderMask(
                  shaderCallback: (b) => AppColors.goldGradient.createShader(b),
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textMuted),
                  ),
                ],
              ],
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

class LoadingBrain extends StatelessWidget {
  const LoadingBrain({super.key, this.message = 'جاري تفعيل العقل الموحد...'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const LivingAiOrb(size: 88, luxury: true),
          const SizedBox(height: 24),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
