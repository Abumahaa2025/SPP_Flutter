import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/navigation/luxury_route.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../providers/app_state.dart';
import '../widgets/reference_widgets.dart';
import 'ai_assistant_screen.dart';

class BrainHubScreen extends StatelessWidget {
  const BrainHubScreen({super.key});

  static const _chartData = [72.0, 78.0, 81.0, 85.0, 88.0, 91.0, 94.0];

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    final s = data.dashboard.summary;
    final score = data.propertyHealth.score;
    final recommendations = data.priorityDecisions.length + data.predictions.length;
    final firstName = data.ownerName.split(' ').first;

    return RefreshIndicator(
      color: AppColors.teal,
      onRefresh: () => context.read<AppState>().refresh(),
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: CityscapeHeader(
              height: 210,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(PremiumIcons.notification, color: Colors.white),
                      ),
                      const Spacer(),
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: AppColors.teal.withValues(alpha: 0.3),
                        child: Text(
                          data.ownerName.isNotEmpty ? data.ownerName[0] : 'أ',
                          style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Transform.translate(
              offset: const Offset(0, -24),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16, right: 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'أهلاً $firstName',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: MediaQuery.sizeOf(context).width < 360 ? 22 : 26,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          Text(
                            data.propertyName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                    PerformanceSummaryCard(
                      score: score,
                      trend: '+12%',
                      chartData: _chartData,
                      stats: [
                        (label: 'وحدات مؤجرة', value: '${s.rented}', icon: PremiumIcons.unit, color: AppColors.teal),
                        (label: 'وحدات شاغرة', value: '${s.vacant}', icon: PremiumIcons.vacant, color: AppColors.warning),
                        (label: 'عقود قريبة', value: '${s.nearCount}', icon: PremiumIcons.contract, color: AppColors.info),
                        (label: 'تنبيهات مهمة', value: '${data.smartSummary.highRisks + data.maintenanceRequests.where((m) => m.isUrgent).length}', icon: PremiumIcons.alert, color: AppColors.danger),
                      ],
                    ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.06),
                    const SizedBox(height: 16),
                    AiAssistantBanner(
                      recommendationCount: recommendations,
                      onTap: () => pushLuxury(context, const AiAssistantScreen()),
                    ).animate(delay: 150.ms).fadeIn().slideY(begin: 0.05),
                    const SizedBox(height: 100),
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
