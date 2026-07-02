import 'package:flutter/foundation.dart';

import '../models/platform_data.dart';
import '../services/api_service.dart';
import '../services/platform_brain.dart';

enum AppLoadState { idle, loading, ready, error }

class AppState extends ChangeNotifier {
  AppState({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  AppLoadState state = AppLoadState.idle;
  PlatformData? platform;
  List<BrainMessage> chat = [];
  String? errorMessage;
  bool authenticated = false;

  bool get isLoading => state == AppLoadState.loading;
  bool get hasData => platform != null && state == AppLoadState.ready;

  Future<void> connect() async {
    state = AppLoadState.loading;
    errorMessage = null;
    notifyListeners();

    try {
      await _api.ping();
      final data = await _api.fetchPlatform(forceRefresh: true);
      platform = data;
      state = AppLoadState.ready;
      authenticated = true;
      chat = PlatformBrain.initialBriefing(data);
    } catch (e) {
      state = AppLoadState.error;
      errorMessage = e.toString();
      platform = PlatformData.empty(error: errorMessage);
    }
    notifyListeners();
  }

  Future<void> refresh() async {
    if (!authenticated) return;
    try {
      final data = await _api.fetchPlatform(forceRefresh: true);
      platform = data;
      state = AppLoadState.ready;
      errorMessage = null;
    } catch (e) {
      errorMessage = e.toString();
    }
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
    authenticated = false;
    platform = null;
    chat = [];
    state = AppLoadState.idle;
    notifyListeners();
  }

  @override
  void dispose() {
    _api.dispose();
    super.dispose();
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
