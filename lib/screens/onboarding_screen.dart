import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../widgets/ai_orb.dart';
import '../widgets/glass_card.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _page = PageController();
  int _index = 0;

  static const _slides = [
    _Slide(
      title: 'موظفك العقاري الذكي',
      body: 'شريك يفكر معك، يحلل وضع العقار، ويقترح القرار التالي في الوقت المناسب.',
      icon: PremiumIcons.assistant,
    ),
    _Slide(
      title: 'قرارات لا أرقام',
      body: 'لوحة ذكية تخبرك ماذا تفعل الآن — قبل أن تسأل.',
      icon: PremiumIcons.analytics,
    ),
    _Slide(
      title: 'عقار يتذكر',
      body: 'ذاكرة عقارية، مراقبة ذكية، وتحليلات موحدة في منصة واحدة.',
      icon: PremiumIcons.brain,
    ),
  ];

  void _next() {
    if (_index < _slides.length - 1) {
      _page.nextPage(duration: 500.ms, curve: Curves.easeOutCubic);
    } else {
      widget.onComplete();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBackground(
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(24),
              child: Align(
                alignment: Alignment.centerLeft,
                child: LuxuryBadge(label: 'PRO ${_index + 1}/${_slides.length}'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _page,
                onPageChanged: (i) => setState(() => _index = i),
                itemCount: _slides.length,
                itemBuilder: (context, i) {
                  final slide = _slides[i];
                  return LayoutBuilder(
                    builder: (context, constraints) {
                      final compact = constraints.maxHeight < 420;
                      return SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 28),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(minHeight: constraints.maxHeight),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              AiOrb(size: compact ? 88 : 110, luxury: true),
                              SizedBox(height: compact ? 24 : 40),
                              Icon(slide.icon, size: compact ? 44 : 52, color: AppColors.gold),
                              const SizedBox(height: 24),
                              Text(
                                slide.title,
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
                              ),
                              const SizedBox(height: 14),
                              Text(
                                slide.body,
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                      color: AppColors.textSecondary,
                                      height: 1.7,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _slides.length,
                (i) => AnimatedContainer(
                  duration: 300.ms,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: i == _index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    gradient: i == _index ? AppColors.goldGradient : null,
                    color: i == _index ? null : AppColors.border,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  LuxuryButton(
                    label: _index < _slides.length - 1 ? 'التالي' : 'ابدأ التجربة',
                    icon: PremiumIcons.arrow,
                    onPressed: _next,
                  ),
                  if (_index < _slides.length - 1)
                    TextButton(
                      onPressed: widget.onComplete,
                      child: const Text('تخطي', style: TextStyle(color: AppColors.textMuted)),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Slide {
  const _Slide({required this.title, required this.body, required this.icon});
  final String title;
  final String body;
  final IconData icon;
}
