class PlatformData {
  const PlatformData({
    required this.dashboard,
    required this.report,
    required this.propertyHealth,
    required this.smartStatus,
    required this.smartSummary,
    required this.liveMonitor,
    required this.settings,
    required this.subscription,
    required this.predictions,
    required this.maintenanceRequests,
    required this.messages,
    required this.smartEvents,
    required this.aiRecords,
    required this.technicians,
    required this.canWrite,
    this.smartAnalysis,
    this.partial = false,
    this.error,
    this.loadedAt,
  });

  factory PlatformData.empty({String? error}) => PlatformData(
        dashboard: DashboardBlock.empty(),
        report: const ReportBlock(collectionRate: 0, collected: 0, lateTotal: 0, totalRent: 0),
        propertyHealth: const PropertyHealth(score: 0, level: '—', collectionRate: 0, netProfit: 0),
        smartStatus: const SmartStatus(power: '—', water: '—', lastEvent: '—'),
        smartSummary: const SmartSummary(healthScore: 0, highRisks: 0),
        liveMonitor: const LiveMonitor(),
        settings: const AppSettings(),
        subscription: const SubscriptionInfo(active: false, message: 'غير متصل'),
        predictions: const [],
        maintenanceRequests: const [],
        messages: const [],
        smartEvents: const [],
        aiRecords: const [],
        technicians: const [],
        canWrite: false,
        error: error,
        loadedAt: DateTime.now(),
      );

  factory PlatformData.fromJson(Map<String, dynamic> json) {
    return PlatformData(
      dashboard: DashboardBlock.fromJson(
        Map<String, dynamic>.from(json['dashboard'] as Map? ?? {}),
      ),
      report: ReportBlock.fromJson(
        Map<String, dynamic>.from(json['report'] as Map? ?? {}),
      ),
      propertyHealth: PropertyHealth.fromJson(
        Map<String, dynamic>.from(json['propertyHealth'] as Map? ?? {}),
      ),
      smartStatus: SmartStatus.fromJson(
        Map<String, dynamic>.from(json['smartStatus'] as Map? ?? {}),
      ),
      smartSummary: SmartSummary.fromJson(
        Map<String, dynamic>.from(json['smartSummary'] as Map? ?? {}),
      ),
      liveMonitor: LiveMonitor.fromJson(
        Map<String, dynamic>.from(json['liveMonitor'] as Map? ?? {}),
      ),
      settings: AppSettings.fromJson(
        Map<String, dynamic>.from(json['settings'] as Map? ?? {}),
      ),
      subscription: SubscriptionInfo.fromJson(
        Map<String, dynamic>.from(json['subscription'] as Map? ?? {}),
      ),
      predictions: _list(json['predictions'], PredictionItem.fromJson),
      maintenanceRequests: _list(json['maintenanceRequests'], MaintenanceItem.fromJson),
      messages: _list(json['messages'], MessageItem.fromJson),
      smartEvents: _list(json['smartEvents'], SmartEvent.fromJson),
      aiRecords: _list(json['aiRecords'], AiRecord.fromJson),
      technicians: _list(json['technicians'], Technician.fromJson),
      smartAnalysis: json['smartAnalysis'],
      canWrite: json['canWrite'] != false,
      partial: json['partial'] == true,
      error: json['error']?.toString(),
      loadedAt: DateTime.now(),
    );
  }

  final DashboardBlock dashboard;
  final ReportBlock report;
  final PropertyHealth propertyHealth;
  final SmartStatus smartStatus;
  final SmartSummary smartSummary;
  final LiveMonitor liveMonitor;
  final AppSettings settings;
  final SubscriptionInfo subscription;
  final List<PredictionItem> predictions;
  final List<MaintenanceItem> maintenanceRequests;
  final List<MessageItem> messages;
  final List<SmartEvent> smartEvents;
  final List<AiRecord> aiRecords;
  final List<Technician> technicians;
  final dynamic smartAnalysis;
  final bool canWrite;
  final bool partial;
  final String? error;
  final DateTime? loadedAt;

  bool get isConnected => error == null && !partial;

  String get ownerName => settings.clientName.isNotEmpty ? settings.clientName : 'المالك';

  String get propertyName =>
      settings.propertyName.isNotEmpty ? settings.propertyName : 'العقار';

  List<DecisionItem> get priorityDecisions {
    final items = <DecisionItem>[];

    for (final p in predictions.where((e) => e.isHighRisk).take(2)) {
      items.add(DecisionItem(
        id: 'pred_${p.title}',
        title: p.title,
        subtitle: p.recommendation,
        priority: DecisionPriority.high,
        icon: IconsInsight.risk,
        actionLabel: 'مراجعة',
      ));
    }

    final late = dashboard.summary.lateCount;
    if (late > 0) {
      items.add(DecisionItem(
        id: 'late_payments',
        title: '$late وحدة متأخرة السداد',
        subtitle: 'يُنصح بإرسال تذكير فوري أو مراجعة العقود',
        priority: DecisionPriority.high,
        icon: IconsInsight.payment,
        actionLabel: 'إجراء',
      ));
    }

    final near = dashboard.summary.nearCount;
    if (near > 0) {
      items.add(DecisionItem(
        id: 'near_contracts',
        title: '$near عقد ينتهي قريباً',
        subtitle: 'ابدأ التجديد قبل انتهاء المدة',
        priority: DecisionPriority.medium,
        icon: IconsInsight.contract,
        actionLabel: 'تجديد',
      ));
    }

    final openMaint = liveMonitor.openMaintenance;
    if (openMaint > 0) {
      items.add(DecisionItem(
        id: 'open_maint',
        title: '$openMaint بلاغ صيانة مفتوح',
        subtitle: 'راجع الأولويات وأسند للفني المناسب',
        priority: DecisionPriority.medium,
        icon: IconsInsight.maintenance,
        actionLabel: 'معالجة',
      ));
    }

    if (propertyHealth.score < 60) {
      items.add(DecisionItem(
        id: 'health_low',
        title: 'صحة العقار تحتاج انتباه',
        subtitle: 'النقاط ${propertyHealth.score}% — ${propertyHealth.level}',
        priority: DecisionPriority.high,
        icon: IconsInsight.health,
        actionLabel: 'تحليل',
      ));
    }

    if (items.isEmpty) {
      items.add(DecisionItem(
        id: 'all_good',
        title: 'الوضع مستقر اليوم',
        subtitle: 'لا قرارات عاجلة — راقب المؤشرات الذكية',
        priority: DecisionPriority.low,
        icon: IconsInsight.calm,
        actionLabel: 'تم',
      ));
    }

    return items.take(5).toList();
  }
}

List<T> _list<T>(dynamic raw, T Function(Map<String, dynamic>) fromJson) {
  if (raw is! List) return [];
  return raw
      .whereType<Map>()
      .map((e) => fromJson(Map<String, dynamic>.from(e)))
      .toList();
}

class DashboardBlock {
  const DashboardBlock({
    required this.summary,
    required this.units,
    required this.expiredContracts,
    required this.nearContracts,
    required this.latePayments,
  });

  factory DashboardBlock.empty() => DashboardBlock(
        summary: const DashboardSummary(),
        units: const [],
        expiredContracts: const [],
        nearContracts: const [],
        latePayments: const [],
      );

  factory DashboardBlock.fromJson(Map<String, dynamic> json) => DashboardBlock(
        summary: DashboardSummary.fromJson(
          Map<String, dynamic>.from(json['summary'] as Map? ?? {}),
        ),
        units: _list(json['units'], UnitRow.fromJson),
        expiredContracts: _list(json['expiredContracts'], UnitRow.fromJson),
        nearContracts: _list(json['nearContracts'], UnitRow.fromJson),
        latePayments: _list(json['latePayments'], UnitRow.fromJson),
      );

  final DashboardSummary summary;
  final List<UnitRow> units;
  final List<UnitRow> expiredContracts;
  final List<UnitRow> nearContracts;
  final List<UnitRow> latePayments;
}

class DashboardSummary {
  const DashboardSummary({
    this.totalUnits = 0,
    this.rented = 0,
    this.vacant = 0,
    this.totalRent = 0,
    this.expiredCount = 0,
    this.nearCount = 0,
    this.lateCount = 0,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) => DashboardSummary(
        totalUnits: _int(json['totalUnits']),
        rented: _int(json['rented']),
        vacant: _int(json['vacant']),
        totalRent: _int(json['totalRent']),
        expiredCount: _int(json['expiredCount']),
        nearCount: _int(json['nearCount']),
        lateCount: _int(json['lateCount']),
      );

  final int totalUnits;
  final int rented;
  final int vacant;
  final int totalRent;
  final int expiredCount;
  final int nearCount;
  final int lateCount;
}

class UnitRow {
  const UnitRow({
    required this.unit,
    required this.tenant,
    required this.rent,
    this.contractNo,
    this.expiryDate,
    this.payStatus,
    this.days,
  });

  factory UnitRow.fromJson(Map<String, dynamic> json) => UnitRow(
        unit: json['unit']?.toString() ?? '—',
        tenant: json['tenant']?.toString() ?? '—',
        rent: _int(json['rent']),
        contractNo: json['contractNo']?.toString(),
        expiryDate: json['expiryDate']?.toString(),
        payStatus: json['payStatus']?.toString(),
        days: json['days']?.toString(),
      );

  final String unit;
  final String tenant;
  final int rent;
  final String? contractNo;
  final String? expiryDate;
  final String? payStatus;
  final String? days;
}

class ReportBlock {
  const ReportBlock({
    required this.collectionRate,
    required this.collected,
    required this.lateTotal,
    required this.totalRent,
  });

  factory ReportBlock.fromJson(Map<String, dynamic> json) => ReportBlock(
        collectionRate: _double(json['collectionRate']),
        collected: _int(json['collected']),
        lateTotal: _int(json['lateTotal']),
        totalRent: _int(json['totalRent']),
      );

  final double collectionRate;
  final int collected;
  final int lateTotal;
  final int totalRent;
}

class PropertyHealth {
  const PropertyHealth({
    required this.score,
    required this.level,
    required this.collectionRate,
    required this.netProfit,
  });

  factory PropertyHealth.fromJson(Map<String, dynamic> json) => PropertyHealth(
        score: _int(json['score']),
        level: json['level']?.toString() ?? '—',
        collectionRate: _double(json['collectionRate']),
        netProfit: _int(json['netProfit']),
      );

  final int score;
  final String level;
  final double collectionRate;
  final int netProfit;
}

class SmartStatus {
  const SmartStatus({
    required this.power,
    required this.water,
    required this.lastEvent,
  });

  factory SmartStatus.fromJson(Map<String, dynamic> json) => SmartStatus(
        power: json['power']?.toString() ?? '—',
        water: json['water']?.toString() ?? '—',
        lastEvent: json['lastEvent']?.toString() ?? '—',
      );

  final String power;
  final String water;
  final String lastEvent;

  bool get powerAlert => power.contains('انقطاع');
  bool get waterAlert => water.contains('انقطاع');
}

class SmartSummary {
  const SmartSummary({required this.healthScore, required this.highRisks});

  factory SmartSummary.fromJson(Map<String, dynamic> json) => SmartSummary(
        healthScore: _int(json['healthScore']),
        highRisks: _int(json['highRisks']),
      );

  final int healthScore;
  final int highRisks;
}

class LiveMonitor {
  const LiveMonitor({
    this.lastWhatsapp = '—',
    this.sentToday = 0,
    this.openMaintenance = 0,
    this.lastPrediction = '—',
    this.greenStatus = '—',
  });

  factory LiveMonitor.fromJson(Map<String, dynamic> json) => LiveMonitor(
        lastWhatsapp: json['lastWhatsapp']?.toString() ?? '—',
        sentToday: _int(json['sentToday']),
        openMaintenance: _int(json['openMaintenance']),
        lastPrediction: json['lastPrediction']?.toString() ?? '—',
        greenStatus: json['greenStatus']?.toString() ?? '—',
      );

  final String lastWhatsapp;
  final int sentToday;
  final int openMaintenance;
  final String lastPrediction;
  final String greenStatus;
}

class AppSettings {
  const AppSettings({
    this.clientName = '',
    this.propertyName = '',
    this.ownerPhone = '',
    this.subscriptionStatus = '',
    this.subscriptionEnd = '',
  });

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
        clientName: json['clientName']?.toString() ?? '',
        propertyName: json['propertyName']?.toString() ?? '',
        ownerPhone: json['ownerPhone']?.toString() ?? '',
        subscriptionStatus: json['subscriptionStatus']?.toString() ?? '',
        subscriptionEnd: json['subscriptionEnd']?.toString() ?? '',
      );

  final String clientName;
  final String propertyName;
  final String ownerPhone;
  final String subscriptionStatus;
  final String subscriptionEnd;
}

class SubscriptionInfo {
  const SubscriptionInfo({
    required this.active,
    required this.message,
    this.daysLeft,
    this.status,
    this.canWrite = true,
  });

  factory SubscriptionInfo.fromJson(Map<String, dynamic> json) => SubscriptionInfo(
        active: json['active'] != false,
        message: json['message']?.toString() ?? '',
        daysLeft: json['daysLeft'] is num ? (json['daysLeft'] as num).toInt() : null,
        status: json['status']?.toString(),
        canWrite: json['canWrite'] != false,
      );

  final bool active;
  final String message;
  final int? daysLeft;
  final String? status;
  final bool canWrite;
}

class PredictionItem {
  const PredictionItem({
    required this.level,
    required this.title,
    required this.description,
    required this.recommendation,
  });

  factory PredictionItem.fromJson(Map<String, dynamic> json) => PredictionItem(
        level: json['level']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        recommendation: json['recommendation']?.toString() ?? '',
      );

  final String level;
  final String title;
  final String description;
  final String recommendation;

  bool get isHighRisk => level.contains('عالي') || level.contains('high');
}

class MaintenanceItem {
  const MaintenanceItem({
    required this.ticketNo,
    required this.unit,
    required this.tenant,
    required this.type,
    required this.status,
    required this.risk,
    this.reportedAt,
  });

  factory MaintenanceItem.fromJson(Map<String, dynamic> json) => MaintenanceItem(
        ticketNo: json['ticketNo']?.toString() ?? json['id']?.toString() ?? '—',
        unit: json['unit']?.toString() ?? '—',
        tenant: json['tenant']?.toString() ?? '—',
        type: json['type']?.toString() ?? json['issue']?.toString() ?? '—',
        status: json['status']?.toString() ?? '—',
        risk: json['risk']?.toString() ?? json['priority']?.toString() ?? '—',
        reportedAt: json['reportedAt']?.toString() ?? json['date']?.toString(),
      );

  final String ticketNo;
  final String unit;
  final String tenant;
  final String type;
  final String status;
  final String risk;
  final String? reportedAt;

  bool get isOpen =>
      !status.contains('مكتمل') && !status.contains('مرفوض');
  bool get isUrgent => risk.contains('عالي') || risk.contains('عاجل');
}

class MessageItem {
  const MessageItem({
    required this.date,
    required this.time,
    required this.phone,
    required this.category,
    required this.status,
  });

  factory MessageItem.fromJson(Map<String, dynamic> json) => MessageItem(
        date: json['date']?.toString() ?? '',
        time: json['time']?.toString() ?? '',
        phone: json['phone']?.toString() ?? '',
        category: json['category']?.toString() ?? '',
        status: json['status']?.toString() ?? '',
      );

  final String date;
  final String time;
  final String phone;
  final String category;
  final String status;

  InboxInsight get insight => InboxClassifier.classify(this);
}

class SmartEvent {
  const SmartEvent({
    required this.time,
    required this.type,
    required this.status,
    required this.source,
  });

  factory SmartEvent.fromJson(Map<String, dynamic> json) => SmartEvent(
        time: json['time']?.toString() ?? '',
        type: json['type']?.toString() ?? '',
        status: json['status']?.toString() ?? '',
        source: json['source']?.toString() ?? '',
      );

  final String time;
  final String type;
  final String status;
  final String source;
}

class AiRecord {
  const AiRecord({
    required this.date,
    required this.title,
    required this.unit,
    required this.risk,
    required this.recommendation,
    required this.summary,
    this.type,
  });

  factory AiRecord.fromJson(Map<String, dynamic> json) => AiRecord(
        date: json['date']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        unit: json['unit']?.toString() ?? '',
        risk: json['risk']?.toString() ?? '',
        recommendation: json['recommendation']?.toString() ?? '',
        summary: json['summary']?.toString() ?? '',
        type: json['type']?.toString(),
      );

  final String date;
  final String title;
  final String unit;
  final String risk;
  final String recommendation;
  final String summary;
  final String? type;
}

class Technician {
  const Technician({required this.name, required this.phone, required this.skill});

  factory Technician.fromJson(Map<String, dynamic> json) => Technician(
        name: json['name']?.toString() ?? '—',
        phone: json['phone']?.toString() ?? '',
        skill: json['skill']?.toString() ?? json['specialty']?.toString() ?? '',
      );

  final String name;
  final String phone;
  final String skill;
}

enum DecisionPriority { high, medium, low }

enum IconsInsight { risk, payment, contract, maintenance, health, calm }

class DecisionItem {
  const DecisionItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.priority,
    required this.icon,
    required this.actionLabel,
  });

  final String id;
  final String title;
  final String subtitle;
  final DecisionPriority priority;
  final IconsInsight icon;
  final String actionLabel;
}

class InboxInsight {
  const InboxInsight({
    required this.label,
    required this.suggestedAction,
    required this.urgency,
  });

  final String label;
  final String suggestedAction;
  final DecisionPriority urgency;
}

class InboxClassifier {
  static InboxInsight classify(MessageItem msg) {
    final cat = '${msg.category} ${msg.status}'.toLowerCase();
    if (cat.contains('متأخر') || cat.contains('سداد') || cat.contains('دفع')) {
      return const InboxInsight(
        label: 'تحصيل',
        suggestedAction: 'أرسل تذكير سداد أو اتصل بالمستأجر',
        urgency: DecisionPriority.high,
      );
    }
    if (cat.contains('صيان') || cat.contains('عطل')) {
      return const InboxInsight(
        label: 'صيانة',
        suggestedAction: 'أنشئ بلاغاً أو اسند لفني',
        urgency: DecisionPriority.medium,
      );
    }
    if (cat.contains('عقد') || cat.contains('تجديد')) {
      return const InboxInsight(
        label: 'عقد',
        suggestedAction: 'راجع شروط التجديد وتواصل',
        urgency: DecisionPriority.medium,
      );
    }
    return const InboxInsight(
      label: 'عام',
      suggestedAction: 'راجع الرسالة ورد عبر الواتساب',
      urgency: DecisionPriority.low,
    );
  }
}

int _int(dynamic v) {
  if (v is num) return v.toInt();
  return int.tryParse(v?.toString().replaceAll(RegExp(r'[^\d-]'), '') ?? '') ?? 0;
}

double _double(dynamic v) {
  if (v is num) return v.toDouble();
  return double.tryParse(v?.toString() ?? '') ?? 0;
}
