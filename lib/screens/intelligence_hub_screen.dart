import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/constants/api_constants.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../core/theme/spp_identity.dart';
import '../providers/app_state.dart';
import '../widgets/glass_card.dart';
import '../widgets/spp_components.dart';
import 'analytics_screen.dart';
import 'contracts_screen.dart';
import 'maintenance_tab_screen.dart';
import 'predictive_maintenance_screen.dart';
import 'property_health_screen.dart';
import 'property_map_screen.dart';
import 'property_memory_screen.dart';
import 'subscription_screen.dart';

/// مركز ذكاء SPP — الـ 30% الفريد للمنصة.
class IntelligenceHubScreen extends StatelessWidget {
  const IntelligenceHubScreen({super.key, required this.onLogout});

  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    final settings = data?.settings;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
      children: [
        SppScreenHeader(
          title: 'منصة SPP',
          subtitle: 'أدوات الذكاء العقاري المتقدمة',
        ),
        GlassCard(
          luxury: true,
          child: Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: AppColors.brand.withValues(alpha: 0.2),
                child: Text(
                  settings?.clientName.isNotEmpty == true ? settings!.clientName[0] : 'أ',
                  style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.brandGlow, fontSize: 20),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(settings?.clientName.isNotEmpty == true ? settings!.clientName : 'المالك', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                    Text(settings?.propertyName ?? 'مجمعك الرئيسي', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  ],
                ),
              ),
              const LuxuryBadge(label: 'PRO'),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text('UNIFIED BRAIN MODULES', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 2)),
        const SizedBox(height: 12),
        SppModuleTile(
          title: 'Property Health',
          subtitle: 'صحة العقار الشاملة · ${data?.propertyHealth.score ?? 0}%',
          icon: PremiumIcons.health,
          accent: true,
          onTap: () => pushSpp(context, const PropertyHealthScreen()),
        ),
        const SizedBox(height: 10),
        SppModuleTile(
          title: 'Predictive Maintenance',
          subtitle: 'صيانة استباقية · ${data?.liveMonitor.openMaintenance ?? 0} بلاغ مفتوح',
          icon: PremiumIcons.maintenance,
          badge: '${data?.maintenanceRequests.where((m) => m.isUrgent).length ?? 0}',
          onTap: () => pushSpp(context, const PredictiveMaintenanceScreen()),
        ),
        const SizedBox(height: 10),
        SppModuleTile(
          title: 'Property Memory',
          subtitle: '${data?.aiRecords.length ?? 0} سجل ذكي يتذكر عقارك',
          icon: PremiumIcons.memory,
          onTap: () => pushSpp(context, const PropertyMemoryScreen()),
        ),
        const SizedBox(height: 20),
        Text('OPERATIONS', style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 2)),
        const SizedBox(height: 12),
        SppModuleTile(
          title: 'طلبات الصيانة',
          subtitle: 'متابعة البلاغات والحالات',
          icon: PremiumIcons.maintenance,
          onTap: () => pushSpp(context, const MaintenanceTabScreen()),
        ),
        const SizedBox(height: 10),
        SppModuleTile(
          title: 'خريطة العقارات',
          subtitle: 'عرض تفاعلي للمحفظة',
          icon: PremiumIcons.map,
          onTap: () => pushSpp(context, const PropertyMapScreen()),
        ),
        const SizedBox(height: 10),
        SppModuleTile(
          title: 'تحليلات الأداء',
          subtitle: 'إيرادات · إشغال · تحصيل',
          icon: PremiumIcons.analytics,
          onTap: () => pushSpp(context, const AnalyticsScreen()),
        ),
        const SizedBox(height: 10),
        SppModuleTile(
          title: 'العقود',
          subtitle: 'نشطة · منتهية · قريبة',
          icon: PremiumIcons.contract,
          onTap: () => pushSpp(context, const ContractsScreen()),
        ),
        const SizedBox(height: 10),
        SppModuleTile(
          title: 'الاشتراك',
          subtitle: data?.subscription.message ?? 'الخطة الاحترافية',
          icon: PremiumIcons.subscription,
          onTap: () => pushSpp(context, const SubscriptionScreen()),
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: onLogout,
          icon: const Icon(PremiumIcons.logout, color: AppColors.danger),
          label: const Text('تسجيل الخروج', style: TextStyle(color: AppColors.danger)),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
            side: const BorderSide(color: AppColors.danger),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(SppIdentity.radiusMd)),
          ),
        ),
        const SizedBox(height: 12),
        Text('${SppIdentity.brandShort} · ${ApiConstants.buildTag}', style: const TextStyle(color: AppColors.textMuted, fontSize: 10), textAlign: TextAlign.center),
      ],
    );
  }
}
