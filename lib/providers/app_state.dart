import 'package:flutter/foundation.dart';

import '../data/luxury_mock.dart';
import '../models/platform_data.dart';
import '../services/platform_brain.dart';

enum AppLoadState { splash, onboarding, login, loading, ready }

/// وضع العرض الفاخر — بدون API أو Backend.
class AppState extends ChangeNotifier {
  AppLoadState flow = AppLoadState.splash;
  PlatformData? platform;
  List<BrainMessage> chat = [];

  bool get isLoading => flow == AppLoadState.loading;
  bool get authenticated => flow == AppLoadState.ready;

  void finishSplash() {
    flow = AppLoadState.onboarding;
    notifyListeners();
  }

  void finishOnboarding() {
    flow = AppLoadState.login;
    notifyListeners();
  }

  Future<void> enterExperience() async {
    flow = AppLoadState.loading;
    notifyListeners();

    await Future<void>.delayed(const Duration(milliseconds: 1800));

    platform = LuxuryMock.build();
    chat = PlatformBrain.initialBriefing(platform!);
    flow = AppLoadState.ready;
    notifyListeners();
  }

  Future<void> refresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    platform = LuxuryMock.build();
    notifyListeners();
  }

  void askBrain(String question) {
    if (platform == null) return;
    chat = [
      ...chat,
      BrainMessage.user(question),
      ...PlatformBrain.respond(platform!, question),
    ];
    notifyListeners();
  }

  void logout() {
    platform = null;
    chat = [];
    flow = AppLoadState.login;
    notifyListeners();
  }
}

class BrainMessage {
  const BrainMessage({
    required this.text,
    required this.isUser,
    this.isInsight = false,
  });

  factory BrainMessage.user(String text) => BrainMessage(text: text, isUser: true);
  factory BrainMessage.assistant(String text, {bool insight = false}) =>
      BrainMessage(text: text, isUser: false, isInsight: insight);

  final String text;
  final bool isUser;
  final bool isInsight;
}
