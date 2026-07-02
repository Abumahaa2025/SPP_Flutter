import '../models/platform_data.dart';

/// بيانات عرض فاخرة — للواجهة فقط، بدون Backend.
class LuxuryMock {
  static PlatformData build() {
    final dashboard = DashboardBlock(
      summary: const DashboardSummary(
        totalUnits: 48,
        rented: 42,
        vacant: 6,
        totalRent: 186500,
        expiredCount: 2,
        nearCount: 4,
        lateCount: 3,
      ),
      units: _units,
      expiredContracts: _units.where((u) => u.contractNo == 'C-0998').toList(),
      nearContracts: _units.where((u) => u.contractNo == 'C-1021').toList(),
      latePayments: _units.where((u) => u.payStatus?.contains('متأخر') == true).toList(),
    );

    return PlatformData(
      dashboard: dashboard,
      report: const ReportBlock(
        collectionRate: 94.2,
        collected: 175600,
        lateTotal: 11400,
        totalRent: 186500,
      ),
      propertyHealth: const PropertyHealth(
        score: 87,
        level: 'ممتاز',
        collectionRate: 94.2,
        netProfit: 142300,
      ),
      smartStatus: const SmartStatus(
        power: 'طبيعي',
        water: 'طبيعي',
        lastEvent: 'عودة كهرباء — مبنى أ',
      ),
      smartSummary: const SmartSummary(healthScore: 87, highRisks: 2),
      liveMonitor: const LiveMonitor(
        lastWhatsapp: 'اليوم 09:24',
        sentToday: 12,
        openMaintenance: 3,
        lastPrediction: 'تسريب محتمل — وحدة 5',
        greenStatus: 'متصل',
      ),
      settings: const AppSettings(
        clientName: 'أحمد العتيبي',
        propertyName: 'مجمع كويل السكني',
        ownerPhone: '966501234567',
        subscriptionStatus: 'trial',
        subscriptionEnd: '2026-07-28',
      ),
      subscription: const SubscriptionInfo(
        active: true,
        message: 'الفترة التجريبية مفعلة — 26 يوم متبقٍ',
        daysLeft: 26,
        status: 'trial',
        canWrite: true,
      ),
      predictions: const [
        PredictionItem(
          level: 'عالي',
          title: 'نمط تأخر متكرر — محل 3',
          description: '3 أشهر متتالية بتأخر جزئي',
          recommendation: 'جدولة اتصال + خطة سداد قبل نهاية الربع',
        ),
        PredictionItem(
          level: 'متوسط',
          title: 'صيانة استباقية — وحدة 12',
          description: 'بلاغات تكييف متكررة',
          recommendation: 'فحص شامل للوحدة قبل الصيف',
        ),
        PredictionItem(
          level: 'منخفض',
          title: 'فرصة تجديد مبكر',
          description: '4 عقود تنتهي خلال 60 يوم',
          recommendation: 'عرض تجديد بخصم 5% للمستأجرين المميزين',
        ),
      ],
      maintenanceRequests: const [
        MaintenanceItem(
          ticketNo: 'M-301',
          unit: 'شقة 12',
          tenant: 'سارة المطيري',
          type: 'تكييف لا يبرد',
          status: 'جديد',
          risk: 'عاجل',
          reportedAt: 'اليوم 10:24',
        ),
        MaintenanceItem(
          ticketNo: 'M-298',
          unit: 'شقة 5',
          tenant: 'فهد العنزي',
          type: 'تسريب ماء',
          status: 'قيد التنفيذ',
          risk: 'متوسط',
          reportedAt: 'أمس',
        ),
        MaintenanceItem(
          ticketNo: 'M-295',
          unit: 'محل 1',
          tenant: 'شركة النور',
          type: 'إضاءة خارجية',
          status: 'مجدول',
          risk: 'منخفض',
          reportedAt: '28/06',
        ),
      ],
      messages: const [
        MessageItem(
          date: 'اليوم',
          time: '10:24',
          phone: '9665XXXX12',
          category: 'طلب صيانة تكييف — وحدة 12',
          status: 'غير مقروء',
        ),
        MessageItem(
          date: 'اليوم',
          time: '09:05',
          phone: '9665XXXX03',
          category: 'تأكيد تحويل إيجار — محل 3',
          status: 'مقروء',
        ),
        MessageItem(
          date: 'أمس',
          time: '16:40',
          phone: '9665XXXX26',
          category: 'طلب تجديد عقد — وحدة 26',
          status: 'غير مقروء',
        ),
        MessageItem(
          date: 'أمس',
          time: '08:00',
          phone: 'النظام',
          category: 'تنبيه: 3 وحدات متأخرة السداد',
          status: 'عاجل',
        ),
      ],
      smartEvents: const [
        SmartEvent(time: '10:20', type: 'power_return', status: 'عودة', source: 'حساس افتراضي'),
        SmartEvent(time: '09:15', type: 'whatsapp_sent', status: 'نجح', source: 'Green API'),
        SmartEvent(time: '08:00', type: 'prediction_run', status: 'مكتمل', source: 'Unified Brain'),
      ],
      aiRecords: const [
        AiRecord(
          date: '28/06',
          title: 'تحليل صورة تسريب',
          unit: 'شقة 5',
          risk: 'متوسط',
          recommendation: 'إرسال فني سباكة خلال 24 ساعة',
          summary: 'تسريب محتمل من وصلة الحمام الرئيسية',
          type: 'صيانة',
        ),
        AiRecord(
          date: '27/06',
          title: 'تقييم مخاطر تحصيل',
          unit: 'محل 3',
          risk: 'عالي',
          recommendation: 'جدولة مكالمة مع المستأجر',
          summary: 'نمط تأخر 3 أشهر — يحتاج متابعة',
          type: 'مالي',
        ),
        AiRecord(
          date: '26/06',
          title: 'توصية تجديد عقد',
          unit: 'شقة 26',
          risk: 'منخفض',
          recommendation: 'عرض تجديد لسنة إضافية',
          summary: 'مستأجر ممتاز — سجل سداد 100%',
          type: 'عقد',
        ),
      ],
      technicians: const [
        Technician(name: 'خالد الفني', phone: '966501111111', skill: 'تكييف'),
        Technician(name: 'سعد السباك', phone: '966502222222', skill: 'سباكة'),
        Technician(name: 'ناصر الكهرباء', phone: '966503333333', skill: 'كهرباء'),
      ],
      canWrite: true,
      loadedAt: DateTime.now(),
    );
  }

  static final _units = [
    const UnitRow(
      unit: 'شقة 8',
      tenant: 'خالد المطيري',
      rent: 4500,
      contractNo: 'C-1042',
      expiryDate: '2026-12-31',
      payStatus: 'مسدد',
    ),
    const UnitRow(
      unit: 'محل 3',
      tenant: 'شركة النور',
      rent: 8200,
      contractNo: 'C-1038',
      expiryDate: '2027-03-15',
      payStatus: 'متأخر',
    ),
    const UnitRow(
      unit: 'شقة 26',
      tenant: 'نورة السبيعي',
      rent: 3800,
      contractNo: 'C-1021',
      expiryDate: '2026-06-30',
      payStatus: 'مسدد',
    ),
    const UnitRow(
      unit: 'شقة 15',
      tenant: 'عبدالله الحربي',
      rent: 4200,
      contractNo: 'C-0998',
      expiryDate: '2026-04-01',
      payStatus: 'متأخر',
    ),
  ];
}
