import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/theme/app_colors.dart';

class AiOrb extends StatelessWidget {
  const AiOrb({
    super.key,
    this.size = 120,
    this.pulsing = true,
    this.score,
  });

  final double size;
  final bool pulsing;
  final int? score;

  @override
  Widget build(BuildContext context) {
    final orb = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const RadialGradient(
          colors: [AppColors.accent, AppColors.primary, AppColors.bgDeep],
          stops: [0.1, 0.55, 1],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withValues(alpha: 0.35),
            blurRadius: 40,
            spreadRadius: 4,
          ),
        ],
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.psychology_alt_rounded, color: Colors.white, size: size * 0.28),
            if (score != null) ...[
              const SizedBox(height: 4),
              Text(
                '$score%',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: size * 0.14,
                ),
              ),
            ],
          ],
        ),
      ),
    );

    if (!pulsing) return orb;

    return orb
        .animate(onPlay: (c) => c.repeat())
        .scale(
          begin: const Offset(0.96, 0.96),
          end: const Offset(1.04, 1.04),
          duration: 2.seconds,
          curve: Curves.easeInOut,
        )
        .then()
        .scale(
          begin: const Offset(1.04, 1.04),
          end: const Offset(0.96, 0.96),
          duration: 2.seconds,
          curve: Curves.easeInOut,
        );
  }
}

class AnimatedBackground extends StatelessWidget {
  const AnimatedBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(decoration: BoxDecoration(gradient: AppColors.heroGradient)),
        Positioned(
          top: -80,
          right: -60,
          child: _GlowBlob(size: 220, color: AppColors.primary.withValues(alpha: 0.25)),
        ),
        Positioned(
          bottom: 120,
          left: -40,
          child: _GlowBlob(size: 180, color: AppColors.accent.withValues(alpha: 0.12)),
        ),
        child,
      ],
    );
  }
}

class _GlowBlob extends StatelessWidget {
  const _GlowBlob({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [BoxShadow(color: color, blurRadius: size * 0.4)],
      ),
    )
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .moveY(begin: 0, end: 20, duration: 4.seconds, curve: Curves.easeInOut)
        .rotate(begin: 0, end: math.pi / 16, duration: 6.seconds);
  }
}
