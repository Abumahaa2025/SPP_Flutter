import 'package:flutter/material.dart';

class AppColors {
  static const primary = Color(0xFF0D7A72);
  static const primaryLight = Color(0xFF1A9E94);
  static const accent = Color(0xFF22D3EE);
  static const gold = Color(0xFFFBBF24);

  static const bgDeep = Color(0xFF020617);
  static const bgCard = Color(0xFF0F172A);
  static const bgElevated = Color(0xFF1E293B);
  static const border = Color(0xFF334155);

  static const textPrimary = Color(0xFFF8FAFC);
  static const textSecondary = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);

  static const danger = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);
  static const success = Color(0xFF10B981);

  static const gradientStart = Color(0xFF020617);
  static const gradientMid = Color(0xFF0F172A);
  static const gradientEnd = Color(0xFF0D4F4A);

  static LinearGradient get heroGradient => const LinearGradient(
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
        colors: [gradientStart, gradientMid, gradientEnd],
      );

  static LinearGradient get cardGradient => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          primary.withValues(alpha: 0.18),
          bgCard.withValues(alpha: 0.95),
        ],
      );
}
