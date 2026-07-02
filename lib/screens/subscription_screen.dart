import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/constants/api_constants.dart';
import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/glass_card.dart';

class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  static const _features = [
    'المساعد الذكي',
    'تقارير متقدمة',
    'دعم 24/7',
    'تنبيهات ذكية',
    'صيانة استباقية',
  ];

  @override
  Widget build(BuildContext context) {
    final sub = context.watch<AppState>().platform?.subscription;
    final settings = context.watch<AppState>().platform?.settings;

    if (sub == null) {
      return const Center(child: Text('لا بيانات اشتراك'));
    }

    return Container(
      decoration: BoxDecoration(gradient: AppColors.heroGradient),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          GlassCard(
            luxury: true,
            blur: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: AppColors.goldGradient,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.workspace_premium_rounded, color: AppColors.bgDeep, size: 28),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Text(
                        'الخطة الاحترافية',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Text(
                  '99 ر.س / شهر',
                  style: TextStyle(color: AppColors.teal, fontSize: 36, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 20),
                ..._features.map(
                  (f) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: AppColors.teal, size: 22),
                        const SizedBox(width: 12),
                        Text(f, style: const TextStyle(color: Colors.white, fontSize: 15)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: AppColors.tealButton,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(color: AppColors.teal.withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 8)),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      minimumSize: const Size.fromHeight(56),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    ),
                    child: const Text('تغيير الخطة', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _InfoRow(label: 'الحالة', value: sub.status ?? settings?.subscriptionStatus ?? '—'),
          _InfoRow(label: 'ينتهي', value: settings?.subscriptionEnd ?? '—'),
          _InfoRow(label: 'العميل', value: settings?.clientName ?? '—'),
          Text('Build: ${ApiConstants.buildTag}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Text(label, style: const TextStyle(color: AppColors.textSecondary)),
            const Spacer(),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
