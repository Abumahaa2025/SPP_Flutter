import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

/// Animated mesh gradient — slow drift + dynamic lighting.
class MeshAnimatedBackground extends StatefulWidget {
  const MeshAnimatedBackground({super.key, required this.child});

  final Widget child;

  @override
  State<MeshAnimatedBackground> createState() => _MeshAnimatedBackgroundState();
}

class _MeshAnimatedBackgroundState extends State<MeshAnimatedBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 18),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return CustomPaint(
              painter: _MeshPainter(t: _controller.value),
              size: Size.infinite,
            );
          },
        ),
        CustomPaint(painter: _GridPainter(), size: Size.infinite),
        widget.child,
      ],
    );
  }
}

class _MeshPainter extends CustomPainter {
  _MeshPainter({required this.t});

  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = AppColors.bgDeep,
    );

    final blobs = [
      _Blob(AppColors.primaryGlow, Offset(size.width * (0.75 + 0.08 * math.sin(t * math.pi * 2)), size.height * (0.12 + 0.05 * math.cos(t * math.pi * 2))), size.width * 0.55),
      _Blob(AppColors.accent, Offset(size.width * (0.15 + 0.06 * math.cos(t * math.pi * 2 + 1)), size.height * (0.35 + 0.07 * math.sin(t * math.pi * 2 + 0.5))), size.width * 0.45),
      _Blob(AppColors.gold, Offset(size.width * (0.5 + 0.1 * math.sin(t * math.pi * 2 + 2)), size.height * (0.78 + 0.04 * math.cos(t * math.pi * 2))), size.width * 0.38),
      _Blob(const Color(0xFF1E3A5F), Offset(size.width * 0.9, size.height * (0.55 + 0.06 * math.sin(t * math.pi * 2))), size.width * 0.35),
    ];

    for (final blob in blobs) {
      final paint = Paint()
        ..shader = RadialGradient(
          colors: [
            blob.color.withValues(alpha: 0.28),
            blob.color.withValues(alpha: 0.06),
            Colors.transparent,
          ],
          stops: const [0, 0.45, 1],
        ).createShader(Rect.fromCircle(center: blob.center, radius: blob.radius));
      canvas.drawCircle(blob.center, blob.radius, paint);
    }

    // Vignette
    final vignette = Paint()
      ..shader = RadialGradient(
        colors: [Colors.transparent, AppColors.bgDeep.withValues(alpha: 0.85)],
        radius: 1.1,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), vignette);
  }

  @override
  bool shouldRepaint(covariant _MeshPainter oldDelegate) => oldDelegate.t != t;
}

class _Blob {
  const _Blob(this.color, this.center, this.radius);
  final Color color;
  final Offset center;
  final double radius;
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.border.withValues(alpha: 0.04)
      ..strokeWidth = 0.5;
    const step = 48.0;
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

/// Backward-compatible alias.
class AnimatedBackground extends StatelessWidget {
  const AnimatedBackground({super.key, required this.child, this.luxury = true});

  final Widget child;
  final bool luxury;

  @override
  Widget build(BuildContext context) {
    return MeshAnimatedBackground(child: child);
  }
}
