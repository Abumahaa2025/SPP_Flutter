import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';

/// Living AI Orb — pulse, rotation, halo. Feels alive.
class LivingAiOrb extends StatefulWidget {
  const LivingAiOrb({
    super.key,
    this.size = 120,
    this.score,
    this.heroTag,
    this.luxury = true,
  });

  final double size;
  final int? score;
  final String? heroTag;
  final bool luxury;

  @override
  State<LivingAiOrb> createState() => _LivingAiOrbState();
}

class _LivingAiOrbState extends State<LivingAiOrb> with TickerProviderStateMixin {
  late final AnimationController _pulse;
  late final AnimationController _rotate;
  late final AnimationController _halo;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400))..repeat(reverse: true);
    _rotate = AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();
    _halo = AnimationController(vsync: this, duration: const Duration(seconds: 4))..repeat();
  }

  @override
  void dispose() {
    _pulse.dispose();
    _rotate.dispose();
    _halo.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;
    Widget orb = AnimatedBuilder(
      animation: Listenable.merge([_pulse, _rotate, _halo]),
      builder: (context, _) {
        final pulse = 0.94 + _pulse.value * 0.08;
        final haloOpacity = 0.15 + _halo.value * 0.25;

        return SizedBox(
          width: size * 1.5,
          height: size * 1.5,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Outer halo
              Transform.rotate(
                angle: _rotate.value * math.pi * 2,
                child: Container(
                  width: size * 1.4 * pulse,
                  height: size * 1.4 * pulse,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: SweepGradient(
                      colors: [
                        AppColors.brandGlow.withValues(alpha: haloOpacity),
                        AppColors.copper.withValues(alpha: haloOpacity * 0.6),
                        Colors.transparent,
                        AppColors.brandLight.withValues(alpha: haloOpacity * 0.7),
                        AppColors.brandGlow.withValues(alpha: haloOpacity),
                      ],
                    ),
                  ),
                ),
              ),
              // Ring 1
              Transform.rotate(
                angle: -_rotate.value * math.pi * 2 * 0.7,
                child: Container(
                  width: size * 1.22,
                  height: size * 1.22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.2 + _pulse.value * 0.15),
                      width: 1.5,
                    ),
                  ),
                ),
              ),
              // Ring 2 dashed feel
              Transform.rotate(
                angle: _rotate.value * math.pi * 2 * 1.3,
                child: CustomPaint(
                  size: Size(size * 1.1, size * 1.1),
                  painter: _OrbitPainter(progress: _rotate.value),
                ),
              ),
              // Core
              Transform.scale(
                scale: pulse,
                child: Container(
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.orbGradient,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.brandGlow.withValues(alpha: 0.5),
                        blurRadius: 50,
                        spreadRadius: 6,
                      ),
                      BoxShadow(
                        color: AppColors.copper.withValues(alpha: 0.2),
                        blurRadius: 30,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 1, sigmaY: 1),
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(PremiumIcons.brain, color: Colors.white, size: size * 0.28),
                            if (widget.score != null) ...[
                              const SizedBox(height: 2),
                              ShaderMask(
                                shaderCallback: (b) => AppColors.goldGradient.createShader(b),
                                child: Text(
                                  '${widget.score}%',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: size * 0.14,
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
              ),
            ],
          ),
        );
      },
    );

    if (widget.heroTag != null) {
      orb = Hero(tag: widget.heroTag!, child: orb);
    }
    return orb;
  }
}

class _OrbitPainter extends CustomPainter {
  _OrbitPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final paint = Paint()
      ..color = AppColors.accent.withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;

    const dots = 8;
    for (var i = 0; i < dots; i++) {
      final angle = (i / dots) * math.pi * 2 + progress * math.pi * 2;
      final p = center + Offset(math.cos(angle) * radius, math.sin(angle) * radius);
      canvas.drawCircle(p, 2.5, paint..color = AppColors.accent.withValues(alpha: 0.2 + (i / dots) * 0.4));
    }
  }

  @override
  bool shouldRepaint(covariant _OrbitPainter oldDelegate) => oldDelegate.progress != progress;
}

/// Legacy wrapper.
class AiOrb extends StatelessWidget {
  const AiOrb({
    super.key,
    this.size = 120,
    this.pulsing = true,
    this.score,
    this.luxury = false,
    this.heroTag,
  });

  final double size;
  final bool pulsing;
  final int? score;
  final bool luxury;
  final String? heroTag;

  @override
  Widget build(BuildContext context) {
    return LivingAiOrb(
      size: size,
      score: score,
      luxury: luxury,
      heroTag: heroTag,
    );
  }
}
