import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';

class SppApp extends StatefulWidget {
  const SppApp({super.key});

  @override
  State<SppApp> createState() => _SppAppState();
}

class _SppAppState extends State<SppApp> {
  bool _loggedIn = false;

  void _login() => setState(() => _loggedIn = true);
  void _logout() => setState(() => _loggedIn = false);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'تميّز العقار الذكي',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      locale: const Locale('ar'),
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        );
      },
      home: _loggedIn
          ? HomeShell(onLogout: _logout)
          : LoginScreen(onLogin: _login),
    );
  }
}
