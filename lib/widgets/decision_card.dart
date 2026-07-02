import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/theme/app_colors.dart';
import '../models/platform_data.dart';
import 'glass_card.dart';

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
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _accent.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(_icon, color: _accent),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  item.subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: _accent.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              item.actionLabel,
              style: TextStyle(color: _accent, fontWeight: FontWeight.w700, fontSize: 12),
            ),
          ),
        ],
      ),
    )
        .animate(delay: (80 * index).ms)
        .fadeIn(duration: 400.ms)
        .slideX(begin: 0.08, curve: Curves.easeOutCubic);
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
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textMuted,
                        ),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
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
          const SizedBox(
            width: 56,
            height: 56,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: AppColors.accent,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }
}
