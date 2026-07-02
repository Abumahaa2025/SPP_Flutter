import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/constants/api_constants.dart';
import '../core/layout/spp_layout.dart';
import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/glass_card.dart';
import '../widgets/spp_safe_text.dart';

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
    final state = context.watch<AppState>();
    final sub = state.platform?.subscription;
    final settings = state.platform?.settings;

    if (sub == null) {
      return const Center(child: SppSafeText('جاري تحميل بيانات الاشتراك...'));
    }

    final status = sub.status ?? settings?.subscriptionStatus ?? 'نشط';
    final planLabel = sub.active ? 'الخطة الاحترافية' : 'خطة تجريبية';
    final priceLabel = sub.daysLeft != null ? '${sub.daysLeft} يوم متبقي' : 'حسب الخطة النشطة';

    return Container(
      decoration: BoxDecoration(gradient: AppColors.heroGradient),
      child: ListView(
        padding: SppLayout.screenPadding(top: 20),
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
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SppSafeText(planLabel, maxLines: 2, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
                          const SizedBox(height: 2),
                          const Text('Professional Plan', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SppSafeText(
                  priceLabel,
                  maxLines: 1,
                  minFontSize: 18,
                  style: const TextStyle(color: AppColors.teal, fontSize: 32, fontWeight: FontWeight.w900),
                ),
                if (sub.message.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  SppSafeText(sub.message, maxLines: 3, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                ],
                const SizedBox(height: 20),
                ..._features.map(
                  (f) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: AppColors.teal, size: 22),
                        const SizedBox(width: 12),
                        Expanded(child: SppSafeText(f, maxLines: 2, style: const TextStyle(color: Colors.white, fontSize: 15))),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.brand.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.brand.withValues(alpha: 0.35)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(state.isLiveData ? Icons.cloud_done_rounded : Icons.cloud_off_rounded, color: AppColors.teal, size: 20),
                      const SizedBox(width: 8),
                      SppSafeText(
                        state.isLiveData ? 'متصل بالمنصة — قراءة فقط' : 'وضع محلي — قراءة فقط',
                        maxLines: 1,
                        minFontSize: 10,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _InfoRow(label: 'الحالة', value: status),
          _InfoRow(label: 'ينتهي', value: settings?.subscriptionEnd ?? '—'),
          _InfoRow(label: 'العميل', value: settings?.clientName ?? '—'),
          SppSafeText('Build: ${ApiConstants.buildTag}', maxLines: 1, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
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
            SppSafeText(label, maxLines: 1, style: const TextStyle(color: AppColors.textSecondary)),
            const SizedBox(width: 12),
            Expanded(
              child: SppSafeText(value, maxLines: 2, minFontSize: 10, textAlign: TextAlign.end, style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }
}
