require('dotenv').config();

const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('trust proxy', 1);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

function getFirebaseBrowserSettings() {
  return {
    config: {
      apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyA57U2yKQDTCStGhpRbqmUXY5YI4TlD148',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'hlayelfranchise.firebaseapp.com',
      projectId: process.env.FIREBASE_PROJECT_ID || 'hlayelfranchise',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'hlayelfranchise.firebasestorage.app',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '911087124771',
      appId: process.env.FIREBASE_APP_ID || '1:911087124771:web:9e35735fefd071785e0c96',
    },
    adminEmail: process.env.ADMIN_EMAIL || 'altaweel@thrillagency.net',
    collection: process.env.FIRESTORE_COLLECTION || 'requests',
  };
}

app.get('/firebase-config.js', (req, res) => {
  res.type('application/javascript');
  res.set('Cache-Control', 'no-store');
  res.send(`window.__HLAYAL_FIREBASE__ = ${JSON.stringify(getFirebaseBrowserSettings())};`);
});

app.get('/', (req, res) => {
  res.render('index', { error: null, values: {} });
});

app.post('/', (req, res) => {
  res.status(400).render('index', {
    error: 'يلزم تفعيل JavaScript في المتصفح لإرسال الطلب.',
    values: req.body,
  });
});

app.get('/submit', (req, res) => {
  const language = ['ar', 'en', 'de'].includes(req.query.language)
    ? req.query.language
    : 'ar';
  res.render('submit', { language });
});

app.get('/login', (req, res) => {
  res.render('signin', { error: null });
});

app.post('/sign', (req, res) => {
  res.status(400).render('signin', {
    error: 'يلزم تفعيل JavaScript في المتصفح لتسجيل الدخول.',
  });
});

app.get('/admin', (req, res) => {
  res.render('admin', { adminEmail: process.env.ADMIN_EMAIL || '' });
});

app.post('/logout', (req, res) => {
  res.redirect('/login');
});

app.use((req, res) => {
  res.status(404).send('الصفحة غير موجودة');
});

app.listen(port, () => {
  console.log(`Hlayal server started on port ${port}`);
});
