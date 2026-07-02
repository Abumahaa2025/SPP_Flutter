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
import 'property_memory_screen.dart';

class BrainHubScreen extends StatelessWidget {
  const BrainHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    return RefreshIndicator(
      color: AppColors.gold,
      onRefresh: () => context.read<AppState>().refresh(),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _HeroHeader(data: data)),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                SectionHeader(
                  title: 'قرارات اليوم',
                  subtitle: 'ما يستحق انتباهك الآن',
                  trailing: LuxuryBadge(label: '${data.priorityDecisions.length} نشط'),
                ),
                ...data.priorityDecisions.asMap().entries.map(
                      (e) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: DecisionCard(item: e.value, index: e.key),
                      ),
                    ),
                const SizedBox(height: 8),
                SectionHeader(title: 'Unified Brain', subtitle: 'حالة العقل الموحد'),
                _BrainPanel(data: data),
                const SizedBox(height: 16),
                SectionHeader(title: 'Virtual Sensors', subtitle: 'البنية التحتية الافتراضية'),
                _SensorGrid(data: data),
                const SizedBox(height: 16),
                _AssistantCta(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
                  ),
                ),
                const SizedBox(height: 12),
                GlassCard(
                  luxury: true,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const PropertyMemoryScreen()),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.memory_rounded, color: AppColors.gold, size: 28),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Property Memory', style: TextStyle(fontWeight: FontWeight.w800)),
                            Text(
                              '${data.aiRecords.length} سجل ذكي محفوظ',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_back_ios_new, size: 14, color: AppColors.textMuted),
                    ],
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({required this.data});

  final PlatformData data;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: GlassCard(
        luxury: true,
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'مرحباً، ${data.ownerName}',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 6),
                      Text(data.propertyName, style: const TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 10),
                      const LuxuryBadge(label: 'AI-FIRST ACTIVE'),
                    ],
                  ),
                ),
                AiOrb(size: 88, score: data.propertyHealth.score, luxury: true),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn().slideY(begin: -0.04);
  }
}

class _BrainPanel extends StatelessWidget {
  const _BrainPanel({required this.data});

  final PlatformData data;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        children: [
          _Row('نسبة التحصيل', '${data.report.collectionRate.toStringAsFixed(1)}%', AppColors.success),
          _Row('مخاطر عالية', '${data.smartSummary.highRisks}', AppColors.danger),
          _Row('صيانة مفتوحة', '${data.liveMonitor.openMaintenance}', AppColors.warning),
          _Row('واتساب', data.liveMonitor.greenStatus, AppColors.accent),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value, this.color);

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class _SensorGrid extends StatelessWidget {
  const _SensorGrid({required this.data});

  final PlatformData data;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _Tile('⚡ كهرباء', data.smartStatus.power, data.smartStatus.powerAlert)),
        const SizedBox(width: 10),
        Expanded(child: _Tile('💧 مياه', data.smartStatus.water, data.smartStatus.waterAlert)),
      ],
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile(this.label, this.value, this.alert);

  final String label;
  final String value;
  final bool alert;

  @override
  Widget build(BuildContext context) {
    final c = alert ? AppColors.danger : AppColors.success;
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontWeight: FontWeight.w800, color: c)),
        ],
      ),
    );
  }
}

class _AssistantCta extends StatelessWidget {
  const _AssistantCta({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      luxury: true,
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: AppColors.goldGradient,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.chat_rounded, color: AppColors.bgDeep),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('تحدث مع الموظف الذكي', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                Text('اسأل عن أي شيء — يفهم عقارك', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Icon(Icons.arrow_back_ios_new, size: 16, color: AppColors.gold.withValues(alpha: 0.8)),
        ],
      ),
    ).animate().shimmer(duration: 2.seconds, color: AppColors.gold.withValues(alpha: 0.15));
  }
}
