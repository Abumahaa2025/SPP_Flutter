import 'dart:convert';

import 'package:http/http.dart' as http;

import '../constants/api_constants.dart';

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<Map<String, dynamic>> getAction(
    String action, {
    Map<String, String>? params,
  }) async {
    final query = <String, String>{
      'view': 'api',
      'action': action,
      ...?params,
    };
    final uri = Uri.parse(ApiConstants.baseUrl).replace(queryParameters: query);

    final response = await _client.get(uri).timeout(const Duration(seconds: 45));

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException('خطأ اتصال (${response.statusCode})');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw ApiException('استجابة غير متوقعة من الخادم');
    }

    if (decoded['status'] == 'error') {
      throw ApiException(decoded['message']?.toString() ?? 'خطأ من الخادم');
    }

    return decoded;
  }

  Future<T> getData<T>(
    String action, {
    Map<String, String>? params,
    required T Function(dynamic json) parser,
  }) async {
    final envelope = await getAction(action, params: params);
    return parser(envelope['data']);
  }

  Future<bool> ping() async {
    final data = await getData<Map<String, dynamic>>(
      'healthCheck',
      parser: (json) => Map<String, dynamic>.from(json as Map),
    );
    return data['status'] == 'ok';
  }

  void dispose() => _client.close();
}

class ApiException implements Exception {
  ApiException(this.message);
  final String message;

  @override
  String toString() => message;
}
