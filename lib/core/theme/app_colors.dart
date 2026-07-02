import 'package:flutter/material.dart';

class AppColors {
  // Luxury palette
  static const primary = Color(0xFF0A6B64);
  static const primaryGlow = Color(0xFF14B8A6);
  static const accent = Color(0xFF22D3EE);
  static const gold = Color(0xFFC9A962);
  static const goldLight = Color(0xFFE8D5A3);
  static const platinum = Color(0xFFE2E8F0);

  static const bgDeep = Color(0xFF010409);
  static const bgCard = Color(0xFF0A0F1A);
  static const bgElevated = Color(0xFF131B2E);
  static const border = Color(0xFF2A3548);
  static const glass = Color(0x14FFFFFF);

  static const textPrimary = Color(0xFFF8FAFC);
  static const textSecondary = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);

  static const danger = Color(0xFFFF4D6A);
  static const warning = Color(0xFFFFB020);
  static const success = Color(0xFF00D68F);

  static LinearGradient get heroGradient => const LinearGradient(
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
        colors: [Color(0xFF010409), Color(0xFF0A1628), Color(0xFF0A3D38)],
        stops: [0, 0.55, 1],
      );

  static LinearGradient get goldGradient => const LinearGradient(
        colors: [goldLight, gold, Color(0xFF8B6914)],
      );

  static RadialGradient get orbGradient => const RadialGradient(
        colors: [accent, primaryGlow, primary, bgDeep],
        stops: [0, 0.35, 0.7, 1],
      );

  static LinearGradient get cardGradient => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          primary.withValues(alpha: 0.22),
          bgCard.withValues(alpha: 0.88),
          bgDeep.withValues(alpha: 0.95),
        ],
      );

  static LinearGradient get luxuryBorder => LinearGradient(
        colors: [
          gold.withValues(alpha: 0.4),
          accent.withValues(alpha: 0.2),
          Colors.transparent,
        ],
      );
}
