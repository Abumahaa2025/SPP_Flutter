import 'package:flutter_test/flutter_test.dart';
import 'package:spp_flutter/app.dart';

void main() {
  testWidgets('shows login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const SppApp());

    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(find.text('تميّز العقار الذكي'), findsOneWidget);
  });
}
