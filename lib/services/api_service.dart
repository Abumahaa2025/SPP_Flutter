import '../core/constants/api_constants.dart';
import '../data/demo_data.dart';
import '../models/app_models.dart';

/// Stub API layer — returns demo data until Apps Script integration is wired.
class ApiService {
  const ApiService();

  Future<bool> ping() async {
    // Future: GET ${ApiConstants.baseUrl}?view=ping
    await Future<void>.delayed(const Duration(milliseconds: 400));
    return true;
  }

  Future<DashboardStats> fetchDashboard() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return DemoData.dashboard;
  }

  Future<List<InboxMessage>> fetchInbox() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return DemoData.inbox;
  }

  Future<List<ContractItem>> fetchContracts() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return DemoData.contracts;
  }

  Future<List<MaintenanceTicket>> fetchMaintenance() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return DemoData.maintenance;
  }

  String get endpointHint =>
      '${ApiConstants.baseUrl}?app=${ApiConstants.appParam}';
}
