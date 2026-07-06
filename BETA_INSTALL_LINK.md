# SPP Beta — رابط التثبيت الدائم (لا يتغير)

## الرابط الوحيد — احفظه

**تثبيت مباشر (APK) — افتح على أندرويد في Chrome:**
https://expo.dev/artifacts/eas/CT8kGgcWmD37XpiXjJn6ka1sDrDGRJVjyC8Z4w5HTeM.apk

**صفحة البناءات الدائمة:**
https://expo.dev/accounts/abumahaa2025/projects/spp-beta/builds

1. افتح رابط **APK المباشر** أعلاه من **هاتف أندرويد** (ليس من الكمبيوتر)
2. إن لم يعمل: افتح صفحة البناءات → أحدث Build ناجح → Install
3. فعّل «السماح من هذا المصدر» إن طُلب
4. ثبّت فوق النسخة القديمة (`ai.spp.beta`)

> **ملاحظة:** رابط `updates/...` للتحديثات فقط — **لا يثبّت** التطبيق لأول مرة.

---

## التحديثات بدون APK جديد

بعد التثبيت الأول، التحديثات تصل عبر **Expo Updates** (قناة `beta`):

```powershell
cd frontend
npx eas-cli update --channel beta --message "وصف التحديث"
```

المختبرون يفتحون التطبيق → يحصلون على التحديث تلقائيًا.

---

## الإصدار الحالي

`1.0.0-beta.5+pulse1` — رحلة الإعداد · وميض التنبيهات · معاينة الاستيراد · تحديث OTA

**أحدث APK:** https://expo.dev/accounts/abumahaa2025/projects/spp-beta/builds/ab39af51-d59c-4c48-994d-2ef1678d34dd

© SPP Labs
