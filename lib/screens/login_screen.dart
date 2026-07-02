import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/constants/api_constants.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
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
              const Align(alignment: Alignment.centerLeft, child: LuxuryBadge(label: 'PRO')),
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
                  children: const [
                    _Row(icon: PremiumIcons.brain, text: 'عقل موحد لإدارة العقار'),
                    _Row(icon: PremiumIcons.sensor, text: 'مراقبة ذكية للحساسات'),
                    _Row(icon: PremiumIcons.memory, text: 'ذاكرة عقارية تتعلم معك'),
                  ],
                ),
              ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.06),
              const Spacer(flex: 3),
              LuxuryButton(
                label: 'إيقاظ الموظف الذكي',
                icon: PremiumIcons.decision,
                onPressed: () => context.read<AppState>().enterExperience(),
              ).animate().fadeIn(delay: 650.ms),
              const SizedBox(height: 20),
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
