import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/layout/spp_layout.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import '../widgets/empty_state.dart';
import '../widgets/reference_widgets.dart';

class MaintenanceTabScreen extends StatefulWidget {
  const MaintenanceTabScreen({super.key});

  @override
  State<MaintenanceTabScreen> createState() => _MaintenanceTabScreenState();
}

class _MaintenanceTabScreenState extends State<MaintenanceTabScreen> {
  int _tab = 0;
  static const _tabs = ['الكل', 'جديد', 'قيد التنفيذ', 'مكتمل'];

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    final items = data.maintenanceRequests;
    final filtered = switch (_tab) {
      1 => items.where((m) => m.status == 'جديد').toList(),
      2 => items.where((m) => m.status == 'قيد التنفيذ').toList(),
      3 => items.where((m) => !m.isOpen).toList(),
      _ => items,
    };

    return ColoredBox(
      color: AppColors.bgLight,
      child: RefreshIndicator(
        color: AppColors.teal,
        onRefresh: () => context.read<AppState>().refresh(),
        child: ListView(
          padding: SppLayout.listPadding(light: true),
          children: [
            const Text(
              'طلبات الصيانة',
              style: TextStyle(color: AppColors.textDark, fontSize: 24, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 16),
            FilterPills(labels: _tabs, selected: _tab, onSelected: (i) => setState(() => _tab = i), light: true),
            const SizedBox(height: 20),
            if (filtered.isEmpty)
              const EmptyState(
                light: true,
                icon: PremiumIcons.maintenance,
                title: 'لا طلبات في هذا القسم',
                subtitle: 'جميع البلاغات مُعالجة — الوضع مستقر',
              )
            else
              ...filtered.map((m) => Padding(padding: const EdgeInsets.only(bottom: 12), child: _MaintCard(item: m))),
          ],
        ),
      ),
    );
  }
}

class _MaintCard extends StatelessWidget {
  const _MaintCard({required this.item});
  final MaintenanceItem item;

  Color get _statusColor {
    if (item.status == 'جديد') return AppColors.info;
    if (item.status == 'قيد التنفيذ') return AppColors.teal;
    return AppColors.success;
  }

  IconData get _icon {
    if (item.type.contains('تكييف')) return PremiumIcons.ac;
    if (item.type.contains('ماء') || item.type.contains('تسريب')) return PremiumIcons.plumbing;
    return PremiumIcons.build;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 5,
              decoration: BoxDecoration(
                color: _statusColor,
                borderRadius: const BorderRadius.horizontal(right: Radius.circular(20)),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: _statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(_icon, color: _statusColor, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.type, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.w800, fontSize: 15)),
                          const SizedBox(height: 4),
                          Text('${item.unit} — ${item.tenant}', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textDarkSecondary, fontSize: 12)),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: _statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(item.status, style: TextStyle(color: _statusColor, fontSize: 11, fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(item.reportedAt ?? '', style: const TextStyle(color: AppColors.textDarkSecondary, fontSize: 11)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
