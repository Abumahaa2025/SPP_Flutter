import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import '../widgets/decision_card.dart';
import '../widgets/glass_card.dart';

class PropertyMemoryScreen extends StatelessWidget {
  const PropertyMemoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final records = context.watch<AppState>().platform?.aiRecords ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text('Property Memory')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          SectionHeader(
            title: 'ذاكرة العقار',
            subtitle: 'كل ما تعلمه النظام عن عقارك',
          ),
          if (records.isEmpty)
            const GlassCard(child: Text('لا سجلات بعد'))
          else
            ...records.asMap().entries.map((e) {
              final r = e.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: _MemoryTile(record: r, index: e.key),
              );
            }),
        ],
      ),
    );
  }
}

class _MemoryTile extends StatelessWidget {
  const _MemoryTile({required this.record, required this.index});

  final AiRecord record;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.goldGradient,
                boxShadow: [BoxShadow(color: AppColors.gold.withValues(alpha: 0.4), blurRadius: 8)],
              ),
            ),
            Container(width: 2, height: 80, color: AppColors.border.withValues(alpha: 0.5)),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: GlassCard(
            luxury: record.risk.contains('عالي'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(record.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                    ),
                    Text(record.date, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
                const SizedBox(height: 6),
                Text('${record.unit} · ${record.type ?? 'ذكي'}', style: const TextStyle(color: AppColors.accent, fontSize: 12)),
                const SizedBox(height: 8),
                Text(record.summary, style: const TextStyle(color: AppColors.textSecondary, height: 1.5)),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.bgElevated,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.auto_awesome, size: 16, color: AppColors.gold),
                      const SizedBox(width: 8),
                      Expanded(child: Text(record.recommendation, style: const TextStyle(fontSize: 12))),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ).animate(delay: (80 * index).ms).fadeIn().slideX(begin: 0.05);
  }
}
