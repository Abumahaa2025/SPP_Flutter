import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../services/api_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key, required this.onLogout});

  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    const api = ApiService();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: ListTile(
            leading: const CircleAvatar(
              backgroundColor: AppTheme.primary,
              child: Icon(Icons.person, color: Colors.white),
            ),
            title: Text(
              DemoData.userName,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            subtitle: Text(DemoData.propertyName),
            trailing: Chip(
              label: Text('تجريبي · ${DemoData.trialDaysLeft} يوم'),
              backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
              labelStyle: const TextStyle(
                color: AppTheme.primary,
                fontWeight: FontWeight.w600,
                fontSize: 11,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'التطبيق',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 8),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.language, color: AppTheme.primary),
                title: const Text('اللغة'),
                subtitle: const Text('العربية (RTL)'),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.notifications_outlined, color: AppTheme.primary),
                title: const Text('الإشعارات'),
                trailing: Switch(value: true, onChanged: (_) {}),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.dark_mode_outlined, color: AppTheme.primary),
                title: const Text('الوضع الليلي'),
                trailing: Switch(value: false, onChanged: (_) {}),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'التكامل',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.cloud_outlined, color: AppTheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Apps Script',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'قريباً — ربط مباشر مع المنصة',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                ),
                const SizedBox(height: 12),
                SelectableText(
                  api.endpointHint,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.primaryDark,
                        fontFamily: 'monospace',
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Build: ${ApiConstants.buildTag}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade500,
                      ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: onLogout,
          icon: const Icon(Icons.logout, color: Colors.red),
          label: const Text('تسجيل الخروج', style: TextStyle(color: Colors.red)),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
            side: const BorderSide(color: Colors.red),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      ],
    );
  }
}
