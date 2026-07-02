import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../core/theme/spp_identity.dart';
import '../providers/app_state.dart';
import '../models/platform_data.dart';
import '../widgets/decision_card.dart';
import '../widgets/spp_components.dart';
import 'ai_assistant_screen.dart';

/// Brain Hub — مركز SPP. قرار أولاً، موظف ذكي، ليس لوحة إدارة.
class BrainHubScreen extends StatelessWidget {
  const BrainHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    final decisions = data.priorityDecisions;
    final primary = decisions.isNotEmpty ? decisions.first : null;
    final secondary = decisions.length > 1 ? decisions.sublist(1) : <DecisionItem>[];
    final firstName = data.ownerName.split(' ').first;
    final briefing = _morningBriefing(data);

    return RefreshIndicator(
      color: AppColors.brand,
      onRefresh: () => context.read<AppState>().refresh(),
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _SppMark(),
                        const Spacer(),
                        IconButton(onPressed: () {}, icon: const Icon(PremiumIcons.notification, color: AppColors.textSecondary)),
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: AppColors.brand.withValues(alpha: 0.25),
                          child: Text(data.ownerName.isNotEmpty ? data.ownerName[0] : 'أ', style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.brandGlow)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Text('مرحباً $firstName', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, height: 1.15)),
                    const SizedBox(height: 4),
                    Text(data.propertyName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                    const SizedBox(height: 6),
                    Text(SppIdentity.employeeTitle, style: TextStyle(color: AppColors.brandGlow.withValues(alpha: 0.9), fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                EmployeeBriefingCard(
                  message: briefing,
                  onAsk: () => pushSpp(context, const AiAssistantScreen()),
                ),
                const SizedBox(height: 20),
                if (primary != null) ...[
                  TodayDecisionHero(decision: primary),
                  const SizedBox(height: 16),
                ],
                if (secondary.isNotEmpty) ...[
                  SectionHeader(title: 'قرارات إضافية', subtitle: '${secondary.length} بناءً على تحليل Unified Brain'),
                  ...secondary.asMap().entries.map(
                        (e) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: DecisionCard(item: e.value, index: e.key + 1),
                        ),
                      ),
                  const SizedBox(height: 8),
                ],
                PropertyPulseCard(
                  score: data.propertyHealth.score,
                  level: data.propertyHealth.level,
                  collectionRate: data.report.collectionRate,
                ),
                const SizedBox(height: 20),
                VirtualSensorStrip(
                  power: data.smartStatus.power,
                  water: data.smartStatus.water,
                  whatsapp: data.liveMonitor.greenStatus,
                  powerAlert: data.smartStatus.powerAlert,
                  waterAlert: data.smartStatus.waterAlert,
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  static String _morningBriefing(dynamic data) {
    final d = data.priorityDecisions.length;
    final risks = data.smartSummary.highRisks;
    final maint = data.liveMonitor.openMaintenance;
    if (d == 0) return 'راجعت محفظتك — الوضع مستقر. أنا جاهز لأي سؤال أو قرار.';
    return 'راجعت $d قراراً اليوم. $risks مخاطر عالية و$maint بلاغ صيانة مفتوح. أقترح البدء بالقرار الأول أدناه.';
  }
}

class _SppMark extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.brand.withValues(alpha: 0.4)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Text(
        'SPP',
        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 2, color: AppColors.brandGlow),
      ),
    );
  }
}
