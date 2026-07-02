# SPP Flutter — تميّز العقار الذكي

تطبيق Flutter MVP لمنصة إدارة العقارات الذكية (SPP)، بواجهة عربية RTL وبيانات تجريبية.

## الشاشات

| الشاشة | الوصف |
|--------|--------|
| تسجيل الدخول | دخول تجريبي (14 يوم) |
| لوحة التحكم | إحصائيات الوحدات والتحصيل |
| صندوق الوارد | رسائل وتنبيهات |
| العقود | قائمة العقود النشطة |
| الصيانة | بلاغات الصيانة |
| الإعدادات | الملف الشخصي والتكامل |

## التشغيل

```bash
cd SPP_Flutter
flutter pub get
flutter run
```

## البناء (APK)

```bash
flutter build apk --release
```

أو عبر GitHub Actions: workflow `build_apk.yml` يبني APK تلقائياً عند push.

## التكامل مع Apps Script

Endpoint جاهز في `lib/core/constants/api_constants.dart` — الطبقة `ApiService` تستخدم بيانات تجريبية حالياً.

```
https://script.google.com/macros/s/AKfycbyfGVaod79j2J7QytcDcTiyx7oh5ioQODLBkARZ5-vVjTg7EiW2g1SzNZeKjxp3Pbv1rQ/exec?app=koil
```

Build tag: `spp-flutter-mvp-v1`

## التصميم

- Material 3
- خط Cairo (google_fonts)
- اللون الأساسي: `#0D7A72`
- RTL افتراضي
