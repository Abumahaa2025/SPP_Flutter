import 'dart:ui';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// White performance card like reference dashboard.
class PerformanceSummaryCard extends StatelessWidget {
  const PerformanceSummaryCard({
    super.key,
    required this.score,
    required this.trend,
    required this.chartData,
    required this.stats,
  });

  final int score;
  final String trend;
  final List<double> chartData;
  final List<({String label, String value, IconData icon, Color color})> stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 32,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ملخص اليوم',
            style: TextStyle(
              color: AppColors.textDarkSecondary,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 12),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerRight,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '$score%',
                  style: TextStyle(
                    color: AppColors.textDark,
                    fontSize: MediaQuery.sizeOf(context).width < 360 ? 40 : 48,
                    fontWeight: FontWeight.w900,
                    height: 1,
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    trend,
                    style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 80,
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: chartData.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value)).toList(),
                    isCurved: true,
                    color: AppColors.success,
                    barWidth: 3,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppColors.success.withValues(alpha: 0.25),
                          AppColors.success.withValues(alpha: 0.02),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final aspect = constraints.maxWidth < 340 ? 2.0 : 2.35;
              return GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: aspect,
                children: stats.map((s) => _StatTile(label: s.label, value: s.value, icon: s.icon, color: s.color)).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value, required this.icon, required this.color});

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.bgLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.w900, fontSize: 16)),
                Text(label, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textDarkSecondary, fontSize: 11, height: 1.25)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Purple AI assistant banner from reference.
class AiAssistantBanner extends StatelessWidget {
  const AiAssistantBanner({super.key, required this.recommendationCount, required this.onTap});

  final int recommendationCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final narrow = MediaQuery.sizeOf(context).width < 360;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: AppColors.aiBannerGradient,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AppColors.aiPurple.withValues(alpha: 0.35),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: narrow
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _bannerText(),
                  const SizedBox(height: 14),
                  _bannerButton(),
                ],
              )
            : Row(
                children: [
                  Expanded(child: _bannerText()),
                  const SizedBox(width: 12),
                  _bannerButton(),
                ],
              ),
      ),
    );
  }

  Widget _bannerText() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'المساعد الذكي',
          style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        Text(
          'لدي $recommendationCount توصيات ذكية لك اليوم',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15, height: 1.4),
        ),
      ],
    );
  }

  Widget _bannerButton() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white30),
      ),
      child: const Text(
        'عرض التوصيات',
        textAlign: TextAlign.center,
        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
      ),
    );
  }
}

/// Cityscape header background.
class CityscapeHeader extends StatelessWidget {
  const CityscapeHeader({super.key, required this.child, this.height = 200});

  final Widget child;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Container(
            decoration: BoxDecoration(gradient: AppColors.cityGradient),
          ),
          CustomPaint(painter: _CityscapePainter()),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, AppColors.bgDeep.withValues(alpha: 0.85)],
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}

class _CityscapePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF1E293B);
    final glow = Paint()..color = const Color(0xFF334155).withValues(alpha: 0.6);

    final buildings = [
      Rect.fromLTWH(size.width * 0.05, size.height * 0.45, size.width * 0.12, size.height * 0.55),
      Rect.fromLTWH(size.width * 0.18, size.height * 0.3, size.width * 0.1, size.height * 0.7),
      Rect.fromLTWH(size.width * 0.3, size.height * 0.5, size.width * 0.14, size.height * 0.5),
      Rect.fromLTWH(size.width * 0.48, size.height * 0.25, size.width * 0.11, size.height * 0.75),
      Rect.fromLTWH(size.width * 0.62, size.height * 0.4, size.width * 0.13, size.height * 0.6),
      Rect.fromLTWH(size.width * 0.78, size.height * 0.35, size.width * 0.1, size.height * 0.65),
      Rect.fromLTWH(size.width * 0.9, size.height * 0.48, size.width * 0.08, size.height * 0.52),
    ];

    for (final r in buildings) {
      canvas.drawRRect(RRect.fromRectAndRadius(r, const Radius.circular(4)), paint);
      for (var i = 0; i < 4; i++) {
        final win = Rect.fromLTWH(
          r.left + 6,
          r.top + 10 + i * 14,
          r.width - 12,
          6,
        );
        canvas.drawRRect(RRect.fromRectAndRadius(win, const Radius.circular(2)), glow);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Filter pills like reference.
class FilterPills extends StatelessWidget {
  const FilterPills({
    super.key,
    required this.labels,
    required this.selected,
    required this.onSelected,
    this.light = false,
  });

  final List<String> labels;
  final int selected;
  final ValueChanged<int> onSelected;
  final bool light;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: labels.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final active = i == selected;
          return GestureDetector(
            onTap: () => onSelected(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              decoration: BoxDecoration(
                color: active
                    ? (light ? AppColors.teal : AppColors.teal)
                    : (light ? AppColors.cardLight : AppColors.bgElevated.withValues(alpha: 0.8)),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: active ? AppColors.teal : (light ? AppColors.borderLight : AppColors.border),
                ),
                boxShadow: light && active
                    ? [BoxShadow(color: AppColors.teal.withValues(alpha: 0.25), blurRadius: 8)]
                    : null,
              ),
              child: Text(
                labels[i],
                style: TextStyle(
                  color: active ? Colors.white : (light ? AppColors.textDarkSecondary : AppColors.textSecondary),
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Glass pill button for AI screen.
class GlassPromptPill extends StatelessWidget {
  const GlassPromptPill({super.key, required this.text, required this.onTap});

  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
            ),
            child: Text(
              text,
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600, height: 1.35),
            ),
          ),
        ),
      ),
    );
  }
}

/// Circular progress ring for analytics.
class RingProgress extends StatelessWidget {
  const RingProgress({super.key, required this.label, required this.value, required this.color});

  final String label;
  final double value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 20, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        children: [
          SizedBox(
            width: 80,
            height: 80,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: value / 100,
                  strokeWidth: 8,
                  backgroundColor: color.withValues(alpha: 0.12),
                  color: color,
                ),
                Text('${value.toInt()}%', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: color)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(label, style: const TextStyle(color: AppColors.textDarkSecondary, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
