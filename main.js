import { Capacitor, registerPlugin } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

const native = Capacitor.isNativePlatform();
const LB = registerPlugin('LauncherBridge');
const $ = (s, r = document) => r.querySelector(s);
const store = {
  get: (k, d) => { try { const v = localStorage.getItem('px.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem('px.' + k, JSON.stringify(v)); } catch {} }
};
const nat = async (m, a = {}) => { if (!native) throw new Error('web'); return LB[m](a); };
let tt; const say = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); };
const open = (kind, arg = '') => nat('open', { kind, arg }).catch(() => say(native ? 'تعذر فتح هذه الميزة على جهازك' : 'تعمل هذه الميزة على Android فقط'));

if (native) { StatusBar.setStyle({ style: Style.Dark }).catch(() => {}); StatusBar.setBackgroundColor({ color: '#07040f' }).catch(() => {}); }

/* ---- layout: boxes are in artwork pixels (841 x 1870, top 60px cropped) ---- */
const place = (el, [x1, y1, x2, y2]) => Object.assign(el.style, {
  left: x1 / 841 * 100 + '%', top: (y1 - 60) / 1810 * 100 + '%', width: (x2 - x1) / 841 * 100 + '%', height: (y2 - y1) / 1810 * 100 + '%'
});
document.querySelectorAll('[data-box]').forEach(el => place(el, el.dataset.box.split(',').map(Number)));

/* ---- clock ---- */
function tick() {
  const d = new Date(); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  $('#tm').textContent = h + ':' + String(d.getMinutes()).padStart(2, '0'); $('#ap').textContent = ap;
  $('#dt').textContent = d.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
tick(); setInterval(tick, 15000);

/* ---- battery ---- */
let lastBat = null;
async function battery() {
  let b; try { b = await nat('getBattery'); } catch { return; }
  lastBat = b; const lv = b.level ?? 0;
  $('#bPct').textContent = lv + '%'; $('#ring').style.strokeDashoffset = 276.5 * (1 - lv / 100);
  $('#bolt').style.visibility = b.charging ? 'visible' : 'hidden';
  let txt;
  if (b.charging) txt = b.chargeMs > 0 ? 'يكتمل بعد ' + fmt(b.chargeMs / 36e5) : 'قيد الشحن';
  else txt = fmt(lv * 0.3) + ' (تقديري)';
  $('#bTime').textContent = txt;
}
const fmt = h => { const d = Math.floor(h / 24), hh = Math.round(h % 24); return (d ? d + ' يوم و ' : '') + hh + ' ساعة'; };
battery(); setInterval(battery, 30000);

/* ---- weather (Open-Meteo, no API key) ---- */
const WMO = c => c === 0 ? ['صافٍ', '☀️'] : c <= 2 ? ['غائم جزئياً', '⛅'] : c === 3 ? ['غائم', '☁️'] : c <= 48 ? ['ضباب', '🌫️'] : c <= 57 ? ['رذاذ', '🌦️'] : c <= 67 ? ['مطر', '🌧️'] : c <= 77 ? ['ثلج', '❄️'] : c <= 82 ? ['زخات مطر', '🌧️'] : ['عاصفة رعدية', '⛈️'];
const city = () => store.get('city', { name: 'عمّان', lat: 31.9454, lon: 35.9284 });
async function weather() {
  const c = city(); $('#wCity').textContent = c.name;
  try {
    const r = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`)).json();
    const [d, e] = WMO(r.current.weather_code);
    $('#wTemp').textContent = Math.round(r.current.temperature_2m) + '°C'; $('#wDesc').textContent = d;
    $('#wIcon').textContent = !r.current.is_day && r.current.weather_code <= 2 ? '🌙' : e;
    $('#wHi').textContent = '↑' + Math.round(r.daily.temperature_2m_max[0]) + '°'; $('#wLo').textContent = '↓' + Math.round(r.daily.temperature_2m_min[0]) + '°';
    store.set('wcache', { t: $('#wTemp').textContent, d, i: $('#wIcon').textContent, h: $('#wHi').textContent, l: $('#wLo').textContent });
  } catch {
    const k = store.get('wcache'); if (k) { $('#wTemp').textContent = k.t; $('#wDesc').textContent = k.d + ' (غير متصل)'; $('#wIcon').textContent = k.i; $('#wHi').textContent = k.h; $('#wLo').textContent = k.l; } else $('#wDesc').textContent = 'لا يوجد اتصال';
  }
}
weather(); setInterval(weather, 30 * 60000);

/* ---- quote ---- */
const quote = () => store.get('quote', 'كن دائماً أفضل ... لأن الحياة تستحق كل جميل');
$('#qText').textContent = quote();

/* ---- tasks ---- */
let tasks = store.get('tasks', [{ t: 'ممارسة الرياضة', d: true }, { t: 'قراءة كتاب', d: false }, { t: 'إنجاز العمل', d: false }]);
function renderTasks() {
  const l = $('#taskList'); l.innerHTML = '';
  tasks.forEach((k, i) => {
    const row = document.createElement('label'); row.className = 'task' + (k.d ? ' done' : '');
    row.innerHTML = '<input type="checkbox"><span></span>'; row.querySelector('span').textContent = k.t;
    const cb = row.querySelector('input'); cb.checked = k.d;
    cb.onchange = () => { k.d = cb.checked; save(); };
    lp(row, () => { if (confirm('حذف المهمة؟')) { tasks.splice(i, 1); save(); } });
    l.append(row);
  });
  const n = tasks.filter(t => t.d).length; $('#taskCount').textContent = n + ' / ' + tasks.length;
  $('#progBar').style.width = tasks.length ? n / tasks.length * 100 + '%' : '0';
}
const save = () => { store.set('tasks', tasks); renderTasks(); };
$('#addTask').onclick = () => {
  const l = $('#taskList'), row = document.createElement('div'); row.className = 'task';
  row.innerHTML = '<form><input placeholder="مهمة جديدة" maxlength="60"></form>'; l.prepend(row);
  const f = row.querySelector('form'), inp = row.querySelector('input'); inp.focus();
  f.onsubmit = e => { e.preventDefault(); if (inp.value.trim()) tasks.push({ t: inp.value.trim(), d: false }); save(); };
  inp.onblur = () => f.requestSubmit();
};
function lp(el, fn, ms = 550) { let t; const c = () => clearTimeout(t); el.addEventListener('pointerdown', () => { t = setTimeout(() => { fn(); t = 0; }, ms); }); ['pointerup', 'pointerleave', 'pointercancel', 'pointermove'].forEach(e => el.addEventListener(e, c)); el.addEventListener('contextmenu', e => e.preventDefault()); }

/* ---- apps, slots, drawer ---- */
const SLOTS = [['camera', 'الكاميرا', '📷'], ['gallery', 'المعرض', '🖼️'], ['store', 'متجر Play', '▶️'], ['youtube', 'YouTube', '📺'], ['settings', 'الإعدادات', '⚙️'],
  ['phone', 'الهاتف', '📞'], ['messages', 'الرسائل', '💬'], ['browser', 'المتصفح', '🌐'], ['contacts', 'جهات الاتصال', '👤']];
const XS = [43, 202, 360, 516, 675], YS = [1410, 1553];
let apps = [], byPkg = {}, defaults = {}, pickKey = null, menuPkg = null;
const launch = p => nat('launchApp', { packageName: p }).catch(() => say('تعذر تشغيل التطبيق'));
async function loadApps() {
  if (!native) { renderTiles(); renderDrawer(); return; }
  try {
    apps = (await LB.getApps()).apps.sort((a, b) => a.label.localeCompare(b.label, 'ar'));
    byPkg = Object.fromEntries(apps.map(a => [a.packageName, a]));
    defaults = (await LB.resolveDefaults()).defaults || {};
  } catch { say('تعذر تحميل التطبيقات'); }
  renderTiles(); renderDrawer();
}
function renderTiles() {
  const box = $('#tiles'); box.innerHTML = ''; const slots = store.get('slots', {});
  SLOTS.forEach(([key, name, em], i) => {
    const pkg = slots[key] && byPkg[slots[key]] ? slots[key] : defaults[key]; const a = byPkg[pkg];
    const b = document.createElement('button'); b.className = 'tile';
    b.innerHTML = a ? `<img alt=""><span></span>` : `<div class="em">${em}</div><span></span>`;
    if (a) b.querySelector('img').src = 'data:image/png;base64,' + a.icon;
    b.querySelector('span').textContent = a ? a.label : name; b.dataset.pkg = pkg || '';
    place(b, [XS[i % 5], YS[Math.floor(i / 5)], XS[i % 5] + 125, YS[Math.floor(i / 5)] + 135]);
    let long = false; lp(b, () => { long = true; pickKey = key; openDrawer('اختر تطبيقاً لـ «' + name + '»'); });
    b.onclick = () => { buzz(); if (long) { long = false; return; } pkg ? launch(pkg) : say('اضغط مطولاً لاختيار تطبيق'); };
    box.append(b);
  });
  applyBadges();
}
function renderDrawer() {
  const l = $('#appList'); l.innerHTML = '';
  if (!apps.length) { l.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9a8bb8">' + (native ? 'جارٍ التحميل...' : 'تظهر التطبيقات بعد التثبيت على Android') + '</p>'; return; }
  for (const a of apps) {
    const b = document.createElement('button'); b.className = 'app'; b.dataset.l = a.label.toLowerCase();
    b.innerHTML = '<img alt=""><span></span>'; b.querySelector('img').src = 'data:image/png;base64,' + a.icon; b.querySelector('span').textContent = a.label;
    let long = false;
    lp(b, () => { long = true; if (!pickKey) { menuPkg = a.packageName; $('#menuTitle').textContent = a.label; $('#menu').hidden = false; } });
    b.onclick = () => {
      if (long) { long = false; return; }
      if (pickKey) { const s = store.get('slots', {}); s[pickKey] = a.packageName; store.set('slots', s); renderTiles(); closeAll(); say('تم التغيير'); }
      else { closeAll(); launch(a.packageName); }
    };
    l.append(b);
  }
  filter();
}
const filter = () => { const q = $('#appFilter').value.trim().toLowerCase(); [...$('#appList').children].forEach(e => e.hidden = !!q && !(e.dataset.l || '').includes(q)); };
$('#appFilter').oninput = filter;
function openDrawer(title = 'كل التطبيقات') { $('#drTitle').textContent = title; $('#appFilter').value = ''; $('#drawer').hidden = false; if (!pickKey) filter(); }
function closeAll() { ['drawer', 'menu', 'sheet'].forEach(i => $('#' + i).hidden = true); pickKey = null; $('#drTitle').textContent = 'كل التطبيقات'; document.activeElement?.blur(); }
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeAll);
$('#menu').onclick = e => { if (e.target.id === 'menu') $('#menu').hidden = true; };
$('#menu').querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
  const m = b.dataset.m; $('#menu').hidden = true;
  if (m === 'open') { closeAll(); launch(menuPkg); } if (m === 'info') open('appinfo', menuPkg); if (m === 'del') open('uninstall', menuPkg);
});

/* ---- settings sheet & default launcher ---- */
async function defState() {
  let d = false; try { d = (await nat('isDefaultHome')).isDefault; } catch {}
  $('#defState').textContent = d ? '✅ PHANTOM X هو الشاشة الرئيسية الحالية' : 'غير مضبوط كشاشة رئيسية افتراضية';
  $('#setDefault').hidden = d; return d;
}
function openSheet() { $('#opt3d').checked = store.get('3d', true); $('#optHap').checked = store.get('hap', true); $('#quoteIn').value = quote(); $('#cityRes').innerHTML = ''; $('#sheet').hidden = false; defState(); }
$('#setDefault').onclick = () => nat('requestHome').catch(() => say('افتح إعدادات Android > التطبيقات الافتراضية > الشاشة الرئيسية'));
$('#quoteSave').onclick = () => { const v = $('#quoteIn').value.trim(); if (v) { store.set('quote', v); $('#qText').textContent = v; say('تم الحفظ'); } };
$('#resetSlots').onclick = () => { store.set('slots', {}); renderTiles(); say('تمت إعادة الضبط'); };
$('#cityGo').onclick = async () => {
  const n = $('#cityIn').value.trim(); if (!n) return; const out = $('#cityRes'); out.textContent = '...';
  try {
    const r = await (await fetch('https://geocoding-api.open-meteo.com/v1/search?count=5&language=ar&name=' + encodeURIComponent(n))).json();
    out.innerHTML = ''; (r.results || []).forEach(x => { const b = document.createElement('button'); b.textContent = [x.name, x.admin1, x.country].filter(Boolean).join('، ');
      b.onclick = () => { store.set('city', { name: x.name, lat: x.latitude, lon: x.longitude }); weather(); closeAll(); say('تم تغيير المدينة'); }; out.append(b); });
    if (!r.results) out.textContent = 'لا نتائج';
  } catch { out.textContent = 'تعذر البحث (لا يوجد اتصال)'; }
};

/* ---- actions ---- */
const doSearch = () => { const v = $('#q').value.trim(); open('search', v); $('#q').value = ''; $('#q').blur(); };
$('#q').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
const ACT = {
  alarms: () => open('alarms'), calendar: () => open('calendar'), battery: () => open('battery'),
  weather: () => { weather(); say('جارٍ تحديث الطقس...'); }, quote: () => openSheet(),
  storage: () => { say('فتح إدارة التخزين لتنظيف الملفات'); open('storage'); },
  boost: () => { say('فتح تحسين البطارية لإيقاف التطبيقات الثقيلة'); open('boost'); },
  privacy: () => open('privacy'),
  cool: () => { say('لا يمكن تبريد الجهاز برمجياً — فتحت توفير الطاقة لتقليل الحرارة'); open('cool'); },
  voice: () => open('voice'), search: doSearch, dial: () => open('dial'), sms: () => open('sms'), music: () => open('music'),
  drawer: () => { pickKey = null; openDrawer(); }, settings: openSheet
};
document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { buzz(); ACT[b.dataset.act]?.(); }));

/* ---- 3D engine: tilt (gyroscope) + drag parallax ---- */
const stage = $('#stage'), scene = document.createElement('div'); scene.id = 'scene';
[...stage.children].forEach(c => scene.append(c)); stage.append(scene);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let tx = 0, ty = 0, cx = 0, cy = 0, beta0 = null;
const apply3d = () => document.body.classList.toggle('flat', !store.get('3d', true));
apply3d();
window.addEventListener('deviceorientation', e => { if (e.gamma == null) return; if (beta0 === null) beta0 = e.beta; tx = clamp(e.gamma / 3, -9, 9); ty = clamp((e.beta - beta0 * .3 - 40) / 3, -9, 9); }, true);
stage.addEventListener('pointermove', e => { if (e.buttons) { const r = stage.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * 18; ty = -((e.clientY - r.top) / r.height - .5) * 18; } });
(function loop() { if (store.get('3d', true)) { cx += (tx - cx) * .08; cy += (ty - cy) * .08; scene.style.transform = `rotateY(${-cx}deg) rotateX(${cy}deg)`; } requestAnimationFrame(loop); })();
$('#opt3d').onchange = e => { store.set('3d', e.target.checked); apply3d(); };
$('#optHap').onchange = e => store.set('hap', e.target.checked);
const buzz = () => { if (store.get('hap', true)) try { navigator.vibrate?.(12); } catch {} };

/* ---- swipe: up = drawer, down = notification panel ---- */
let sy = 0, sx = 0;
stage.addEventListener('touchstart', e => { sy = e.touches[0].clientY; sx = e.touches[0].clientX; }, { passive: true });
stage.addEventListener('touchend', e => {
  const t = e.changedTouches[0], dy = t.clientY - sy, dx = t.clientX - sx;
  if (Math.abs(dy) < 110 || Math.abs(dx) > 70 || e.target.closest('#taskList,#q')) return;
  if (dy < 0) { pickKey = null; openDrawer(); } else nat('expandPanel').catch(() => {});
}, { passive: true });

/* ---- notification badges & location ---- */
let badges = {}, notifOn = false;
function applyBadges() {
  document.querySelectorAll('.tile').forEach(t => {
    t.querySelector('.bdg')?.remove(); const n = badges[t.dataset.pkg];
    if (n) { const d = document.createElement('i'); d.className = 'bdg'; d.textContent = n > 99 ? '99+' : n; d.style.fontStyle = 'normal'; t.append(d); }
  });
}
async function loadBadges() { try { const r = await LB.getBadges(); badges = r.badges || {}; notifOn = r.enabled; applyBadges(); } catch {} }
$('#btnNotif').onclick = () => { say('فعّل PHANTOM X في قائمة الوصول للإشعارات'); nat('openNotifAccess').catch(() => say('تعذر فتح الإعدادات')); };
$('#btnLoc').onclick = async () => {
  try { const r = await nat('getLocation'); store.set('city', { name: r.name || 'موقعي', lat: r.lat, lon: r.lon }); weather(); closeAll(); say('تم تحديد موقعك'); }
  catch { say('تعذر تحديد الموقع (تأكد من الصلاحية وتفعيل GPS)'); }
};

/* ---- lifecycle ---- */
const anyOpen = () => ['drawer', 'menu', 'sheet'].some(i => !$('#' + i).hidden);
if (native) {
  App.addListener('backButton', () => { if (anyOpen()) closeAll(); });
  App.addListener('appStateChange', s => { if (s.isActive) { battery(); weather(); tick(); loadBadges(); } });
  LB.addListener('appsChanged', () => loadApps());
  LB.addListener('badges', b => { badges = b; applyBadges(); });
  loadBadges();
  LB.addListener('homePressed', () => { closeAll(); });
}
loadApps();
if (!store.get('asked', false)) { store.set('asked', true); setTimeout(openSheet, 900); }
