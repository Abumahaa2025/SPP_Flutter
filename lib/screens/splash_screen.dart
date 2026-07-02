import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/constants/api_constants.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/spp_identity.dart';
import '../widgets/ai_orb.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, required this.onDone});

  final VoidCallback onDone;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 2800), widget.onDone);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBackground(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.brand.withValues(alpha: 0.5)),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Text('SPP', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 4, color: AppColors.brandGlow)),
            ).animate().fadeIn().scale(begin: const Offset(0.9, 0.9)),
            const SizedBox(height: 32),
            const AiOrb(size: 120, luxury: true),
            const SizedBox(height: 28),
            Text(
              ApiConstants.appName,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ).animate().fadeIn(delay: 300.ms),
            const SizedBox(height: 8),
            Text(
              SppIdentity.brandTagline,
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12, letterSpacing: 1.5, fontWeight: FontWeight.w600),
            ).animate().fadeIn(delay: 500.ms),
            const SizedBox(height: 40),
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brandGlow.withValues(alpha: 0.8)),
            ).animate().fadeIn(delay: 700.ms),
          ],
        ),
      ),
    );
  }
}
