import 'package:flutter/material.dart';

/// SPP Original Palette — احترافي، دافئ، ذكي. ليس نسخة من أي تطبيق.
class AppColors {
  // SPP Signature
  static const brand = Color(0xFF0F6B5C); // Forest — الثقة والذكاء
  static const brandLight = Color(0xFF14A38D);
  static const brandGlow = Color(0xFF1EC9A8);
  static const copper = Color(0xFFC4873B); // قرارات وإجراءات
  static const copperLight = Color(0xFFE8B86A);

  // Aliases (backward compat)
  static const primary = brand;
  static const primaryGlow = brandGlow;
  static const accent = brandLight;
  static const teal = brand;
  static const gold = copper;
  static const goldLight = copperLight;
  static const platinum = Color(0xFFE8ECF2);

  // Intelligence accent (subtle, not purple clone)
  static const intelligence = Color(0xFF3D6B8E);
  static const intelligenceGlow = Color(0xFF5B8FB9);
  static const aiPurple = intelligence;
  static const aiBlue = intelligenceGlow;
  static const aiIndigo = Color(0xFF4A7C9B);

  // Surfaces — dark professional
  static const bgDeep = Color(0xFF080C14);
  static const bgCard = Color(0xFF0F1520);
  static const bgElevated = Color(0xFF161E2E);
  static const bgSurface = Color(0xFF1C2638);
  static const border = Color(0xFF2A3548);
  static const borderSubtle = Color(0xFF1E2838);

  // Light mode surfaces
  static const bgLight = Color(0xFFF5F7FA);
  static const cardLight = Color(0xFFFFFFFF);
  static const textDark = Color(0xFF0C1220);
  static const textDarkSecondary = Color(0xFF5C6B7F);
  static const borderLight = Color(0xFFE4E9F0);

  // Text
  static const textPrimary = Color(0xFFF4F6FA);
  static const textSecondary = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);

  // Semantic
  static const danger = Color(0xFFE05252);
  static const warning = Color(0xFFE5A020);
  static const success = Color(0xFF1AAB7A);
  static const info = Color(0xFF3B82F6);

  // Gradients — SPP original
  static LinearGradient get heroGradient => const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF0A1018), Color(0xFF0F1520), Color(0xFF080C14)],
      );

  static LinearGradient get brandGradient => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [brandLight, brand],
      );

  static LinearGradient get copperGradient => const LinearGradient(
        colors: [copperLight, copper, Color(0xFF9A6528)],
      );

  static LinearGradient get goldGradient => copperGradient;

  static LinearGradient get intelligenceGradient => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [intelligenceGlow, intelligence, Color(0xFF2A4A62)],
      );

  static LinearGradient get aiBannerGradient => intelligenceGradient;
  static LinearGradient get aiScreenGradient => heroGradient;
  static LinearGradient get cityGradient => heroGradient;
  static LinearGradient get tealButton => brandGradient;

  static RadialGradient get orbGradient => const RadialGradient(
        colors: [brandGlow, brandLight, brand, bgDeep],
        stops: [0, 0.35, 0.7, 1],
      );

  static LinearGradient get cardGradient => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [brand.withValues(alpha: 0.12), bgCard.withValues(alpha: 0.95)],
      );

  static LinearGradient get luxuryBorder => LinearGradient(
        colors: [copper.withValues(alpha: 0.4), brand.withValues(alpha: 0.2), Colors.transparent],
      );
}
