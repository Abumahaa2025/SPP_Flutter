import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import '../widgets/decision_card.dart';
import '../widgets/glass_card.dart';

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
        padding: const EdgeInsets.all(20),
        children: [
          SectionHeader(
            title: 'Predictive Maintenance',
            subtitle: 'صيانة استباقية — ليس مجرد بلاغات',
          ),
          GlassCard(
            child: Row(
              children: [
                _StatBubble(label: 'مفتوح', value: '${open.length}', color: AppColors.warning),
                const SizedBox(width: 12),
                _StatBubble(label: 'عاجل', value: '$urgent', color: AppColors.danger),
                const SizedBox(width: 12),
                _StatBubble(label: 'فنيين', value: '${data.technicians.length}', color: AppColors.accent),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (open.isEmpty)
            const GlassCard(child: Text('✅ لا بلاغات مفتوحة — الوضع مستقر'))
          else
            ...open.map((m) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _MaintCard(item: m),
                )),
          if (data.predictions.any((p) => p.title.contains('صيان') || p.description.contains('صيان'))) ...[
            const SizedBox(height: 8),
            SectionHeader(title: 'تنبؤات الصيانة'),
            ...data.predictions
                .where((p) => p.title.contains('صيان') || p.description.contains('صيان'))
                .map((p) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: GlassCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 6),
                            Text(p.recommendation, style: const TextStyle(color: AppColors.accent)),
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
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: color)),
            Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
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
            children: [
              Expanded(child: Text(item.type, style: const TextStyle(fontWeight: FontWeight.w800))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(item.risk, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('${item.unit} — ${item.tenant}', style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Row(
            children: [
              Chip(
                label: Text(item.status, style: const TextStyle(fontSize: 11)),
                backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                visualDensity: VisualDensity.compact,
              ),
              const Spacer(),
              Text(item.ticketNo, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}
