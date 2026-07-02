import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/ai_orb.dart';
import 'ai_assistant_screen.dart';
import 'brain_hub_screen.dart';
import 'more_hub_screen.dart';
import 'smart_dashboard_screen.dart';
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
    const SmartDashboardScreen(),
    const SmartInboxScreen(),
    MoreHubScreen(onLogout: widget.onLogout),
  ];

  @override
  Widget build(BuildContext context) {
    final sub = context.watch<AppState>().platform?.subscription;
    final needsSubscription = sub != null && !sub.active;

    return AnimatedBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(_titles[_index]),
          actions: [
            IconButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
              ),
              icon: const Icon(Icons.psychology_alt_outlined),
              tooltip: 'الموظف الذكي',
            ),
            IconButton(
              onPressed: () => context.read<AppState>().refresh(),
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: Stack(
          children: [
            IndexedStack(index: _index, children: _pages),
            if (needsSubscription)
              _SubscriptionOverlay(
                onView: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const SubscriptionScreen()),
                ),
              ),
          ],
        ),
        floatingActionButton: _index == 0
            ? null
            : Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  gradient: AppColors.goldGradient,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.gold.withValues(alpha: 0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: FloatingActionButton.extended(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
                  ),
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  icon: const Icon(Icons.chat_rounded, color: AppColors.bgDeep),
                  label: const Text('اسأل الذكي', style: TextStyle(color: AppColors.bgDeep, fontWeight: FontWeight.w800)),
                ),
              ),
        bottomNavigationBar: _ProNavBar(
          index: _index,
          onChanged: (i) => setState(() => _index = i),
        ),
      ),
    );
  }

  static const _titles = ['العقل المركزي', 'القرارات', 'الوارد الذكي', 'المزيد'];
}

class _ProNavBar extends StatelessWidget {
  const _ProNavBar({required this.index, required this.onChanged});

  final int index;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      decoration: BoxDecoration(
        color: AppColors.bgCard.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: onChanged,
          backgroundColor: Colors.transparent,
          elevation: 0,
          height: 68,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.hub_outlined),
              selectedIcon: Icon(Icons.hub),
              label: 'العقل',
            ),
            NavigationDestination(
              icon: Icon(Icons.insights_outlined),
              selectedIcon: Icon(Icons.insights),
              label: 'قرارات',
            ),
            NavigationDestination(
              icon: Icon(Icons.inbox_outlined),
              selectedIcon: Icon(Icons.inbox),
              label: 'وارد',
            ),
            NavigationDestination(
              icon: Icon(Icons.apps_outlined),
              selectedIcon: Icon(Icons.apps),
              label: 'المزيد',
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2);
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
              const AiOrb(size: 90, pulsing: false),
              const SizedBox(height: 20),
              const Text(
                'الاشتراك منتهٍ',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              const Text(
                'يمكنك الاستعراض فقط — جدّد الاشتراك للمتابعة',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: onView,
                child: const Text('عرض الاشتراك'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
