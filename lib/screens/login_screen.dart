import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/constants/api_constants.dart';
import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/ai_orb.dart';
import '../widgets/glass_card.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBackground(
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Align(alignment: Alignment.centerLeft, child: LuxuryBadge(label: 'EXPERIENCE PRO')),
              const Spacer(flex: 2),
              const Center(child: AiOrb(size: 150, luxury: true)),
              const SizedBox(height: 36),
              Text(
                ApiConstants.appName,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      height: 1.2,
                    ),
              ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 12),
              Text(
                'منصة ذكاء اصطناعي لإدارة العقارات\nموظفك الذكي جاهز للعمل',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.7,
                    ),
              ).animate().fadeIn(delay: 350.ms),
              const SizedBox(height: 28),
              GlassCard(
                luxury: true,
                child: Column(
                  children: [
                    _Row(icon: Icons.hub, text: 'Unified Brain — عقل موحد'),
                    _Row(icon: Icons.sensors, text: 'Virtual Sensors — حساسات افتراضية'),
                    _Row(icon: Icons.auto_awesome, text: 'Property Memory — ذاكرة العقار'),
                  ],
                ),
              ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.06),
              const Spacer(flex: 3),
              LuxuryButton(
                label: 'إيقاظ الموظف الذكي',
                icon: Icons.bolt_rounded,
                onPressed: () => context.read<AppState>().enterExperience(),
              ).animate().fadeIn(delay: 650.ms),
              const SizedBox(height: 14),
              Text(
                'واجهة عرض فاخرة — بدون ربط Backend حالياً',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textMuted),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: AppColors.gold, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          ),
        ],
      ),
    );
  }
}
