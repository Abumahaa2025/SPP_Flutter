import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/decision_card.dart';
import '../widgets/glass_card.dart';

class SmartDashboardScreen extends StatelessWidget {
  const SmartDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: () => context.read<AppState>().refresh(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
        children: [
          SectionHeader(
            title: 'لوحة القرارات',
            subtitle: 'تحليل استراتيجي — ماذا تفعل الآن؟',
          ),
          ...data.priorityDecisions.asMap().entries.map(
                (e) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: DecisionCard(item: e.value, index: e.key),
                ),
              ),
          const SizedBox(height: 8),
          SectionHeader(title: 'مؤشرات الأداء', subtitle: 'من البيانات الحية'),
          _KpiGrid(data: data),
          const SizedBox(height: 16),
          SectionHeader(title: 'التنبؤات النشطة'),
          if (data.predictions.isEmpty)
            const GlassCard(
              child: Text('لا تنبؤات حالياً — شغّل المحرك من المنصة'),
            )
          else
            ...data.predictions.take(5).map(
                  (p) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                p.isHighRisk ? Icons.error_outline : Icons.info_outline,
                                color: p.isHighRisk ? AppColors.danger : AppColors.warning,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(p.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                              ),
                            ],
                          ),
                          if (p.description.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(p.description, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                          ],
                          const SizedBox(height: 8),
                          Text('↳ ${p.recommendation}', style: const TextStyle(color: AppColors.accent, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({required this.data});

  final dynamic data;

  @override
  Widget build(BuildContext context) {
    final s = data.dashboard.summary;
    final items = [
      ('وحدات', '${s.totalUnits}', Icons.apartment),
      ('مؤجرة', '${s.rented}', Icons.home_work_outlined),
      ('شاغرة', '${s.vacant}', Icons.meeting_room_outlined),
      ('تحصيل', '${data.report.collectionRate.toStringAsFixed(0)}%', Icons.pie_chart_outline),
      ('متأخرون', '${s.lateCount}', Icons.warning_amber_rounded),
      ('صافي', '${data.propertyHealth.netProfit}', Icons.account_balance_wallet_outlined),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.6,
      children: items
          .map(
            (e) => GlassCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(e.$3, color: AppColors.accent, size: 20),
                  const Spacer(),
                  Text(e.$2, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
                  Text(e.$1, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
