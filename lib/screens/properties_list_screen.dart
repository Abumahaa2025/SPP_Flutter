import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/layout/spp_layout.dart';
import '../core/navigation/luxury_route.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../models/platform_data.dart';
import '../providers/app_state.dart';
import 'property_map_screen.dart';

class PropertiesListScreen extends StatelessWidget {
  const PropertiesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.watch<AppState>().platform;
    if (data == null) return const SizedBox.shrink();

    final properties = _buildPortfolio(data);

    return Stack(
      children: [
        ListView.builder(
          padding: SppLayout.listPadding(),
          itemCount: properties.length,
          itemBuilder: (context, i) {
            final p = properties[i];
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _PropertyCard(item: p, index: i),
            );
          },
        ),
        Positioned(
          bottom: 100,
          left: 20,
          child: FloatingActionButton(
            heroTag: 'map-fab',
            onPressed: () => pushLuxury(context, const PropertyMapScreen()),
            backgroundColor: AppColors.teal,
            child: const Icon(PremiumIcons.map, color: Colors.white),
          ),
        ),
        Positioned(
          bottom: 100,
          right: 20,
          child: FloatingActionButton(
            heroTag: 'add-fab',
            onPressed: () {},
            backgroundColor: AppColors.teal,
            child: const Icon(PremiumIcons.add, color: Colors.white),
          ),
        ),
      ],
    );
  }

  static List<_PropertyItem> _buildPortfolio(PlatformData data) {
    final score = data.propertyHealth.score;
    final summary = data.dashboard.summary;
    final items = <_PropertyItem>[
      _PropertyItem(
        name: data.propertyName,
        location: '${summary.rented} مؤجرة · ${summary.vacant} شاغرة · ${summary.totalUnits} وحدة',
        score: score,
        color: AppColors.brand,
      ),
    ];

    for (final u in data.dashboard.units.take(6)) {
      final late = u.payStatus?.contains('متأخر') == true;
      items.add(
        _PropertyItem(
          name: u.unit,
          location: u.tenant.isNotEmpty ? u.tenant : 'بدون مستأجر',
          score: late ? 68 : 88,
          color: late ? AppColors.warning : AppColors.success,
        ),
      );
    }
    return items;
  }
}

class _PropertyItem {
  const _PropertyItem({required this.name, required this.location, required this.score, required this.color});
  final String name;
  final String location;
  final int score;
  final Color color;
}

class _PropertyCard extends StatelessWidget {
  const _PropertyCard({required this.item, required this.index});
  final _PropertyItem item;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 110),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 20, offset: const Offset(0, 8)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 100,
            constraints: const BoxConstraints(minHeight: 110),
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.horizontal(right: Radius.circular(22)),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [item.color.withValues(alpha: 0.8), item.color.withValues(alpha: 0.3)],
              ),
            ),
            child: const Icon(PremiumIcons.property, color: Colors.white54, size: 48),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(item.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 4),
                  Text(item.location, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Text('${item.score}%', style: TextStyle(color: item.color, fontWeight: FontWeight.w900, fontSize: 22)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: item.score / 100,
                            minHeight: 5,
                            backgroundColor: AppColors.border,
                            color: item.color,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate(delay: (80 * index).ms).fadeIn().slideX(begin: 0.05);
  }
}
