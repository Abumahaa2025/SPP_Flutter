import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/navigation/luxury_route.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../core/theme/premium_icons.dart';
import '../core/theme/spp_identity.dart';
import '../models/platform_data.dart';
import 'glass_card.dart';

/// مكوّنات SPP الأصلية — ليست نسخة من تطبيق آخر.
class SppScreenHeader extends StatelessWidget {
  const SppScreenHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.light = false,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;
  final bool light;

  @override
  Widget build(BuildContext context) {
    final titleColor = light ? AppColors.textDark : AppColors.textPrimary;
    final subColor = light ? AppColors.textDarkSecondary : AppColors.textSecondary;
    return Padding(
      padding: const EdgeInsets.only(bottom: SppIdentity.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: titleColor, fontSize: 26, fontWeight: FontWeight.w900, height: 1.2)),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(subtitle!, style: TextStyle(color: subColor, fontSize: 14, height: 1.4)),
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

/// إحاطة الموظف الذكي — أول ما يراه المستخدم (SPP 30%).
class EmployeeBriefingCard extends StatelessWidget {
  const EmployeeBriefingCard({super.key, required this.message, required this.onAsk});

  final String message;
  final VoidCallback onAsk;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(SppIdentity.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            AppColors.brand.withValues(alpha: 0.25),
            AppColors.bgElevated.withValues(alpha: 0.9),
          ],
        ),
        borderRadius: SppIdentity.cardRadius,
        border: Border.all(color: AppColors.brand.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.brand.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(PremiumIcons.brain, size: 14, color: AppColors.brandGlow),
                    const SizedBox(width: 6),
                    Text('UNIFIED BRAIN', style: AppTypography.englishCaps.copyWith(fontSize: 8, color: AppColors.brandGlow)),
                  ],
                ),
              ),
              const Spacer(),
              const _LiveDot(),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            message,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, height: 1.6, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: onAsk,
            child: Row(
              children: [
                Text('تحدّث مع الموظف', style: TextStyle(color: AppColors.copperLight, fontWeight: FontWeight.w800, fontSize: 14)),
                const SizedBox(width: 6),
                Icon(PremiumIcons.arrow, size: 14, color: AppColors.copperLight),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: SppIdentity.normal).slideY(begin: 0.04, curve: SppIdentity.ease);
  }
}

class _LiveDot extends StatefulWidget {
  const _LiveDot();

  @override
  State<_LiveDot> createState() => _LiveDotState();
}

class _LiveDotState extends State<_LiveDot> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ScaleTransition(
            scale: Tween<double>(begin: 0.85, end: 1.15).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut)),
            child: Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle)),
          ),
          const SizedBox(width: 6),
          const Text('LIVE', style: TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

/// قرار اليوم — Hero (Things/OmniFocus inspired layout, SPP content).
class TodayDecisionHero extends StatelessWidget {
  const TodayDecisionHero({super.key, required this.decision, this.onTap});

  final DecisionItem decision;
  final VoidCallback? onTap;

  Color get _accent {
    switch (decision.priority) {
      case DecisionPriority.high:
        return AppColors.danger;
      case DecisionPriority.medium:
        return AppColors.copper;
      case DecisionPriority.low:
        return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(SppIdentity.lg),
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          borderRadius: SppIdentity.cardRadius,
          border: Border.all(color: _accent.withValues(alpha: 0.4), width: 1.2),
          boxShadow: [
            BoxShadow(color: _accent.withValues(alpha: 0.12), blurRadius: 24, offset: const Offset(0, 8)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('قرار اليوم', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: AppColors.brandGlow)),
            Text("TODAY'S DECISION", style: AppTypography.englishCaps.copyWith(fontSize: 8, color: _accent)),
            const SizedBox(height: 10),
            Text(decision.title, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, height: 1.3)),
            const SizedBox(height: 8),
            Text(decision.subtitle, style: const TextStyle(color: AppColors.textSecondary, height: 1.5, fontSize: 14)),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              decoration: BoxDecoration(
                gradient: AppColors.copperGradient,
                borderRadius: BorderRadius.circular(SppIdentity.radiusMd),
              ),
              child: Text(decision.actionLabel, style: const TextStyle(color: AppColors.bgDeep, fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 80.ms).slideY(begin: 0.05);
  }
}

/// Virtual Sensors — شريط SPP الفريد.
class VirtualSensorStrip extends StatelessWidget {
  const VirtualSensorStrip({super.key, required this.power, required this.water, required this.whatsapp, this.powerAlert = false, this.waterAlert = false});

  final String power;
  final String water;
  final String whatsapp;
  final bool powerAlert;
  final bool waterAlert;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('حساسات افتراضية', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
        Text('VIRTUAL SENSORS', style: AppTypography.englishCaps.copyWith(fontSize: 8)),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _SensorChip(icon: PremiumIcons.power, label: 'كهرباء', value: power, alert: powerAlert),
              const SizedBox(width: 8),
              _SensorChip(icon: PremiumIcons.water, label: 'مياه', value: water, alert: waterAlert),
              const SizedBox(width: 8),
              _SensorChip(icon: PremiumIcons.chat, label: 'واتساب', value: whatsapp, alert: false),
            ],
          ),
        ),
      ],
    );
  }
}

class _SensorChip extends StatelessWidget {
  const _SensorChip({required this.icon, required this.label, required this.value, required this.alert});
  final IconData icon;
  final String label;
  final String value;
  final bool alert;

  @override
  Widget build(BuildContext context) {
    final c = alert ? AppColors.danger : AppColors.brandGlow;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(SppIdentity.radiusMd),
        border: Border.all(color: c.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: c, size: 18),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
              Text(value, style: TextStyle(color: c, fontWeight: FontWeight.w800, fontSize: 13)),
            ],
          ),
        ],
      ),
    );
  }
}

/// بطاقة وحدة SPP في مركز الذكاء.
class SppModuleTile extends StatelessWidget {
  const SppModuleTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    this.badge,
    this.accent = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final String? badge;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(SppIdentity.md),
        decoration: BoxDecoration(
          color: accent ? AppColors.brand.withValues(alpha: 0.12) : AppColors.bgElevated,
          borderRadius: SppIdentity.cardRadius,
          border: Border.all(color: accent ? AppColors.brand.withValues(alpha: 0.35) : AppColors.borderSubtle),
        ),
        child: Row(
          children: [
            PremiumIcons.inCircle(icon, gold: accent, color: accent ? null : AppColors.brandLight),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 3),
                  Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.35)),
                ],
              ),
            ),
            if (badge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppColors.copper.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                child: Text(badge!, style: const TextStyle(color: AppColors.copperLight, fontSize: 11, fontWeight: FontWeight.w800)),
              ),
            const SizedBox(width: 8),
            Icon(PremiumIcons.arrow, size: 14, color: AppColors.textMuted.withValues(alpha: 0.7)),
          ],
        ),
      ),
    );
  }
}

/// نبض العقار — مؤشر مدمج بدون إحساس Dashboard.
class PropertyPulseCard extends StatelessWidget {
  const PropertyPulseCard({super.key, required this.score, required this.level, required this.collectionRate});

  final int score;
  final String level;
  final double collectionRate;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(SppIdentity.md),
      child: Row(
        children: [
          SizedBox(
            width: 56,
            height: 56,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(value: score / 100, strokeWidth: 5, color: AppColors.brandGlow, backgroundColor: AppColors.border),
                Text('$score', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('صحة العقار', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                const Text('Property Health', style: TextStyle(color: AppColors.textMuted, fontSize: 9, letterSpacing: 0.6)),
                Text(level, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                Text('تحصيل ${collectionRate.toStringAsFixed(0)}%', style: TextStyle(color: AppColors.brandGlow, fontSize: 12, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

void pushSpp(BuildContext context, Widget page) => pushLuxury(context, page);

/// شارة اتصال المنصة — live أو محلي.
class DataConnectionBadge extends StatelessWidget {
  const DataConnectionBadge({super.key, required this.isLive, this.notice});

  final bool isLive;
  final String? notice;

  @override
  Widget build(BuildContext context) {
    final color = isLive ? AppColors.success : AppColors.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(isLive ? Icons.cloud_done_rounded : Icons.cloud_off_rounded, size: 14, color: color),
          const SizedBox(width: 6),
          Text(isLive ? 'متصل' : 'محلي', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}
