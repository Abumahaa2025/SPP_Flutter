import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/constants/api_constants.dart';
import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/ai_orb.dart';
import '../widgets/decision_card.dart';
import '../widgets/glass_card.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();

    return AnimatedBackground(
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Center(child: AiOrb(size: 140)),
              const SizedBox(height: 28),
              Text(
                ApiConstants.appName,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                    ),
              ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.1),
              const SizedBox(height: 10),
              Text(
                'موظفك العقاري الذكي — ليس مجرد برنامج إدارة',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ).animate(delay: 150.ms).fadeIn(),
              const SizedBox(height: 32),
              GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _FeatureRow(icon: Icons.psychology, text: 'Unified Brain — قرارات ذكية'),
                    _FeatureRow(icon: Icons.sensors, text: 'Virtual Sensors — مراقبة لحظية'),
                    _FeatureRow(icon: Icons.auto_awesome, text: 'Property Memory — ذاكرة العقار'),
                  ],
                ),
              ).animate(delay: 250.ms).fadeIn().slideY(begin: 0.05),
              const Spacer(),
              if (app.state == AppLoadState.error) ...[
                GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Text(
                    app.errorMessage ?? 'تعذر الاتصال بالمنصة',
                    style: const TextStyle(color: AppColors.danger),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (app.isLoading)
                const LoadingBrain(message: 'جاري الاتصال بالمنصة...')
              else
                FilledButton(
                  onPressed: () => context.read<AppState>().connect(),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('تفعيل الموظف الذكي', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                ).animate(delay: 350.ms).fadeIn(),
              const SizedBox(height: 12),
              Text(
                'يتصل مباشرة بمنصة SPP — بيانات حقيقية فقط',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  const _FeatureRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, color: AppColors.accent, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}
