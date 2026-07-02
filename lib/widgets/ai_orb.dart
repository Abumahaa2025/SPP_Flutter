import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/theme/app_colors.dart';

class AiOrb extends StatelessWidget {
  const AiOrb({
    super.key,
    this.size = 120,
    this.pulsing = true,
    this.score,
    this.luxury = false,
  });

  final double size;
  final bool pulsing;
  final int? score;
  final bool luxury;

  @override
  Widget build(BuildContext context) {
    final core = Stack(
      alignment: Alignment.center,
      children: [
        if (luxury) ...[
          _Ring(size: size * 1.35, color: AppColors.gold.withValues(alpha: 0.25), delay: 0),
          _Ring(size: size * 1.2, color: AppColors.accent.withValues(alpha: 0.2), delay: 400),
        ],
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.orbGradient,
            boxShadow: [
              BoxShadow(
                color: AppColors.accent.withValues(alpha: luxury ? 0.5 : 0.35),
                blurRadius: luxury ? 60 : 40,
                spreadRadius: luxury ? 8 : 4,
              ),
              if (luxury)
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.2),
                  blurRadius: 30,
                  spreadRadius: 2,
                ),
            ],
          ),
          child: ClipOval(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 0.5, sigmaY: 0.5),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.hub_outlined,
                      color: Colors.white.withValues(alpha: 0.95),
                      size: size * 0.26,
                    ),
                    if (score != null) ...[
                      const SizedBox(height: 2),
                      ShaderMask(
                        shaderCallback: (b) => AppColors.goldGradient.createShader(b),
                        child: Text(
                          '$score%',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: size * 0.13,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );

    if (!pulsing) return core;

    return core
        .animate(onPlay: (c) => c.repeat())
        .scale(
          begin: const Offset(0.97, 0.97),
          end: const Offset(1.03, 1.03),
          duration: 2.4.seconds,
          curve: Curves.easeInOut,
        )
        .then()
        .scale(
          begin: const Offset(1.03, 1.03),
          end: const Offset(0.97, 0.97),
          duration: 2.4.seconds,
          curve: Curves.easeInOut,
        );
  }
}

class _Ring extends StatelessWidget {
  const _Ring({required this.size, required this.color, required this.delay});

  final double size;
  final Color color;
  final int delay;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: color, width: 1.5),
      ),
    )
        .animate(onPlay: (c) => c.repeat())
        .scale(
          begin: const Offset(0.92, 0.92),
          end: const Offset(1.08, 1.08),
          duration: 3.seconds,
          delay: delay.ms,
        )
        .fade(begin: 0.3, end: 0.8, duration: 3.seconds, delay: delay.ms);
  }
}

class AnimatedBackground extends StatelessWidget {
  const AnimatedBackground({super.key, required this.child, this.luxury = true});

  final Widget child;
  final bool luxury;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(decoration: BoxDecoration(gradient: AppColors.heroGradient)),
        if (luxury) ...[
          Positioned(top: -100, right: -80, child: _GlowBlob(size: 280, color: AppColors.primaryGlow.withValues(alpha: 0.18))),
          Positioned(top: 200, left: -120, child: _GlowBlob(size: 240, color: AppColors.gold.withValues(alpha: 0.08))),
          Positioned(bottom: -60, right: 40, child: _GlowBlob(size: 200, color: AppColors.accent.withValues(alpha: 0.1))),
        ] else ...[
          Positioned(top: -80, right: -60, child: _GlowBlob(size: 220, color: AppColors.primary.withValues(alpha: 0.25))),
          Positioned(bottom: 120, left: -40, child: _GlowBlob(size: 180, color: AppColors.accent.withValues(alpha: 0.12))),
        ],
        // Subtle grid overlay
        CustomPaint(painter: _GridPainter(), size: Size.infinite),
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
        boxShadow: [BoxShadow(color: color, blurRadius: size * 0.45)],
      ),
    )
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .moveY(begin: 0, end: 24, duration: 5.seconds, curve: Curves.easeInOut)
        .rotate(begin: 0, end: math.pi / 12, duration: 8.seconds);
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.border.withValues(alpha: 0.06)
      ..strokeWidth = 0.5;
    const step = 40.0;
    for (var x = 0.0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
