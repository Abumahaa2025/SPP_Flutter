import 'package:flutter/material.dart';

class AppColors {
  // Teal accent (reference)
  static const primary = Color(0xFF0D9488);
  static const primaryGlow = Color(0xFF14B8A6);
  static const accent = Color(0xFF2DD4BF);
  static const teal = Color(0xFF0EA5A4);

  // AI purple (reference orb & banner)
  static const aiPurple = Color(0xFF7C3AED);
  static const aiBlue = Color(0xFF3B82F6);
  static const aiIndigo = Color(0xFF6366F1);

  static const gold = Color(0xFFC9A962);
  static const goldLight = Color(0xFFE8D5A3);
  static const platinum = Color(0xFFE2E8F0);

  // Dark surfaces
  static const bgDeep = Color(0xFF0B0F19);
  static const bgCard = Color(0xFF111827);
  static const bgElevated = Color(0xFF1A2332);
  static const border = Color(0xFF2A3548);

  // Light surfaces (notifications, maintenance, analytics)
  static const bgLight = Color(0xFFF4F6FA);
  static const cardLight = Color(0xFFFFFFFF);
  static const textDark = Color(0xFF0F172A);
  static const textDarkSecondary = Color(0xFF64748B);
  static const borderLight = Color(0xFFE2E8F0);

  static const textPrimary = Color(0xFFF8FAFC);
  static const textSecondary = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);

  static const danger = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);
  static const success = Color(0xFF10B981);
  static const info = Color(0xFF3B82F6);

  static LinearGradient get heroGradient => const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF0B1220), Color(0xFF0F172A), Color(0xFF0B0F19)],
      );

  static LinearGradient get cityGradient => const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF0B0F19)],
      );

  static LinearGradient get aiBannerGradient => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF7C3AED), Color(0xFF4F46E5), Color(0xFF2563EB)],
      );

  static LinearGradient get aiScreenGradient => const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF0B0F19)],
      );

  static LinearGradient get goldGradient => const LinearGradient(
        colors: [goldLight, gold, Color(0xFF8B6914)],
      );

  static RadialGradient get orbGradient => const RadialGradient(
        colors: [Color(0xFF93C5FD), Color(0xFF6366F1), Color(0xFF7C3AED), Color(0xFF1E1B4B)],
        stops: [0, 0.3, 0.65, 1],
      );

  static LinearGradient get cardGradient => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          primary.withValues(alpha: 0.18),
          bgCard.withValues(alpha: 0.92),
        ],
      );

  static LinearGradient get tealButton => const LinearGradient(
        colors: [Color(0xFF14B8A6), Color(0xFF0D9488)],
      );
}
