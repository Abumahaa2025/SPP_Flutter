import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/constants/api_constants.dart';
import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/glass_card.dart';

class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final sub = context.watch<AppState>().platform?.subscription;
    final settings = context.watch<AppState>().platform?.settings;

    if (sub == null) {
      return const Center(child: Text('لا بيانات اشتراك'));
    }

    final isActive = sub.active;
    final accent = isActive ? AppColors.success : AppColors.danger;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        GlassCard(
          child: Column(
            children: [
              Icon(
                isActive ? Icons.verified_user : Icons.lock_clock,
                size: 56,
                color: accent,
              ),
              const SizedBox(height: 16),
              Text(
                isActive ? 'اشتراكك نشط' : 'الاشتراك يحتاج تجديد',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              Text(
                sub.message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              if (sub.daysLeft != null) ...[
                const SizedBox(height: 16),
                Text(
                  '${sub.daysLeft} يوم متبقٍ',
                  style: TextStyle(color: accent, fontWeight: FontWeight.w800, fontSize: 18),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        _InfoRow(label: 'الحالة', value: sub.status ?? settings?.subscriptionStatus ?? '—'),
        _InfoRow(label: 'ينتهي', value: settings?.subscriptionEnd ?? '—'),
        _InfoRow(label: 'العميل', value: settings?.clientName ?? '—'),
        _InfoRow(label: 'العقار', value: settings?.propertyName ?? '—'),
        const SizedBox(height: 24),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('الباقات الاحترافية', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 8),
              const Text(
                'لترقية أو تجديد الاشتراك، تواصل مع إدارة المنصة أو استخدم بوابة الويب.',
                style: TextStyle(color: AppColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 12),
              Text('Build: ${ApiConstants.buildTag}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
            ],
          ),
        ),
      ],
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
