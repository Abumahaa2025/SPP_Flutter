import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/navigation/luxury_route.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../core/theme/spp_identity.dart';
import '../providers/app_state.dart';
import '../widgets/ai_orb.dart';
import 'ai_assistant_screen.dart';
import 'brain_hub_screen.dart';
import 'intelligence_hub_screen.dart';
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
    const PropertiesListScreen(),
    IntelligenceHubScreen(onLogout: widget.onLogout),
  ];

  @override
  Widget build(BuildContext context) {
    final sub = context.watch<AppState>().platform?.subscription;
    final needsSubscription = sub != null && !sub.active;
    final isLightTab = _index == 1;

    return AnimatedBackground(
      child: Scaffold(
        backgroundColor: isLightTab ? AppColors.bgLight : Colors.transparent,
        extendBody: true,
        body: Stack(
          children: [
            IndexedStack(index: _index, children: _pages),
            if (needsSubscription)
              _SubscriptionOverlay(onView: () => pushLuxury(context, const SubscriptionScreen())),
          ],
        ),
        floatingActionButton: _EmployeeFab(
          onTap: () => pushLuxury(context, const AiAssistantScreen()),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
        bottomNavigationBar: _SppNavBar(index: _index, onChanged: (i) => setState(() => _index = i)),
      ),
    );
  }
}

/// زر الموظف الذكي — محور التجربة (SPP 30%).
class _EmployeeFab extends StatelessWidget {
  const _EmployeeFab({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 28),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(color: AppColors.brandGlow.withValues(alpha: 0.45), blurRadius: 20, spreadRadius: 2),
        ],
      ),
      child: FloatingActionButton.large(
        onPressed: onTap,
        backgroundColor: AppColors.brand,
        elevation: 0,
        child: const Icon(PremiumIcons.assistant, color: Colors.white, size: 32),
      ),
    );
  }
}

class _SppNavBar extends StatelessWidget {
  const _SppNavBar({required this.index, required this.onChanged});

  final int index;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      decoration: BoxDecoration(
        color: AppColors.bgCard.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(SppIdentity.radiusXl),
        border: Border.all(color: AppColors.borderSubtle),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 8))],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(SppIdentity.radiusXl),
        child: BottomAppBar(
          color: Colors.transparent,
          elevation: 0,
          notchMargin: 8,
          shape: const CircularNotchedRectangle(),
          child: SizedBox(
            height: 64,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(icon: PremiumIcons.brain, label: 'العقل', selected: index == 0, onTap: () => onChanged(0)),
                _NavItem(icon: PremiumIcons.inbox, label: 'الوارد', selected: index == 1, onTap: () => onChanged(1)),
                const SizedBox(width: 56),
                _NavItem(icon: PremiumIcons.property, label: 'العقارات', selected: index == 2, onTap: () => onChanged(2)),
                _NavItem(icon: PremiumIcons.sensor, label: 'المنصة', selected: index == 3, onTap: () => onChanged(3)),
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.1);
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.icon, required this.label, required this.selected, required this.onTap});

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = selected ? AppColors.brandGlow : AppColors.textMuted;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: c, size: 22),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(color: c, fontSize: 10, fontWeight: selected ? FontWeight.w800 : FontWeight.w500)),
          ],
        ),
      ),
    );
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
