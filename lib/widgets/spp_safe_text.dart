import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';

/// نص آمن — لا overflow على الشاشات الصغيرة.
class SppSafeText extends StatelessWidget {
  const SppSafeText(
    this.text, {
    super.key,
    this.style,
    this.maxLines = 2,
    this.minFontSize = 10,
    this.textAlign,
    this.color,
    this.fontWeight,
  });

  final String text;
  final TextStyle? style;
  final int maxLines;
  final double minFontSize;
  final TextAlign? textAlign;
  final Color? color;
  final FontWeight? fontWeight;

  @override
  Widget build(BuildContext context) {
    return AutoSizeText(
      text,
      style: style?.copyWith(color: color, fontWeight: fontWeight) ?? TextStyle(color: color, fontWeight: fontWeight),
      maxLines: maxLines,
      minFontSize: minFontSize,
      overflow: TextOverflow.ellipsis,
      textAlign: textAlign,
    );
  }
}

/// عنوان عربي رئيسي + إنجليزي ثانوي صغير.
class SppBilingualHeader extends StatelessWidget {
  const SppBilingualHeader({
    super.key,
    required this.titleAr,
    this.titleEn,
    this.subtitle,
  });

  final String titleAr;
  final String? titleEn;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SppSafeText(titleAr, maxLines: 2, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, height: 1.2)),
        if (titleEn != null) ...[
          const SizedBox(height: 2),
          Text(titleEn!, style: const TextStyle(color: Color(0xFF64748B), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2)),
        ],
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          SppSafeText(subtitle!, maxLines: 3, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13, height: 1.45)),
        ],
      ],
    );
  }
}
