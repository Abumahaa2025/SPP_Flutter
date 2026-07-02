import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/navigation/luxury_route.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../providers/app_state.dart';
import '../widgets/ai_orb.dart';
import 'brain_hub_screen.dart';
import 'maintenance_tab_screen.dart';
import 'more_hub_screen.dart';
import 'properties_list_screen.dart';
import 'smart_inbox_screen.dart';
import 'subscription_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.onLogout});

  final VoidCallback onLogout;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  late final _pages = [
    const BrainHubScreen(),
    const SmartInboxScreen(),
    const MaintenanceTabScreen(),
    const PropertiesListScreen(),
    MoreHubScreen(onLogout: widget.onLogout),
  ];

  @override
  Widget build(BuildContext context) {
    final sub = context.watch<AppState>().platform?.subscription;
    final needsSubscription = sub != null && !sub.active;
    final isLightTab = _index == 1 || _index == 2;

    return AnimatedBackground(
      child: Scaffold(
        backgroundColor: isLightTab ? AppColors.bgLight : Colors.transparent,
        extendBody: true,
        body: Stack(
          children: [
            IndexedStack(index: _index, children: _pages),
            if (needsSubscription)
              _SubscriptionOverlay(
                onView: () => pushLuxury(context, const SubscriptionScreen()),
              ),
          ],
        ),
        bottomNavigationBar: _RefNavBar(
          index: _index,
          onChanged: (i) => setState(() => _index = i),
        ),
      ),
    );
  }
}

class _RefNavBar extends StatelessWidget {
  const _RefNavBar({required this.index, required this.onChanged});

  final int index;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      decoration: BoxDecoration(
        color: AppColors.bgCard.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 24, offset: const Offset(0, 10)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: onChanged,
          backgroundColor: Colors.transparent,
          elevation: 0,
          height: 68,
          labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
          indicatorColor: AppColors.teal.withValues(alpha: 0.15),
          destinations: const [
            NavigationDestination(icon: Icon(PremiumIcons.home), selectedIcon: Icon(PremiumIcons.home, color: AppColors.teal), label: 'الرئيسية'),
            NavigationDestination(icon: Icon(PremiumIcons.inbox), selectedIcon: Icon(PremiumIcons.inbox, color: AppColors.teal), label: 'الوارد'),
            NavigationDestination(icon: Icon(PremiumIcons.maintenance), selectedIcon: Icon(PremiumIcons.maintenance, color: AppColors.teal), label: 'الصيانة'),
            NavigationDestination(icon: Icon(PremiumIcons.property), selectedIcon: Icon(PremiumIcons.property, color: AppColors.teal), label: 'العقارات'),
            NavigationDestination(icon: Icon(PremiumIcons.more), selectedIcon: Icon(PremiumIcons.more, color: AppColors.teal), label: 'المزيد'),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.15);
  }
}

class _SubscriptionOverlay extends StatelessWidget {
  const _SubscriptionOverlay({required this.onView});
  final VoidCallback onView;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const LivingAiOrb(size: 90, luxury: true),
              const SizedBox(height: 20),
              const Text('الاشتراك منتهٍ', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              const Text('يمكنك الاستعراض فقط — جدّد الاشتراك للمتابعة', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 20),
              FilledButton(onPressed: onView, child: const Text('عرض الاشتراك')),
            ],
          ),
        ),
      ),
    );
  }
}
