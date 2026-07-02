import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/theme/app_colors.dart';
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
      body: 'ليس برنامج إدارة — شريك يفكر، يحلل، ويقترح القرار التالي.',
      icon: Icons.psychology_alt_rounded,
    ),
    _Slide(
      title: 'قرارات لا أرقام',
      body: 'لوحة ذكية تخبرك ماذا تفعل الآن — قبل أن تسأل.',
      icon: Icons.insights_rounded,
    ),
    _Slide(
      title: 'عقار يتذكر',
      body: 'Property Memory + Virtual Sensors + Unified Brain في منصة واحدة.',
      icon: Icons.hub_rounded,
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
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 28),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AiOrb(size: 110, luxury: true, pulsing: i == 0),
                        const SizedBox(height: 40),
                        Icon(slide.icon, size: 52, color: AppColors.gold),
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
                    icon: Icons.arrow_back,
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
