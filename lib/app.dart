import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/constants/api_constants.dart';
import 'core/theme/app_theme.dart';
import 'providers/app_state.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'widgets/ai_orb.dart';
import 'widgets/decision_card.dart';

class SppApp extends StatelessWidget {
  const SppApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(),
      child: MaterialApp(
        title: ApiConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark(),
        locale: const Locale('ar'),
        builder: (context, child) {
          return Directionality(
            textDirection: TextDirection.rtl,
            child: child ?? const SizedBox.shrink(),
          );
        },
        home: const _Root(),
      ),
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();

    if (!app.authenticated) {
      return const LoginScreen();
    }

    if (app.isLoading) {
      return const AnimatedBackground(
        child: LoadingBrain(),
      );
    }

    return HomeShell(
      onLogout: () => context.read<AppState>().logout(),
    );
  }
}
