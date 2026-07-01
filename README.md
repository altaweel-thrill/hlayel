# مشروع هليل

موقع Express/EJS يستخدم Firebase Web SDK لحفظ طلبات العملاء في Firestore، مع Firebase Authentication لحماية لوحة الإدارة.

## إعداد Firebase

1. أنشئ مشروعًا في [Firebase Console](https://console.firebase.google.com/).
2. فعّل **Cloud Firestore** للمشروع.
3. انسخ `.env.example` إلى ملف باسم `.env` وأضف إعدادات تطبيق Firebase Web.
4. من **Authentication > Sign-in method** فعّل Email/Password.
5. من **Authentication > Users** أنشئ مستخدم الإدارة واجعل بريده مطابقًا لـ `ADMIN_EMAIL`.
6. انشر قواعد Firestore عبر `firebase deploy --only firestore:rules`.

تُنشأ مجموعة `requests` تلقائيًا عند وصول أول طلب. يمكن تغيير اسمها من خلال `FIRESTORE_COLLECTION`.

## التشغيل

```bash
npm install
npm run dev
```

- الموقع: `http://localhost:3000`
- تسجيل دخول الإدارة: `http://localhost:3000/login`
- لوحة الإدارة: `http://localhost:3000/admin`

## ملاحظات مهمة

- المشروع لا يستخدم MongoDB بعد الآن، لكنه لا ينقل السجلات القديمة تلقائيًا إلى Firestore.
- لا ترفع ملف `.env` إلى Git.
- كلمة مرور مستخدم الإدارة تُدار داخل Firebase Authentication ولا تُحفظ في `.env`.
- بيانات MongoDB والبريد القديمة كانت موجودة في سجل Git؛ يجب إبطالها وتغييرها حتى بعد حذفها من النسخة الحالية.
