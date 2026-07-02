import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/layout/spp_layout.dart';
import '../core/theme/app_colors.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import '../widgets/decision_card.dart';
import '../widgets/glass_card.dart';
import '../widgets/spp_safe_text.dart';

class PredictiveMaintenanceScreen extends StatelessWidget {
  const PredictiveMaintenanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    final open = data.maintenanceRequests.where((m) => m.isOpen).toList();
    final urgent = open.where((m) => m.isUrgent).length;

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: () => context.read<AppState>().refresh(),
      child: ListView(
        padding: SppLayout.screenPadding(),
        children: [
          const SectionHeader(
            title: 'صيانة استباقية',
            subtitle: 'Predictive Maintenance',
          ),
          GlassCard(
            child: Row(
              children: [
                _StatBubble(label: 'مفتوح', value: '${open.length}', color: AppColors.warning),
                const SizedBox(width: 10),
                _StatBubble(label: 'عاجل', value: '$urgent', color: AppColors.danger),
                const SizedBox(width: 10),
                _StatBubble(label: 'فنيين', value: '${data.technicians.length}', color: AppColors.accent),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (open.isEmpty)
            const GlassCard(child: SppSafeText('✅ لا بلاغات مفتوحة — الوضع مستقر'))
          else
            ...open.map((m) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _MaintCard(item: m),
                )),
          if (data.predictions.any((p) => p.title.contains('صيان') || p.description.contains('صيان'))) ...[
            const SizedBox(height: 8),
            const SectionHeader(title: 'تنبؤات الصيانة', subtitle: 'Maintenance Forecast'),
            ...data.predictions
                .where((p) => p.title.contains('صيان') || p.description.contains('صيان'))
                .map((p) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: GlassCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SppSafeText(p.title, maxLines: 2, style: const TextStyle(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 6),
                            SppSafeText(p.recommendation, maxLines: 3, style: const TextStyle(color: AppColors.accent)),
                          ],
                        ),
                      ),
                    )),
          ],
        ],
      ),
    );
  }
}

class _StatBubble extends StatelessWidget {
  const _StatBubble({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: SppSafeText(value, maxLines: 1, minFontSize: 14, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: color)),
            ),
            const SizedBox(height: 2),
            SppSafeText(label, maxLines: 1, minFontSize: 9, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}

class _MaintCard extends StatelessWidget {
  const _MaintCard({required this.item});

  final MaintenanceItem item;

  @override
  Widget build(BuildContext context) {
    final color = item.isUrgent ? AppColors.danger : AppColors.warning;
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: SppSafeText(item.type, maxLines: 2, style: const TextStyle(fontWeight: FontWeight.w800))),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: SppSafeText(item.risk, maxLines: 1, minFontSize: 8, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SppSafeText('${item.unit} — ${item.tenant}', maxLines: 2, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: SppSafeText(item.status, maxLines: 1, minFontSize: 9, style: const TextStyle(fontSize: 11)),
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: SppSafeText(item.ticketNo, maxLines: 1, minFontSize: 9, textAlign: TextAlign.end, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
