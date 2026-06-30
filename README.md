# 📬 MailBox Dashboard

لوحة إدارة بريد إلكتروني احترافية مع catch-all على دومين خاص.

---

## 🚀 خطوات الإعداد

### 1. إعداد Mailgun
1. سجل على https://mailgun.com (الخطة المجانية)
2. أضف دومينك واتبع تعليمات DNS
3. فعّل Catch-all Routing على دومينك
4. أضف Webhook → `https://your-backend.onrender.com/api/webhook/mailgun`
5. احفظ: API Key, Domain, Webhook Secret

### 2. رفع على Render
1. ارفع المشروع على GitHub
2. اذهب لـ https://render.com → New → Blueprint
3. اختر الـ repo → Render سيقرأ render.yaml تلقائياً
4. أضف المتغيرات اليدوية:
   - MAILGUN_API_KEY
   - MAILGUN_DOMAIN
   - MAILGUN_WEBHOOK_SECRET
   - FRONTEND_URL (رابط الفرونتند بعد النشر)
5. انشر!

### 3. إعداد قاعدة البيانات
بعد النشر شغّل في Render Shell:
```
cd backend && node src/prisma/seed.js
```

### 4. تسجيل الدخول
- البريد: admin@yourdomain.com
- كلمة المرور: Admin@1234
- **غيّر كلمة المرور فوراً!**

---

## 🏗️ هيكل الملفات

```
mailbox-project/
├── backend/
│   ├── prisma/schema.prisma     # قاعدة البيانات
│   ├── src/
│   │   ├── index.js             # نقطة الدخول
│   │   ├── controllers/         # المنطق
│   │   ├── routes/              # الـ API endpoints
│   │   ├── middleware/          # الأمان
│   │   ├── services/            # خدمة البريد
│   │   └── prisma/seed.js       # بيانات أولية
│   └── package.json
├── frontend/
│   └── index.html               # الداشبورد كامل
└── render.yaml                  # إعدادات النشر
```

---

## 🔐 الصلاحيات

| الدور | مشاهدة | إرسال | إضافة بريد | إدارة مستخدمين |
|---|---|---|---|---|
| VIEWER | ✅ | ❌ | ❌ | ❌ |
| ADMIN | ✅ | ✅ | ✅ | ❌ |
| SUPERADMIN | ✅ | ✅ | ✅ | ✅ |

---

## 📡 API Endpoints

### Auth
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET  /api/auth/me

### Inboxes
- GET    /api/inboxes?page=1&limit=50&search=
- GET    /api/inboxes/:id
- POST   /api/inboxes
- POST   /api/inboxes/bulk  ← إضافة آلاف البريدات دفعة واحدة
- PATCH  /api/inboxes/:id
- DELETE /api/inboxes/:id

### Messages
- GET    /api/messages/inbox/:inboxId
- GET    /api/messages/:id
- POST   /api/messages/send
- PATCH  /api/messages/:id/read
- DELETE /api/messages/:id

### Stats
- GET /api/stats

### Users (SUPERADMIN فقط)
- GET    /api/users
- POST   /api/users
- PATCH  /api/users/:id
- DELETE /api/users/:id

### Webhook
- POST /api/webhook/mailgun ← Mailgun يرسل هنا

---

## 🛡️ الأمان المطبّق

- JWT + Refresh Tokens
- Rate Limiting (100 req/15min, 10 login attempts)
- Helmet.js (security headers)
- CORS محدود بالفرونتند فقط
- Mailgun Webhook Signature Verification
- bcrypt لتشفير كلمات المرور
- RBAC للصلاحيات
- SQL Injection محمي عبر Prisma ORM
