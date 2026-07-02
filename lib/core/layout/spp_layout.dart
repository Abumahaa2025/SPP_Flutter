import 'package:flutter/material.dart';

/// مسافات موحدة — تمنع تغطية Bottom Navigation للمحتوى.
class SppLayout {
  static const double bottomNavClearance = 128;
  static const double fabClearance = 148;

  static EdgeInsets screenPadding({double top = 16, bool withFab = false}) => EdgeInsets.fromLTRB(
        20,
        top,
        20,
        withFab ? fabClearance : bottomNavClearance,
      );

  static EdgeInsets listPadding({bool light = false}) => EdgeInsets.fromLTRB(
        20,
        light ? 16 : 12,
        20,
        bottomNavClearance,
      );
}
