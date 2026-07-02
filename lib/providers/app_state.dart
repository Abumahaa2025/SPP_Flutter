import 'package:flutter/foundation.dart';

import '../models/platform_data.dart';
import '../repositories/platform_repository.dart';
import '../services/platform_brain.dart';

enum AppLoadState { splash, onboarding, login, loading, ready }

class AppState extends ChangeNotifier {
  AppState({PlatformRepository? repository}) : _repository = repository ?? PlatformRepository();

  final PlatformRepository _repository;

  AppLoadState flow = AppLoadState.splash;
  PlatformData? platform;
  List<BrainMessage> chat = [];
  DataSource dataSource = DataSource.cached;
  String? connectionNotice;
  bool isRefreshing = false;

  bool get isLoading => flow == AppLoadState.loading;
  bool get authenticated => flow == AppLoadState.ready;
  bool get isLiveData => dataSource == DataSource.live;

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

    final result = await _repository.loadPlatform();
    _applyLoadResult(result);

    chat = PlatformBrain.initialBriefing(platform!);
    flow = AppLoadState.ready;
    notifyListeners();
  }

  Future<void> refresh() async {
    if (isRefreshing) return;
    isRefreshing = true;
    notifyListeners();

    final result = await _repository.loadPlatform(forceRefresh: true);
    _applyLoadResult(result);

    isRefreshing = false;
    notifyListeners();
  }

  void _applyLoadResult(LoadResult result) {
    platform = result.data;
    dataSource = result.source;
    connectionNotice = result.notice;
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
    dataSource = DataSource.cached;
    connectionNotice = null;
    flow = AppLoadState.login;
    notifyListeners();
  }

  @override
  void dispose() {
    _repository.dispose();
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
