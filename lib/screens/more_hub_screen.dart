import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/constants/api_constants.dart';
import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/glass_card.dart';
import '../models/platform_data.dart';
import 'contracts_screen.dart';
import 'predictive_maintenance_screen.dart';
import 'property_health_screen.dart';
import 'subscription_screen.dart';

class MoreHubScreen extends StatelessWidget {
  const MoreHubScreen({super.key, required this.onLogout});

  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    final settings = data?.settings;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
      children: [
        GlassCard(
          child: Row(
            children: [
              const CircleAvatar(
                radius: 28,
                backgroundColor: AppColors.primary,
                child: Icon(Icons.person, color: Colors.white, size: 28),
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
                    Text(
                      settings?.propertyName ?? '—',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _HubTile(
          icon: Icons.favorite_outline,
          title: 'Smart Property Health',
          subtitle: 'صحة العقار الشاملة',
          onTap: () => _open(context, const PropertyHealthScreen()),
        ),
        _HubTile(
          icon: Icons.handyman_outlined,
          title: 'Predictive Maintenance',
          subtitle: 'صيانة استباقية ذكية',
          onTap: () => _open(context, const PredictiveMaintenanceScreen()),
        ),
        _HubTile(
          icon: Icons.description_outlined,
          title: 'العقود',
          subtitle: 'عقود نشطة ومنتهية وقريبة',
          onTap: () => _open(context, const ContractsScreen()),
        ),
        _HubTile(
          icon: Icons.memory_outlined,
          title: 'Property Memory',
          subtitle: '${data?.aiRecords.length ?? 0} سجل ذكي',
          onTap: () => _showMemory(context, data?.aiRecords ?? []),
        ),
        _HubTile(
          icon: Icons.workspace_premium_outlined,
          title: 'الاشتراك',
          subtitle: data?.subscription.message ?? '—',
          onTap: () => _open(context, const SubscriptionScreen()),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: onLogout,
          icon: const Icon(Icons.logout, color: AppColors.danger),
          label: const Text('تسجيل الخروج', style: TextStyle(color: AppColors.danger)),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
            side: const BorderSide(color: AppColors.danger),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Build ${ApiConstants.buildTag} · ${ApiConstants.baseUrl.substring(0, 40)}...',
          style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
        ),
      ],
    );
  }

  void _open(BuildContext context, Widget screen) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  void _showMemory(BuildContext context, List<AiRecord> records) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bgCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Property Memory', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            const SizedBox(height: 12),
            if (records.isEmpty)
              const Text('لا سجلات بعد — ستُبنى من التحليلات الذكية')
            else
              ...records.take(8).map((r) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Text('• ${r.date} — ${r.title} (${r.unit})'),
                  )),
          ],
        ),
      ),
    );
  }
}

class _HubTile extends StatelessWidget {
  const _HubTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppColors.accent),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
                  Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.arrow_back_ios_new, size: 14, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}
