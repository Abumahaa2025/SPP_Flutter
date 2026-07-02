import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../core/theme/premium_icons.dart';
import '../providers/app_state.dart';
import '../widgets/decision_card.dart';
import '../widgets/glass_card.dart';
import '../widgets/luxury_cards.dart';

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
          if (data.priorityDecisions.isNotEmpty)
            HeroDecisionCard(item: data.priorityDecisions.first),
          const SizedBox(height: 12),
          ...data.priorityDecisions.skip(1).toList().asMap().entries.map(
                (e) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: DecisionCard(item: e.value, index: e.key + 1),
                ),
              ),
          const SizedBox(height: 8),
          Text('PERFORMANCE', style: AppTypography.englishCaps),
          const SizedBox(height: 12),
          SizedBox(
            height: 110,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                SizedBox(
                  width: 150,
                  child: CompactMetricCard(
                    label: 'وحدات',
                    value: '${data.dashboard.summary.totalUnits}',
                    icon: PremiumIcons.property,
                    index: 0,
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: 150,
                  child: CompactMetricCard(
                    label: 'تحصيل',
                    value: '${data.report.collectionRate.toStringAsFixed(0)}%',
                    icon: PremiumIcons.payment,
                    color: AppColors.success,
                    index: 1,
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: 150,
                  child: CompactMetricCard(
                    label: 'متأخرون',
                    value: '${data.dashboard.summary.lateCount}',
                    icon: PremiumIcons.decision,
                    color: AppColors.danger,
                    index: 2,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SectionHeader(title: 'التنبؤات النشطة'),
          if (data.predictions.isEmpty)
            const GlassCard(
              child: Text('لا تنبؤات نشطة حالياً', style: TextStyle(color: AppColors.textSecondary)),
            )
          else
            ...data.predictions.take(5).toList().asMap().entries.map(
                  (e) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _PredictionCard(prediction: e.value, index: e.key),
                  ),
                ),
        ],
      ),
    );
  }
}

class _PredictionCard extends StatelessWidget {
  const _PredictionCard({required this.prediction, required this.index});

  final dynamic prediction;
  final int index;

  @override
  Widget build(BuildContext context) {
    final high = prediction.isHighRisk as bool;
    final accent = high ? AppColors.danger : AppColors.warning;
    final wide = index.isEven;

    if (wide) {
      return WideInsightCard(
        title: prediction.title as String,
        subtitle: prediction.recommendation as String,
        icon: high ? Icons.error_outline_rounded : Icons.insights_rounded,
        accent: high,
      );
    }

    return GlassCard(
      luxury: high,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              PremiumIcons.inCircle(high ? Icons.error_outline_rounded : Icons.info_outline_rounded, color: accent),
              const SizedBox(width: 12),
              Expanded(
                child: Text(prediction.title as String, style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
            ],
          ),
          if ((prediction.description as String).isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(prediction.description as String, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ],
          const SizedBox(height: 8),
          Text('↳ ${prediction.recommendation}', style: TextStyle(color: accent, fontSize: 13, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
