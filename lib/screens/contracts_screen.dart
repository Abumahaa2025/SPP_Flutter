import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import '../widgets/empty_state.dart';
import '../widgets/glass_card.dart';

class ContractsScreen extends StatelessWidget {
  const ContractsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('العقود'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'الكل'),
              Tab(text: 'قريبة'),
              Tab(text: 'منتهية'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _ContractList(units: data.dashboard.units),
            _ContractList(units: data.dashboard.nearContracts),
            _ContractList(units: data.dashboard.expiredContracts),
          ],
        ),
      ),
    );
  }
}

class _ContractList extends StatelessWidget {
  const _ContractList({required this.units});

  final List<UnitRow> units;

  @override
  Widget build(BuildContext context) {
    if (units.isEmpty) {
      return const EmptyState(
        icon: PremiumIcons.contract,
        title: 'لا عقود في هذا القسم',
        subtitle: 'ستظهر العقود النشطة والمنتهية هنا',
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: units.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final u = units[index];
        return GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(u.tenant, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 6),
              Text(u.unit, style: const TextStyle(color: AppColors.accent)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Text('${u.rent} ر.س', style: const TextStyle(fontWeight: FontWeight.w700)),
                  const Spacer(),
                  if (u.expiryDate != null)
                    Text('ينتهي ${u.expiryDate}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ],
              ),
              if (u.payStatus != null && u.payStatus!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(u.payStatus!, style: TextStyle(color: u.payStatus!.contains('متأخر') ? AppColors.danger : AppColors.success, fontSize: 12)),
              ],
            ],
          ),
        );
      },
    );
  }
}
