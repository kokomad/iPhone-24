# Royal Gold — iOS 26 Style (Android APK)

Developer: **Khader Abo Salha** — mankhader@gmail.com

## الخطوات
1. أنشئ مستودعاً جديداً على GitHub (Private أو Public).
2. ارفع محتوى هذا المجلد كاملاً (بما فيه المجلد المخفي `.github`).
3. افتح تبويب **Actions** — سيبدأ البناء تلقائياً (أو اضغط *Run workflow*).
4. بعد نحو 5–8 دقائق افتح التشغيلة الناجحة ونزّل **RoyalGold-debug-apk** من قسم Artifacts، فك الضغط ثم ثبّت `app-debug.apk` على الجوال.

## نسخة موقّعة للنشر (اختياري)
أضف في Settings ← Secrets and variables ← Actions:
`KEYSTORE_BASE64` و `KEYSTORE_PASSWORD` و `KEY_ALIAS` و `KEY_PASSWORD`

إنشاء المفتاح:
    keytool -genkey -v -keystore release.keystore -alias royalgold -keyalg RSA -keysize 2048 -validity 10000
    base64 -w0 release.keystore   # الصق الناتج في KEYSTORE_BASE64
احتفظ بملف المفتاح في مكان آمن؛ فقدانه يمنع تحديث التطبيق لاحقاً.

## التعديل
عدّل `www/index.html` ثم ارفع التغيير، وسيُبنى APK جديد تلقائياً.
لتغيير الاسم أو المعرّف: `capacitor.config.json` (appId / appName). لتغيير الأيقونة: استبدل صور `assets/`.
