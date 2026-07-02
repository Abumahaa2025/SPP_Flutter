import '../models/platform_data.dart';
import '../providers/app_state.dart';

/// Client-side intelligence layer — interprets real platform data.
class PlatformBrain {
  static List<BrainMessage> initialBriefing(PlatformData data) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'صباح الخير'
        : hour < 17
            ? 'مساء الخير'
            : 'مساء النور';

    final decisions = data.priorityDecisions.length;
    final urgent = data.priorityDecisions
        .where((d) => d.priority == DecisionPriority.high)
        .length;

    return [
      BrainMessage.assistant(
        '$greeting ${data.ownerName} 👋\n'
        'أنا موظفك العقاري الذكي لـ «${data.propertyName}».\n\n'
        'راجعت ${data.dashboard.summary.totalUnits} وحدة — '
        'صحة العقار ${data.propertyHealth.score}% (${data.propertyHealth.level}).\n'
        '${urgent > 0 ? '⚡ $urgent قرار عاجل يحتاجك الآن.' : '✅ لا قرارات حرجة الآن.'}\n'
        '${decisions > 0 ? 'جهزت لك $decisions توصية في لوحة القرارات.' : ''}',
        insight: true,
      ),
    ];
  }

  static List<BrainMessage> respond(PlatformData data, String question) {
    final q = question.trim().toLowerCase();

    if (_matches(q, ['حالة', 'وضع', 'ملخص', 'اليوم'])) {
      return [_statusSummary(data)];
    }
    if (_matches(q, ['صحة', 'health', 'نقاط'])) {
      return [_healthInsight(data)];
    }
    if (_matches(q, ['صيان', 'بلاغ', 'عطل'])) {
      return [_maintenanceInsight(data)];
    }
    if (_matches(q, ['تحصيل', 'متأخر', 'سداد', 'إيجار'])) {
      return [_collectionInsight(data)];
    }
    if (_matches(q, ['عقد', 'تجديد', 'منتهي'])) {
      return [_contractsInsight(data)];
    }
    if (_matches(q, ['كهرب', 'ماء', 'حساس', 'sensor'])) {
      return [_sensorsInsight(data)];
    }
    if (_matches(q, ['ذاكرة', 'memory', 'سجل'])) {
      return [_memoryInsight(data)];
    }
    if (_matches(q, ['تنبؤ', 'predict', 'مخاطر'])) {
      return [_predictionsInsight(data)];
    }

    return [
      BrainMessage.assistant(
        'بناءً على بيانات «${data.propertyName}» الحالية:\n'
        '• ${data.dashboard.summary.rented} وحدة مؤجرة من ${data.dashboard.summary.totalUnits}\n'
        '• نسبة التحصيل ${data.report.collectionRate.toStringAsFixed(1)}%\n'
        '• ${data.liveMonitor.openMaintenance} بلاغ صيانة مفتوح\n'
        '• صحة العقار ${data.propertyHealth.score}%\n\n'
        'اسألني عن: الحالة، الصحة، الصيانة، التحصيل، العقود، الحساسات، الذاكرة، التنبؤات.',
        insight: true,
      ),
    ];
  }

  static bool _matches(String q, List<String> keys) =>
      keys.any((k) => q.contains(k));

  static BrainMessage _statusSummary(PlatformData data) {
    final d = data.dashboard.summary;
    return BrainMessage.assistant(
      '📊 ملخص اليوم لـ ${data.propertyName}\n\n'
      'الوحدات: ${d.totalUnits} | مؤجرة: ${d.rented} | شاغرة: ${d.vacant}\n'
      'التحصيل: ${data.report.collectionRate.toStringAsFixed(1)}% '
      '(${data.report.collected} من ${data.report.totalRent} ر.س)\n'
      'متأخرون: ${d.lateCount} | عقود قريبة: ${d.nearCount}\n'
      'صحة العقار: ${data.propertyHealth.score}% — ${data.propertyHealth.level}\n\n'
      '${data.priorityDecisions.first.title}',
      insight: true,
    );
  }

  static BrainMessage _healthInsight(PlatformData data) {
    final h = data.propertyHealth;
    return BrainMessage.assistant(
      '🏥 Smart Property Health\n\n'
      'النقاط: ${h.score}/100 — ${h.level}\n'
      'نسبة التحصيل: ${h.collectionRate.toStringAsFixed(1)}%\n'
      'صافي الربح التقديري: ${h.netProfit} ر.س\n'
      'مخاطر عالية: ${data.smartSummary.highRisks}\n\n'
      '${h.score >= 75 ? 'الأداء جيد — حافظ على المتابعة الاستباقية.' : 'أنصح بمراجعة المتأخرين والصيانة المفتوحة فوراً.'}',
      insight: true,
    );
  }

  static BrainMessage _maintenanceInsight(PlatformData data) {
    final open = data.maintenanceRequests.where((m) => m.isOpen).toList();
    if (open.isEmpty) {
      return BrainMessage.assistant('🔧 لا توجد بلاغات صيانة مفتوحة — ممتاز!', insight: true);
    }
    final urgent = open.where((m) => m.isUrgent).length;
    final buffer = StringBuffer('🔧 Predictive Maintenance\n\n');
    buffer.writeln('${open.length} بلاغ مفتوح — $urgent عاجل\n');
    for (final m in open.take(3)) {
      buffer.writeln('• ${m.unit}: ${m.type} (${m.status})');
    }
    if (data.predictions.any((p) => p.title.contains('صيان'))) {
      buffer.writeln('\n⚠️ التنبؤات تشير لنمط صيانة متكرر — راجع الوحدات المتأثرة.');
    }
    return BrainMessage.assistant(buffer.toString(), insight: true);
  }

  static BrainMessage _collectionInsight(PlatformData data) {
    final late = data.dashboard.latePayments;
    return BrainMessage.assistant(
      '💰 التحصيل والمدفوعات\n\n'
      'نسبة التحصيل: ${data.report.collectionRate.toStringAsFixed(1)}%\n'
      'إجمالي متأخر: ${data.report.lateTotal} ر.س\n'
      'وحدات متأخرة: ${data.dashboard.summary.lateCount}\n\n'
      '${late.isEmpty ? 'لا متأخرين حالياً.' : 'أولوية: ${late.first.unit} — ${late.first.tenant} (${late.first.rent} ر.س)'}',
      insight: true,
    );
  }

  static BrainMessage _contractsInsight(PlatformData data) {
    final near = data.dashboard.nearContracts;
    final expired = data.dashboard.expiredContracts;
    return BrainMessage.assistant(
      '📋 العقود\n\n'
      'منتهية: ${expired.length} | قريبة الانتهاء: ${near.length}\n\n'
      '${near.isEmpty ? 'لا عقود تنتهي قريباً.' : 'أقرب انتهاء: ${near.first.unit} — ${near.first.expiryDate}'}',
      insight: true,
    );
  }

  static BrainMessage _sensorsInsight(PlatformData data) {
    final s = data.smartStatus;
    return BrainMessage.assistant(
      '📡 Virtual Sensors\n\n'
      'الكهرباء: ${s.power}\n'
      'المياه: ${s.water}\n'
      'آخر حدث: ${s.lastEvent}\n\n'
      '${s.powerAlert || s.waterAlert ? '⚠️ يوجد تنبيه — راجع الأحداث الذكية فوراً.' : '✅ الحساسات الافتراضية مستقرة.'}',
      insight: true,
    );
  }

  static BrainMessage _memoryInsight(PlatformData data) {
    if (data.aiRecords.isEmpty) {
      return BrainMessage.assistant(
        '🧠 Property Memory فارغة حالياً.\n'
        'ستمتلئ تلقائياً عند تحليل الصور والأحداث الذكية.',
        insight: true,
      );
    }
    final buffer = StringBuffer('🧠 Property Memory — آخر ${data.aiRecords.length.clamp(0, 5)} سجل:\n\n');
    for (final r in data.aiRecords.take(5)) {
      buffer.writeln('• ${r.date} | ${r.title} (${r.unit})');
      if (r.recommendation.isNotEmpty) buffer.writeln('  ↳ ${r.recommendation}');
    }
    return BrainMessage.assistant(buffer.toString(), insight: true);
  }

  static BrainMessage _predictionsInsight(PlatformData data) {
    if (data.predictions.isEmpty) {
      return BrainMessage.assistant(
        '🔮 لا توجد تنبؤات بعد.\n'
        'شغّل محرك التنبؤات من المنصة لتفعيل التحليل الاستباقي.',
        insight: true,
      );
    }
    final buffer = StringBuffer('🔮 Unified Brain — التنبؤات:\n\n');
    for (final p in data.predictions.take(4)) {
      buffer.writeln('${p.isHighRisk ? '🔴' : '🟡'} ${p.title}');
      buffer.writeln('  ${p.recommendation}\n');
    }
    return BrainMessage.assistant(buffer.toString(), insight: true);
  }
}
