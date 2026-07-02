import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Typography scale — Arabic + English harmony.
class AppTypography {
  static TextTheme cairo(TextTheme base) {
    final cairo = GoogleFonts.cairoTextTheme(base);
    return cairo.copyWith(
      displayLarge: cairo.displayLarge?.copyWith(
        fontWeight: FontWeight.w900,
        letterSpacing: -1.2,
        height: 1.15,
      ),
      displayMedium: cairo.displayMedium?.copyWith(
        fontWeight: FontWeight.w900,
        letterSpacing: -0.8,
        height: 1.2,
      ),
      headlineLarge: cairo.headlineLarge?.copyWith(
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
        height: 1.25,
      ),
      headlineMedium: cairo.headlineMedium?.copyWith(
        fontWeight: FontWeight.w800,
        height: 1.3,
      ),
      titleLarge: cairo.titleLarge?.copyWith(fontWeight: FontWeight.w700, height: 1.35),
      titleMedium: cairo.titleMedium?.copyWith(fontWeight: FontWeight.w700, height: 1.35),
      titleSmall: cairo.titleSmall?.copyWith(fontWeight: FontWeight.w600, height: 1.4),
      bodyLarge: cairo.bodyLarge?.copyWith(height: 1.6, fontSize: 16),
      bodyMedium: cairo.bodyMedium?.copyWith(height: 1.55, fontSize: 14),
      bodySmall: cairo.bodySmall?.copyWith(height: 1.5, fontSize: 12),
      labelLarge: cairo.labelLarge?.copyWith(fontWeight: FontWeight.w700, letterSpacing: 0.2),
      labelSmall: cairo.labelSmall?.copyWith(
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
        fontSize: 11,
      ),
    );
  }

  static TextStyle get englishCaps => GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 2.8,
        color: AppColors.copper,
      );

  static TextStyle get metric => GoogleFonts.cairo(
        fontSize: 32,
        fontWeight: FontWeight.w900,
        height: 1,
        color: AppColors.textPrimary,
      );
}
