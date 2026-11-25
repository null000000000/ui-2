# n8n & Backend Architecture Integration Guide
## Personal Analytics Intelligence System / NULL Social Monitor

> **تنبيه وتوجيه للمستقبل**:  
> الباك إند أركيتكشر (Backend Architecture) كاملة وجاهزة بنسبة 100% داخل NestJS و PostgreSQL. عندما تحتاج لاستكمال أو تفعيل مسارات العمل على **n8n**، ستجد كل ما تحتاجه موثقاً هنا ومبنياً مسبقاً في هذا المشروع.

---

## 1. الحالة الحالية للمشروع (Current State)

جميع عمليات الـ OAuth، والـ Cryptography، والـ Database Persistence، ومزامنة البيانات وتطبيع المقاييس (Data Normalization & Metric Aggregations) تم بناؤها واختبارها وتأكيدها **Native** داخل NestJS:
- **YouTube Integration**: يعمل ومصادق عبر Google OAuth 2.0 (YouTube Data API v3 & YouTube Analytics API).
- **Facebook Pages Integration**: يعمل ومصادق عبر Meta Graph API v27.0 مع تشفير AES-256-GCM للـ Page Access Tokens ومزامنة تلقائية للمنشورات والتفاعلات والمتابعين.
- **Database Engine**: PostgreSQL 16 (`pais_db`) تحت إدارة Prisma ORM.
- **Frontend Dashboard**: `ui-2` (Vite + React + Tailwind) على المنفذ `3000`.
- **Backend API**: NestJS على المنفذ `3001`.

---

## 2. أين توجد المعمارية في الكود؟ (Codebase Architecture)

تتمركز المعمارية داخل المسارات التالية في مجلد `personal_analytics_intelligence_system`:

| المكون | المسار في المشروع | الوظيفة |
| :--- | :--- | :--- |
| **Integrations Module** | `apps/api/src/modules/integrations/` | يحتوي على خدمات Google OAuth و Facebook OAuth و Facebook Graph API v27.0 و Facebook Sync. |
| **Cryptography Service** | `apps/api/src/core/crypto/crypto.service.ts` | تشفير AES-256-GCM للمفاتيح والـ Tokens (لا يتم حفظ أو كشف أي Token كنص صريح). |
| **Database Schema** | `apps/api/prisma/schema.prisma` | يحتوي على نماذج `PlatformAccount` و `IntegrationCredential` و `SyncRun` و `SyncError` و `ContentItem` و `Publication` و `MetricObservation`. |
| **Sync Engine** | `apps/api/src/modules/synchronization/` | إدارة وتتبع عمليات المزامنة الحية وسجلات الـ Telemetry. |
| **Dashboard & Metrics** | `apps/api/src/modules/dashboard/` & `metrics/` | توفير الإحصائيات المجمعة للواجهة. |

---

## 3. كيفية ربط n8n مع هذا الـ Backend (Integration Contract)

عند استكمال وتفعيل n8n (المقرر لاحقاً)، لن تحتاج n8n للتعامل مع Meta API مباشرة أو تخزين Tokens حساسة، بل تتصل بـ Endpoints الـ Backend النظيفة كـ Orchestrator:

### Endpoints جاهزة للاستدعاء من n8n:
1. **تشغيل المزامنة لفيسبوك**:
   - `POST http://127.0.0.1:3001/api/integrations/facebook/sync/:platformAccountId`
   - يُرجع تقرير العملية (`recordsFetched`, `recordsPersisted`, `postsSynced`, `status: SUCCEEDED`).
2. **فحص صحة التوصيل والاعتمادات**:
   - `GET http://127.0.0.1:3001/api/integrations/facebook/status/:platformAccountId`
   - `GET http://127.0.0.1:3001/api/integrations/facebook/verify/:platformAccountId`
3. **قائمة المنصات والحسابات المتصلة**:
   - `GET http://127.0.0.1:3001/api/integrations/platforms`
4. **جلب سجلات وعمليات المزامنة الأخيرة**:
   - `GET http://127.0.0.1:3001/api/synchronization/runs`
5. **جلب المنشورات والمحتوى الموحد عبر المنصات**:
   - `GET http://127.0.0.1:3001/api/content/items`

---

## 4. خطوات إكمال n8n عند الحاجة (Completion Playbook)

عندما تقرر استكمال جزء n8n:
1. **تشغيل حاوية n8n** عبر Docker أو التثبيت المحلي على المنفذ المخصص (مثلاً `5678`).
2. **إنشاء Scheduled Workflow (Cron)**:
   - Trigger: كل 6 ساعات أو يومياً.
   - HTTP Request Node: يستدعي `POST /api/integrations/facebook/sync/:platformAccountId`.
   - Condition Node: التحقق من نجاح العملية (`status === "SUCCEEDED"`).
   - Notification Node (اختياري): إرسال تنبيه عبر Telegram أو Discord أو Slack عند حدوث أي خطأ أو تراجع في الـ Pipeline.
3. **إضافة المنصات المتبقية بنفس النمط**:
   - الـ Data Models جاهزة مسبقاً في الـ Database لدعم (Instagram, TikTok, LinkedIn, X, GitHub).
   - يمكنك اتباع نفس معمارية `facebook-oauth.service.ts` و `facebook-sync.service.ts` لبناء مزامنات المنصات الأخرى بكل سهولة.

---

> **ملاحظة أمنية**: هذا المشروع خالي تماماً من أي API Keys أو Secrets مسجلة في Git. جميع القيم الحساسة يتم تحميلها حصرياً من ملفات الـ `.env` المحلية المشفرة.
