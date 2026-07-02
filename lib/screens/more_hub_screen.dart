import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/constants/api_constants.dart';
import '../core/navigation/luxury_route.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../providers/app_state.dart';
import '../widgets/glass_card.dart';
import '../widgets/luxury_cards.dart';
import 'analytics_screen.dart';
import 'contracts_screen.dart';
import 'predictive_maintenance_screen.dart';
import 'property_health_screen.dart';
import 'property_map_screen.dart';
import 'property_memory_screen.dart';
import 'subscription_screen.dart';

class MoreHubScreen extends StatelessWidget {
  const MoreHubScreen({super.key, required this.onLogout});

  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    final settings = data?.settings;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
      children: [
        GlassCard(
          luxury: true,
          blur: 16,
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppColors.teal.withValues(alpha: 0.2),
                child: Text(
                  (settings?.clientName.isNotEmpty == true ? settings!.clientName[0] : 'أ'),
                  style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.teal, fontSize: 22),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      settings?.clientName.isNotEmpty == true ? settings!.clientName : 'المالك',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17),
                    ),
                    Text(settings?.propertyName ?? 'مجمعك الرئيسي', style: const TextStyle(color: AppColors.textSecondary)),
                  ],
                ),
              ),
              const LuxuryBadge(label: 'PRO'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        WideInsightCard(
          title: 'تحليلات الأداء',
          subtitle: 'إيرادات · إشغال · تحصيل',
          icon: PremiumIcons.analytics,
          accent: true,
          onTap: () => pushLuxury(context, const AnalyticsScreen()),
        ),
        const SizedBox(height: 10),
        WideInsightCard(
          title: 'خريطة العقارات',
          subtitle: 'عرض تفاعلي على الخريطة',
          icon: PremiumIcons.map,
          onTap: () => pushLuxury(context, const PropertyMapScreen()),
        ),
        const SizedBox(height: 10),
        WideInsightCard(
          title: 'Smart Property Health',
          subtitle: 'صحة العقار الشاملة',
          icon: PremiumIcons.health,
          onTap: () => pushLuxury(context, const PropertyHealthScreen()),
        ),
        const SizedBox(height: 10),
        WideInsightCard(
          title: 'Predictive Maintenance',
          subtitle: 'صيانة استباقية ذكية',
          icon: PremiumIcons.maintenance,
          onTap: () => pushLuxury(context, const PredictiveMaintenanceScreen()),
        ),
        const SizedBox(height: 10),
        WideInsightCard(
          title: 'العقود',
          subtitle: 'عقود نشطة ومنتهية وقريبة',
          icon: PremiumIcons.contract,
          onTap: () => pushLuxury(context, const ContractsScreen()),
        ),
        const SizedBox(height: 10),
        WideInsightCard(
          title: 'Property Memory',
          subtitle: '${data?.aiRecords.length ?? 0} سجل ذكي',
          icon: PremiumIcons.memory,
          onTap: () => pushLuxury(context, const PropertyMemoryScreen()),
        ),
        const SizedBox(height: 10),
        WideInsightCard(
          title: 'الاشتراك',
          subtitle: data?.subscription.message ?? 'الخطة الاحترافية',
          icon: PremiumIcons.subscription,
          onTap: () => pushLuxury(context, const SubscriptionScreen()),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: onLogout,
          icon: const Icon(PremiumIcons.logout, color: AppColors.danger),
          label: const Text('تسجيل الخروج', style: TextStyle(color: AppColors.danger)),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
            side: const BorderSide(color: AppColors.danger),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
        const SizedBox(height: 8),
        Text('Build ${ApiConstants.buildTag}', style: const TextStyle(color: AppColors.textMuted, fontSize: 10), textAlign: TextAlign.center),
      ],
    );
  }
}
