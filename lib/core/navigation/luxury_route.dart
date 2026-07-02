import 'package:flutter/material.dart';

class LuxuryPageRoute<T> extends PageRouteBuilder<T> {
  LuxuryPageRoute({required this.page, this.heroTag})
      : super(
          transitionDuration: const Duration(milliseconds: 520),
          reverseTransitionDuration: const Duration(milliseconds: 420),
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final curved = CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutCubic,
              reverseCurve: Curves.easeInCubic,
            );
            final offset = Tween<Offset>(
              begin: const Offset(0, 0.04),
              end: Offset.zero,
            ).animate(curved);

            return FadeTransition(
              opacity: curved,
              child: SlideTransition(
                position: offset,
                child: ScaleTransition(
                  scale: Tween<double>(begin: 0.94, end: 1).animate(curved),
                  child: child,
                ),
              ),
            );
          },
        );

  final Widget page;
  final Object? heroTag;
}

void pushLuxury(BuildContext context, Widget page) {
  Navigator.of(context).push(LuxuryPageRoute(page: page));
}
