import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import '../widgets/ai_orb.dart';
import '../widgets/decision_card.dart';
import '../widgets/glass_card.dart';
import 'ai_assistant_screen.dart';

class BrainHubScreen extends StatelessWidget {
  const BrainHubScreen({super.key});

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
          _GreetingHeader(data: data),
          const SizedBox(height: 20),
          _BrainStatusCard(data: data),
          const SizedBox(height: 20),
          SectionHeader(
            title: 'قرارات اليوم',
            subtitle: 'ما يحتاج انتباهك الآن — ليس مجرد أرقام',
          ),
          ...data.priorityDecisions.asMap().entries.map(
                (e) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: DecisionCard(item: e.value, index: e.key),
                ),
              ),
          const SizedBox(height: 8),
          SectionHeader(title: 'Virtual Sensors', subtitle: 'حالة البنية التحتية الافتراضية'),
          _SensorStrip(data: data),
          const SizedBox(height: 16),
          _OpenAssistantCard(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
            ),
          ),
        ],
      ),
    );
  }
}

class _GreetingHeader extends StatelessWidget {
  const _GreetingHeader({required this.data});

  final PlatformData data;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'مرحباً ${data.ownerName}',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              Text(
                data.propertyName,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
        AiOrb(size: 72, score: data.propertyHealth.score),
      ],
    ).animate().fadeIn().slideY(begin: -0.05);
  }
}

class _BrainStatusCard extends StatelessWidget {
  const _BrainStatusCard({required this.data});

  final PlatformData data;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.hub_outlined, color: AppColors.accent),
              const SizedBox(width: 8),
              Text('Unified Brain', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
              const Spacer(),
              _StatusDot(active: data.isConnected),
            ],
          ),
          const SizedBox(height: 14),
          _MetricRow(label: 'التحصيل', value: '${data.report.collectionRate.toStringAsFixed(1)}%'),
          _MetricRow(label: 'مخاطر عالية', value: '${data.smartSummary.highRisks}'),
          _MetricRow(label: 'صيانة مفتوحة', value: '${data.liveMonitor.openMaintenance}'),
          _MetricRow(label: 'واتساب', value: data.liveMonitor.greenStatus),
        ],
      ),
    ).animate(delay: 100.ms).fadeIn().slideY(begin: 0.04);
  }
}

class _MetricRow extends StatelessWidget {
  const _MetricRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _SensorStrip extends StatelessWidget {
  const _SensorStrip({required this.data});

  final PlatformData data;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _SensorTile(label: 'الكهرباء', value: data.smartStatus.power, alert: data.smartStatus.powerAlert)),
        const SizedBox(width: 10),
        Expanded(child: _SensorTile(label: 'المياه', value: data.smartStatus.water, alert: data.smartStatus.waterAlert)),
        const SizedBox(width: 10),
        Expanded(child: _SensorTile(label: 'آخر حدث', value: data.smartStatus.lastEvent, small: true)),
      ],
    );
  }
}

class _SensorTile extends StatelessWidget {
  const _SensorTile({
    required this.label,
    required this.value,
    this.alert = false,
    this.small = false,
  });

  final String label;
  final String value;
  final bool alert;
  final bool small;

  @override
  Widget build(BuildContext context) {
    final color = alert ? AppColors.danger : AppColors.success;
    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 6),
          Text(
            value,
            maxLines: small ? 2 : 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: small ? 11 : 14,
              color: alert ? color : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _OpenAssistantCard extends StatelessWidget {
  const _OpenAssistantCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.accent.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.chat_bubble_outline, color: AppColors.accent),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('تحدث مع الموظف الذكي', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
                const Text('اسأل عن الحالة، الصيانة، التحصيل، التنبؤات...', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.arrow_back_ios_new, size: 16, color: AppColors.textMuted),
        ],
      ),
    );
  }
}

class _StatusDot extends StatelessWidget {
  const _StatusDot({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: active ? AppColors.success : AppColors.danger,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(active ? 'متصل' : 'جزئي', style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}
