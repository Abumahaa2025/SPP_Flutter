import '../models/app_models.dart';

class DemoData {
  static const userName = 'أحمد العتيبي';
  static const propertyName = 'مجمع كويل السكني';
  static const trialDaysLeft = 14;

  static const dashboard = DashboardStats(
    occupiedUnits: 42,
    vacantUnits: 6,
    latePayments: 3,
    openTickets: 5,
    monthlyRevenue: 186500,
    collectionRate: 94.2,
  );

  static const inbox = [
    InboxMessage(
      id: '1',
      sender: 'سارة — وحدة 12',
      subject: 'طلب صيانة تكييف',
      preview: 'التكييف لا يبرد منذ أمس، أرجو الإرسال في أقرب وقت.',
      time: '10:24',
      status: MessageStatus.unread,
      channel: 'واتساب',
    ),
    InboxMessage(
      id: '2',
      sender: 'محمد — محل 3',
      subject: 'تأكيد دفع الإيجار',
      preview: 'تم التحويل البنكي للشهر الحالي، مرفق إيصال.',
      time: '09:05',
      status: MessageStatus.read,
      channel: 'بريد',
    ),
    InboxMessage(
      id: '3',
      sender: 'النظام',
      subject: 'تنبيه: تأخر دفع',
      preview: '3 وحدات تجاوزت موعد السداد بـ 5 أيام.',
      time: '08:00',
      status: MessageStatus.urgent,
      channel: 'تنبيه',
    ),
    InboxMessage(
      id: '4',
      sender: 'فاطمة — وحدة 26',
      subject: 'تجديد العقد',
      preview: 'أرغب بتجديد العقد لسنة إضافية بنفس الشروط.',
      time: 'أمس',
      status: MessageStatus.unread,
      channel: 'تطبيق',
    ),
  ];

  static const contracts = [
    ContractItem(
      id: 'C-1042',
      tenant: 'خالد المطيري',
      unit: 'شقة 8',
      rent: 4500,
      endDate: '2026-12-31',
      status: 'ساري',
    ),
    ContractItem(
      id: 'C-1038',
      tenant: 'شركة النور التجارية',
      unit: 'محل 3',
      rent: 8200,
      endDate: '2027-03-15',
      status: 'ساري',
    ),
    ContractItem(
      id: 'C-1021',
      tenant: 'نورة السبيعي',
      unit: 'شقة 26',
      rent: 3800,
      endDate: '2026-06-30',
      status: 'ينتهي قريباً',
    ),
    ContractItem(
      id: 'C-0998',
      tenant: 'عبدالله الحربي',
      unit: 'شقة 15',
      rent: 4200,
      endDate: '2026-04-01',
      status: 'متأخر',
    ),
  ];

  static const maintenance = [
    MaintenanceTicket(
      id: 'M-301',
      unit: 'شقة 12',
      issue: 'تكييف لا يبرد',
      priority: 'عاجل',
      status: 'جديد',
      reportedAt: 'اليوم 10:24',
    ),
    MaintenanceTicket(
      id: 'M-298',
      unit: 'شقة 5',
      issue: 'تسريب ماء في الحمام',
      priority: 'متوسط',
      status: 'قيد التنفيذ',
      reportedAt: 'أمس',
    ),
    MaintenanceTicket(
      id: 'M-295',
      unit: 'محل 1',
      issue: 'إضاءة اللوحة الخارجية',
      priority: 'منخفض',
      status: 'مجدول',
      reportedAt: '28/06',
    ),
    MaintenanceTicket(
      id: 'M-290',
      unit: 'شقة 19',
      issue: 'قفل الباب الرئيسي',
      priority: 'عاجل',
      status: 'مكتمل',
      reportedAt: '27/06',
    ),
  ];
}
