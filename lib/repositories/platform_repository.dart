import '../data/luxury_mock.dart';
import '../models/platform_data.dart';
import '../services/api_service.dart';

enum DataSource { live, cached }

class LoadResult {
  const LoadResult({required this.data, required this.source, this.notice});

  final PlatformData data;
  final DataSource source;
  final String? notice;

  bool get isLive => source == DataSource.live;
}

/// طبقة قراءة read-only — API أولاً، fallback للبيانات المحلية.
class PlatformRepository {
  PlatformRepository({ApiService? api}) : _api = api ?? ApiService();

  final ApiService _api;

  Future<LoadResult> loadPlatform({bool forceRefresh = false}) async {
    try {
      final data = await _api.fetchPlatform(forceRefresh: forceRefresh);
      return LoadResult(data: data, source: DataSource.live);
    } catch (_) {
      return LoadResult(
        data: LuxuryMock.build(),
        source: DataSource.cached,
        notice: 'تعذّر الاتصال بالمنصة — يتم عرض نسخة محلية مؤقتة',
      );
    }
  }

  Future<bool> ping() async {
    try {
      return await _api.ping();
    } catch (_) {
      return false;
    }
  }

  void dispose() => _api.dispose();
}
