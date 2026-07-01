import { initializeApp } from 'firebase/app';
import {
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

const settings = window.__HLAYAL_FIREBASE__;
const page = document.body.dataset.page;

function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
}

function hideError(element) {
  if (!element) return;
  element.textContent = '';
  element.hidden = true;
}

function friendlyFirebaseError(error, context) {
  const code = error?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'يجب تفعيل تسجيل الدخول بالبريد وكلمة المرور من Firebase Authentication.';
  }
  if (code.includes('too-many-requests')) {
    return 'تمت محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.';
  }
  if (code.includes('permission-denied')) {
    return context === 'admin'
      ? 'ليس لدى هذا الحساب صلاحية قراءة الطلبات. انشر قواعد Firestore الجديدة وتحقق من بريد الإدارة.'
      : 'تعذر حفظ الطلب بسبب صلاحيات Firestore. انشر قواعد Firestore الجديدة.';
  }
  if (code.includes('unavailable') || code.includes('network-request-failed')) {
    return 'تعذر الاتصال بـ Firebase. تحقق من الإنترنت وحاول مرة أخرى.';
  }
  return context === 'admin'
    ? 'تعذر تحميل الطلبات من Firebase.'
    : 'تعذر إرسال الطلب حاليًا. حاول مرة أخرى.';
}

function validateSettings() {
  const config = settings?.config || {};
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

if (!validateSettings()) {
  const errorElement = document.getElementById(page === 'login' ? 'loginError' : page === 'admin' ? 'adminLoadError' : 'formError');
  showError(errorElement, 'إعدادات Firebase Web غير مكتملة.');
} else {
  const firebaseApp = initializeApp(settings.config);
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  if (page === 'form') setupRequestForm(firestore);
  if (page === 'login') setupLogin(auth);
  if (page === 'admin') setupAdmin(auth, firestore);
}

function setupRequestForm(firestore) {
  const form = document.getElementById('form');
  const errorElement = document.getElementById('formError');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError(errorElement);

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim().replace(/\s+/g, ' ').slice(0, 100);
    const mobile = String(data.get('mobile') || '').trim().slice(0, 30);
    const city = String(data.get('city') || '').trim().replace(/\s+/g, ' ').slice(0, 100);
    const language = ['ar', 'en', 'de'].includes(data.get('language')) ? data.get('language') : 'ar';
    const submitButton = form.querySelector('input[type="submit"]');
    const originalLabel = submitButton?.value || '';

    if (data.get('website')) return;
    if (name.length < 2 || !/^[+\d\s()\-]{7,30}$/.test(mobile)) {
      showError(errorElement, 'يرجى إدخال الاسم ورقم التواصل بشكل صحيح.');
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.value = language === 'ar' ? 'جاري الإرسال...' : 'Sending...';
      }

      await addDoc(collection(firestore, settings.collection), {
        name,
        mobile,
        city,
        brandGrowth: data.get('c1') === 'c1',
        franchise: data.get('c2') === 'c2',
        language,
        submittedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

      window.location.assign(`/submit?language=${encodeURIComponent(language)}`);
    } catch (error) {
      console.error('Firebase request submission failed:', error.code || error.message);
      showError(errorElement, friendlyFirebaseError(error, 'form'));
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.value = originalLabel;
      }
    }
  });
}

function setupLogin(auth) {
  const form = document.querySelector('.login-form');
  const errorElement = document.getElementById('loginError');
  if (!form) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    if (user.email?.toLowerCase() === settings.adminEmail.toLowerCase()) {
      window.location.replace('/admin');
    } else {
      await signOut(auth);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError(errorElement);
    const email = String(form.elements.email.value || '').trim().toLowerCase();
    const password = String(form.elements.password.value || '');
    const button = form.querySelector('button[type="submit"]');

    if (email !== settings.adminEmail.toLowerCase()) {
      showError(errorElement, 'هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.');
      return;
    }

    try {
      button.disabled = true;
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      window.location.assign('/admin');
    } catch (error) {
      console.error('Firebase login failed:', error.code || error.message);
      showError(errorElement, friendlyFirebaseError(error, 'login'));
      button.disabled = false;
    }
  });
}

function setupAdmin(auth, firestore) {
  const main = document.getElementById('dashboardMain');
  const logoutForm = document.getElementById('logoutForm');
  const refreshButton = document.getElementById('refreshRequests');

  logoutForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await signOut(auth);
    window.location.replace('/login');
  });

  onAuthStateChanged(auth, async (user) => {
    const isAdmin = user?.email?.toLowerCase() === settings.adminEmail.toLowerCase();
    if (!isAdmin) {
      if (user) await signOut(auth);
      window.location.replace('/login');
      return;
    }

    document.getElementById('adminEmail').textContent = user.email;
    document.body.classList.remove('auth-pending');
    main?.setAttribute('aria-busy', 'false');
    await loadAdminRequests(firestore);
  });

  refreshButton?.addEventListener('click', () => loadAdminRequests(firestore));
}

async function loadAdminRequests(firestore) {
  const errorElement = document.getElementById('adminLoadError');
  const loading = document.getElementById('requestsLoading');
  const empty = document.getElementById('requestsEmpty');
  const tableWrap = document.getElementById('requestsTableWrap');
  const body = document.getElementById('requestsBody');
  const search = document.getElementById('requestSearch');

  hideError(errorElement);
  loading.hidden = false;
  empty.hidden = true;
  tableWrap.hidden = true;
  search.disabled = true;

  try {
    const snapshot = await getDocs(query(
      collection(firestore, settings.collection),
      orderBy('createdAt', 'desc'),
      limit(1000),
    ));
    const requests = snapshot.docs.map((document) => formatRequest(document.data()));
    renderStats(requests);
    renderRequests(requests);
    loading.hidden = true;
    empty.hidden = requests.length !== 0;
    tableWrap.hidden = requests.length === 0;
    search.disabled = requests.length === 0;
  } catch (error) {
    console.error('Firebase admin load failed:', error.code || error.message);
    loading.hidden = true;
    renderStats([]);
    showError(errorElement, friendlyFirebaseError(error, 'admin'));
  }
}

function formatRequest(data) {
  const createdAt = data.createdAt?.toDate?.() || (data.submittedAt ? new Date(data.submittedAt) : null);
  const validDate = createdAt && !Number.isNaN(createdAt.getTime());
  return {
    name: String(data.name || '—'),
    mobile: String(data.mobile || '—'),
    city: String(data.city || '—'),
    brandGrowth: Boolean(data.brandGrowth),
    franchise: Boolean(data.franchise),
    dateDisplay: validDate
      ? new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Riyadh',
      }).format(createdAt)
      : '—',
  };
}

function renderStats(requests) {
  const cities = new Set(requests.map((item) => item.city).filter((city) => city !== '—'));
  document.getElementById('statTotal').textContent = requests.length.toLocaleString('en-US');
  document.getElementById('statGrowth').textContent = requests.filter((item) => item.brandGrowth).length.toLocaleString('en-US');
  document.getElementById('statFranchise').textContent = requests.filter((item) => item.franchise).length.toLocaleString('en-US');
  document.getElementById('statCities').textContent = cities.size.toLocaleString('en-US');
}

function createCell(label) {
  const cell = document.createElement('td');
  cell.dataset.label = label;
  return cell;
}

function renderRequests(requests) {
  const body = document.getElementById('requestsBody');
  body.replaceChildren();

  requests.forEach((request) => {
    const row = document.createElement('tr');
    row.dataset.requestRow = '';
    row.dataset.search = `${request.name} ${request.mobile} ${request.city} ${request.dateDisplay}`.toLocaleLowerCase('ar');

    const customerCell = createCell('العميل');
    const customer = document.createElement('div');
    customer.className = 'customer-cell';
    const avatar = document.createElement('span');
    avatar.className = 'customer-avatar';
    avatar.textContent = request.name.charAt(0);
    const name = document.createElement('strong');
    name.textContent = request.name;
    customer.append(avatar, name);
    customerCell.append(customer);

    const phoneCell = createCell('رقم التواصل');
    const phone = document.createElement('a');
    phone.className = 'phone-link';
    phone.dir = 'ltr';
    phone.href = `tel:${request.mobile.replace(/[^+\d]/g, '')}`;
    phone.textContent = request.mobile;
    phoneCell.append(phone);

    const cityCell = createCell('المدينة');
    cityCell.textContent = request.city;

    const interestsCell = createCell('الاهتمامات');
    const badges = document.createElement('div');
    badges.className = 'badges';
    if (request.brandGrowth) badges.append(createBadge('نمو العلامة', 'badge-violet'));
    if (request.franchise) badges.append(createBadge('فرنشايز', 'badge-amber'));
    if (!request.brandGrowth && !request.franchise) {
      const muted = document.createElement('span');
      muted.className = 'muted-value';
      muted.textContent = 'غير محدد';
      badges.append(muted);
    }
    interestsCell.append(badges);

    const dateCell = createCell('تاريخ الإرسال');
    const time = document.createElement('time');
    time.textContent = request.dateDisplay;
    dateCell.append(time);

    row.append(customerCell, phoneCell, cityCell, interestsCell, dateCell);
    body.append(row);
  });

  setupSearch(requests.length);
}

function createBadge(label, modifier) {
  const badge = document.createElement('span');
  badge.className = `badge ${modifier}`;
  badge.textContent = label;
  return badge;
}

function setupSearch(total) {
  const input = document.getElementById('requestSearch');
  const clear = document.getElementById('clearSearch');
  const count = document.getElementById('visibleCount');
  const noResults = document.getElementById('noSearchResults');
  const rows = Array.from(document.querySelectorAll('[data-request-row]'));

  input.value = '';
  count.textContent = total.toLocaleString('en-US');
  clear.hidden = true;
  noResults.hidden = true;
  input.oninput = () => {
    const value = input.value.trim().toLocaleLowerCase('ar');
    let visible = 0;
    rows.forEach((row) => {
      const matches = !value || row.dataset.search.includes(value);
      row.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = visible.toLocaleString('en-US');
    clear.hidden = !value;
    noResults.hidden = visible !== 0;
  };
  clear.onclick = () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  };
}
