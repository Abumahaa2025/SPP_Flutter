import 'package:flutter_test/flutter_test.dart';
import 'package:spp_flutter/app.dart';

void main() {
  testWidgets('shows AI-first login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const SppApp());

    expect(find.text('تفعيل الموظف الذكي'), findsOneWidget);
    expect(find.textContaining('موظفك العقاري الذكي'), findsOneWidget);
  });
}
