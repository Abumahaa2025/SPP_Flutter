enum MessageStatus { unread, read, urgent }

class DashboardStats {
  const DashboardStats({
    required this.occupiedUnits,
    required this.vacantUnits,
    required this.latePayments,
    required this.openTickets,
    required this.monthlyRevenue,
    required this.collectionRate,
  });

  final int occupiedUnits;
  final int vacantUnits;
  final int latePayments;
  final int openTickets;
  final int monthlyRevenue;
  final double collectionRate;
}

class InboxMessage {
  const InboxMessage({
    required this.id,
    required this.sender,
    required this.subject,
    required this.preview,
    required this.time,
    required this.status,
    required this.channel,
  });

  final String id;
  final String sender;
  final String subject;
  final String preview;
  final String time;
  final MessageStatus status;
  final String channel;
}

class ContractItem {
  const ContractItem({
    required this.id,
    required this.tenant,
    required this.unit,
    required this.rent,
    required this.endDate,
    required this.status,
  });

  final String id;
  final String tenant;
  final String unit;
  final int rent;
  final String endDate;
  final String status;
}

class MaintenanceTicket {
  const MaintenanceTicket({
    required this.id,
    required this.unit,
    required this.issue,
    required this.priority,
    required this.status,
    required this.reportedAt,
  });

  final String id;
  final String unit;
  final String issue;
  final String priority;
  final String status;
  final String reportedAt;
}
