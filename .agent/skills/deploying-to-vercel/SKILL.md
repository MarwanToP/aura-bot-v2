---
name: deploying-to-vercel
description: دليل شامل لنشر المشاريع (Deploying) على منصة Vercel. يتضمن إعدادات البيئة، التعامل مع الـ CLI، وإدارة النطاقات (Domains). استخدم هذه المهارة عند الرغبة في إطلاق التطبيق أو تحديثه على Vercel.
---

# النشر على Vercel (Vercel Deployment)

دليل المهندس لنشر التطبيقات بسرعة وكفاءة على Vercel.

## خطوات النشر (Checklist)

- [ ] **تجهيز المشروع**: التأكد من وجود ملف `package.json` وإعدادات الـ Build.
- [ ] **إعدادات البيئة**: إضافة متغيرات البيئة (Environment Variables) في لوحة تحكم Vercel.
- [ ] **التوصيل بـ GitHub**: ربط المستودع للنشر التلقائي عند كل `Push`.
- [ ] **فحص النطاق**: إعداد الـ Custom Domain إذا وُجد.

## الأوامر الشائعة (CLI)

```bash
# تسجيل الدخول
vercel login

# نشر مبدئي (Preview)
vercel

# نشر للإنتاج (Production)
vercel --prod

# سحب متغيرات البيئة محلياً
vercel env pull .env.local
```

## أفضل الممارسات
1. **Edge Functions**: استخدم وظائف Edge للأداء العالي وزمن الوصول المنخفض.
2. **Preview Deployments**: اختبر كل `Pull Request` عبر الرابط الذي تولده Vercel تلقائياً قبل الدمج.
3. **Optimized Images**: استخدم `next/image` إذا كان المشروع Next.js للاستفادة من تحسين الصور التلقائي.
