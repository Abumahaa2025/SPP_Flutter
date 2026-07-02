import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/glass_card.dart';
import '../widgets/reference_widgets.dart';

class PropertyMapScreen extends StatefulWidget {
  const PropertyMapScreen({super.key});

  @override
  State<PropertyMapScreen> createState() => _PropertyMapScreenState();
}

class _PropertyMapScreenState extends State<PropertyMapScreen> {
  int _filter = 0;
  static const _filters = ['الكل', 'سكني', 'تجاري', 'مكتبي'];

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    final name = data?.propertyName ?? 'مجمع كويل السكني';
    final score = data?.propertyHealth.score ?? 94;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('خريطة العقارات'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          Container(color: const Color(0xFF0F172A)),
          CustomPaint(painter: _MapGridPainter(), size: Size.infinite),
          ...List.generate(6, (i) {
            return Positioned(
              left: 40.0 + i * 55,
              top: 180.0 + (i % 3) * 80,
              child: Icon(Icons.location_on_rounded, color: AppColors.teal, size: 32),
            );
          }),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, kToolbarHeight, 20, 0),
              child: FilterPills(labels: _filters, selected: _filter, onSelected: (i) => setState(() => _filter = i)),
            ),
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 32,
            child: GlassCard(
              blur: 16,
              luxury: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _MapStat(label: 'الأداء', value: '$score%'),
                      const SizedBox(width: 20),
                      _MapStat(label: 'الدخل الشهري', value: '4.5M'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(value: score / 100, minHeight: 6, color: AppColors.teal, backgroundColor: AppColors.border),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapStat extends StatelessWidget {
  const _MapStat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        Text(value, style: const TextStyle(color: AppColors.teal, fontWeight: FontWeight.w900, fontSize: 18)),
      ],
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.border.withValues(alpha: 0.15)
      ..strokeWidth = 1;
    const step = 40.0;
    for (var x = 0.0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
    final road = Paint()
      ..color = AppColors.border.withValues(alpha: 0.3)
      ..strokeWidth = 3;
    canvas.drawLine(Offset(0, size.height * 0.5), Offset(size.width, size.height * 0.45), road);
    canvas.drawLine(Offset(size.width * 0.35, 0), Offset(size.width * 0.4, size.height), road);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
