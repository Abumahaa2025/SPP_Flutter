import 'package:flutter/material.dart';

/// SPP Design System — هوية أصلية، 70% أفضل ممارسات عالمية + 30% ميزات المنصة.
class SppIdentity {
  // Spacing (8pt grid — Stripe/Linear standard)
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;

  // Radius
  static const double radiusSm = 12;
  static const double radiusMd = 16;
  static const double radiusLg = 22;
  static const double radiusXl = 28;

  // Motion (purposeful, not flashy)
  static const Duration fast = Duration(milliseconds: 200);
  static const Duration normal = Duration(milliseconds: 320);
  static const Duration slow = Duration(milliseconds: 480);
  static const Curve ease = Curves.easeOutCubic;

  // Brand
  static const String brandShort = 'SPP';
  static const String brandTagline = 'Smart Property Platform';
  static const String employeeTitle = 'موظفك العقاري الذكي';

  static BorderRadius get cardRadius => BorderRadius.circular(radiusLg);
  static EdgeInsets get screenPadding => const EdgeInsets.symmetric(horizontal: 20);
}
