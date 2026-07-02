import 'package:flutter_test/flutter_test.dart';
import 'package:spp_flutter/app.dart';
import 'package:spp_flutter/core/constants/api_constants.dart';

void main() {
  testWidgets('launches luxury splash experience', (WidgetTester tester) async {
    await tester.pumpWidget(const SppApp());
    expect(find.text(ApiConstants.appName), findsOneWidget);
  });
}
