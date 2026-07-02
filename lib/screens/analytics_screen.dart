import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/reference_widgets.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    final revenue = data.propertyHealth.netProfit * 17;
    final occupancy = (data.dashboard.summary.rented / data.dashboard.summary.totalUnits * 100);
    final collection = data.report.collectionRate;

    return ColoredBox(
      color: AppColors.bgLight,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          const Text(
            'تحليلات الأداء',
            style: TextStyle(color: AppColors.textDark, fontSize: 24, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.cardLight,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 20, offset: const Offset(0, 8)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('إجمالي الإيرادات', style: TextStyle(color: AppColors.textDarkSecondary, fontSize: 14)),
                const SizedBox(height: 8),
                Text(
                  _formatRevenue(revenue.toDouble()),
                  style: const TextStyle(color: AppColors.textDark, fontSize: 32, fontWeight: FontWeight.w900),
                ),
                Row(
                  children: [
                    const Icon(Icons.trending_up_rounded, color: AppColors.success, size: 18),
                    const SizedBox(width: 4),
                    Text('+8.4%', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w800)),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 60,
                  child: LineChart(
                    LineChartData(
                      gridData: const FlGridData(show: false),
                      titlesData: const FlTitlesData(show: false),
                      borderData: FlBorderData(show: false),
                      lineBarsData: [
                        LineChartBarData(
                          spots: const [FlSpot(0, 3), FlSpot(1, 4), FlSpot(2, 3.5), FlSpot(3, 5), FlSpot(4, 4.8), FlSpot(5, 6)],
                          isCurved: true,
                          color: AppColors.teal,
                          barWidth: 3,
                          dotData: const FlDotData(show: false),
                          belowBarData: BarAreaData(
                            show: true,
                            color: AppColors.teal.withValues(alpha: 0.15),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: RingProgress(label: 'نسبة الإشغال', value: occupancy, color: AppColors.teal)),
              const SizedBox(width: 12),
              Expanded(child: RingProgress(label: 'نسبة التحصيل', value: collection, color: AppColors.success)),
            ],
          ),
          const SizedBox(height: 20),
          const Text('أفضل العقارات أداءً', style: TextStyle(color: AppColors.textDark, fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 12),
          _RankBar(label: 'مجمع كويل السكني', value: 0.94),
          _RankBar(label: 'فلل النخيل', value: 0.91),
          _RankBar(label: 'برج الأعمال', value: 0.88),
          _RankBar(label: 'مكاتب التقنية', value: 0.76),
        ],
      ),
    );
  }

  static String _formatRevenue(double value) {
    final s = value.toStringAsFixed(0);
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }
}

class _RankBar extends StatelessWidget {
  const _RankBar({required this.label, required this.value});
  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.w700)),
              Text('${(value * 100).toInt()}%', style: const TextStyle(color: AppColors.teal, fontWeight: FontWeight.w900)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(value: value, minHeight: 6, color: AppColors.teal, backgroundColor: AppColors.borderLight),
          ),
        ],
      ),
    );
  }
}
