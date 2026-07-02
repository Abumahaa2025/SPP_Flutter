import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import '../widgets/empty_state.dart';
import '../widgets/reference_widgets.dart';

class SmartInboxScreen extends StatefulWidget {
  const SmartInboxScreen({super.key});

  @override
  State<SmartInboxScreen> createState() => _SmartInboxScreenState();
}

class _SmartInboxScreenState extends State<SmartInboxScreen> {
  int _filter = 0;
  static const _filters = ['الكل', 'معلومات', 'تنبيهات', 'مهم'];

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    final alerts = _buildAlerts(data);

    final filtered = _filter == 0
        ? alerts
        : alerts.where((a) {
            if (_filter == 1) return a.type == 0;
            if (_filter == 2) return a.type == 1;
            return a.type == 2;
          }).toList();

    return ColoredBox(
      color: AppColors.bgLight,
      child: RefreshIndicator(
        color: AppColors.teal,
        onRefresh: () => context.read<AppState>().refresh(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
          children: [
            const Text(
              'الإشعارات الذكية',
              style: TextStyle(color: AppColors.textDark, fontSize: 24, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 16),
            FilterPills(labels: _filters, selected: _filter, onSelected: (i) => setState(() => _filter = i), light: true),
            const SizedBox(height: 20),
            if (filtered.isEmpty)
              const EmptyState(
                light: true,
                icon: PremiumIcons.inbox,
                title: 'لا إشعارات في هذا التصنيف',
                subtitle: 'ستظهر التنبيهات والرسائل هنا فور وصولها',
              )
            else
              ...filtered.asMap().entries.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _NotificationCard(alert: e.value).animate(delay: (60 * e.key).ms).fadeIn().slideX(begin: 0.04),
                    ),
                  ),
          ],
        ),
      ),
    );
  }

  List<_AlertData> _buildAlerts(PlatformData data) {
    final alerts = <_AlertData>[
      for (final m in data.maintenanceRequests.where((x) => x.isOpen))
        _AlertData(
          title: m.type,
          location: '${m.unit} — ${m.tenant}',
          time: m.reportedAt ?? 'الآن',
          icon: m.type.contains('ماء') || m.type.contains('تسريب') ? PremiumIcons.water : PremiumIcons.maintenance,
          color: m.isUrgent ? AppColors.danger : AppColors.info,
          type: 1,
        ),
      for (final p in data.predictions.where((x) => x.isHighRisk))
        _AlertData(
          title: p.title,
          location: p.description,
          time: 'تنبيه ذكي',
          icon: PremiumIcons.warning,
          color: AppColors.warning,
          type: 2,
        ),
      for (final m in data.messages)
        _AlertData(
          title: m.category,
          location: _maskPhone(m.phone),
          time: '${m.date} ${m.time}',
          icon: PremiumIcons.chat,
          color: AppColors.teal,
          type: 0,
        ),
    ];
    return alerts;
  }

  static String _maskPhone(String phone) {
    if (phone.length < 6) return phone;
    return '${phone.substring(0, 3)} ••• ${phone.substring(phone.length - 3)}';
  }
}

class _AlertData {
  const _AlertData({
    required this.title,
    required this.location,
    required this.time,
    required this.icon,
    required this.color,
    required this.type,
  });

  final String title;
  final String location;
  final String time;
  final IconData icon;
  final Color color;
  final int type;
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.alert});
  final _AlertData alert;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: alert.color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(alert.icon, color: alert.color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(alert.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 4),
                Text(alert.location, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textDarkSecondary, fontSize: 12)),
                const SizedBox(height: 4),
                Text(alert.time, style: TextStyle(color: alert.color, fontSize: 11, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
