import '../core/network/api_client.dart';
import '../models/platform_data.dart';

class ApiService {
  ApiService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<PlatformData> fetchPlatform({bool forceRefresh = false}) async {
    final data = await _client.getData<Map<String, dynamic>>(
      'getAppData',
      params: forceRefresh ? {'forceRefresh': 'true'} : null,
      parser: (json) => Map<String, dynamic>.from(json as Map),
    );
    return PlatformData.fromJson(data);
  }

  Future<SubscriptionInfo> fetchSubscription() async {
    final data = await _client.getData<Map<String, dynamic>>(
      'getSubscription',
      parser: (json) => Map<String, dynamic>.from(json as Map),
    );
    return SubscriptionInfo.fromJson(data);
  }

  Future<dynamic> fetchSmartAnalysis() async {
    return _client.getData('getSmartAnalysis', parser: (json) => json);
  }

  Future<List<PredictionItem>> fetchPredictions() async {
    return _client.getData<List<PredictionItem>>(
      'getPredictions',
      parser: (json) {
        if (json is! List) return [];
        return json
            .whereType<Map>()
            .map((e) => PredictionItem.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      },
    );
  }

  Future<bool> ping() => _client.ping();

  void dispose() => _client.dispose();
}
