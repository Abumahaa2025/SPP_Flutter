import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import '../widgets/glass_card.dart';

class SmartInboxScreen extends StatelessWidget {
  const SmartInboxScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    final messages = data.messages;

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: () => context.read<AppState>().refresh(),
      child: messages.isEmpty
          ? ListView(
              children: const [
                SizedBox(height: 120),
                Center(child: Text('لا رسائل في السجل — ستظهر من Green API')),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
              itemCount: messages.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final msg = messages[index];
                return _InboxCard(message: msg, index: index);
              },
            ),
    );
  }
}

class _InboxCard extends StatelessWidget {
  const _InboxCard({required this.message, required this.index});

  final MessageItem message;
  final int index;

  Color get _urgencyColor {
    switch (message.insight.urgency) {
      case DecisionPriority.high:
        return AppColors.danger;
      case DecisionPriority.medium:
        return AppColors.warning;
      case DecisionPriority.low:
        return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _urgencyColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  message.insight.label,
                  style: TextStyle(color: _urgencyColor, fontWeight: FontWeight.w700, fontSize: 11),
                ),
              ),
              const Spacer(),
              Text(
                '${message.date} ${message.time}'.trim(),
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(message.category, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          const SizedBox(height: 4),
          Text(message.phone, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.bgElevated,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, color: AppColors.accent, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    message.insight.suggestedAction,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate(delay: (60 * index).ms)
        .fadeIn()
        .slideX(begin: 0.05);
  }
}
