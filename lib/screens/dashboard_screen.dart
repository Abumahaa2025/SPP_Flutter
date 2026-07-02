import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = const ApiService();
  DashboardStats? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final stats = await _api.fetchDashboard();
    if (!mounted) return;
    setState(() {
      _stats = stats;
      _loading = false;
    });
  }

  String _formatCurrency(int amount) {
    return '${amount.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]},',
        )} ر.س';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _stats == null) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }

    final stats = _stats!;

    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'مرحباً، ${DemoData.userName}',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            DemoData.propertyName,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade600,
                ),
          ),
          const SizedBox(height: 20),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.35,
            children: [
              StatCard(
                label: 'وحدات مشغولة',
                value: '${stats.occupiedUnits}',
                icon: Icons.home_work_outlined,
              ),
              StatCard(
                label: 'وحدات شاغرة',
                value: '${stats.vacantUnits}',
                icon: Icons.meeting_room_outlined,
                color: Colors.orange,
              ),
              StatCard(
                label: 'مدفوعات متأخرة',
                value: '${stats.latePayments}',
                icon: Icons.warning_amber_rounded,
                color: Colors.red,
              ),
              StatCard(
                label: 'بلاغات مفتوحة',
                value: '${stats.openTickets}',
                icon: Icons.build_circle_outlined,
                color: Colors.blue,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.payments_outlined, color: AppTheme.primary),
                      const SizedBox(width: 8),
                      Text(
                        'ملخص الشهر',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _formatCurrency(stats.monthlyRevenue),
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primary,
                        ),
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: stats.collectionRate / 100,
                    backgroundColor: Colors.grey.shade200,
                    color: AppTheme.primary,
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'نسبة التحصيل ${stats.collectionRate.toStringAsFixed(1)}%',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
