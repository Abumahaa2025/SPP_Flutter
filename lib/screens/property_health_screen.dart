import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import '../widgets/decision_card.dart';
import '../widgets/glass_card.dart';

class PropertyHealthScreen extends StatelessWidget {
  const PropertyHealthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    final health = data.propertyHealth;
    final score = health.score.clamp(0, 100).toDouble();

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        SectionHeader(title: 'Smart Property Health', subtitle: 'صحة العقار الشاملة'),
        SizedBox(
          height: 220,
          child: GlassCard(
            child: Stack(
              alignment: Alignment.center,
              children: [
                PieChart(
                  PieChartData(
                    sectionsSpace: 2,
                    centerSpaceRadius: 70,
                    sections: [
                      PieChartSectionData(
                        value: score,
                        color: _scoreColor(score.toInt()),
                        radius: 22,
                        showTitle: false,
                      ),
                      PieChartSectionData(
                        value: 100 - score,
                        color: AppColors.bgElevated,
                        radius: 18,
                        showTitle: false,
                      ),
                    ],
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('$score%', style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900)),
                    Text(health.level, style: const TextStyle(color: AppColors.textSecondary)),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        _HealthMetric(title: 'نسبة التحصيل', value: '${health.collectionRate.toStringAsFixed(1)}%', icon: Icons.payments),
        _HealthMetric(title: 'صافي الربح', value: '${health.netProfit} ر.س', icon: Icons.trending_up),
        _HealthMetric(title: 'مخاطر عالية', value: '${data.smartSummary.highRisks}', icon: Icons.warning_amber),
        _HealthMetric(title: 'الوحدات المؤجرة', value: '${data.dashboard.summary.rented}/${data.dashboard.summary.totalUnits}', icon: Icons.home_work),
        const SizedBox(height: 16),
        SectionHeader(title: 'توصيات الصحة'),
        ...data.priorityDecisions
            .where((d) => d.icon == IconsInsight.health || d.priority == DecisionPriority.high)
            .take(3)
            .map((d) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: DecisionCard(item: d),
                )),
      ],
    );
  }

  Color _scoreColor(int score) {
    if (score >= 75) return AppColors.success;
    if (score >= 50) return AppColors.warning;
    return AppColors.danger;
  }
}

class _HealthMetric extends StatelessWidget {
  const _HealthMetric({
    required this.title,
    required this.value,
    required this.icon,
  });

  final String title;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: AppColors.accent),
            const SizedBox(width: 12),
            Expanded(child: Text(title)),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }
}
