/* Royal Gold — Real features layer. Developer: Khader Abo Salha */
(function(){
'use strict';
if(window.__rgFeatures)return;window.__rgFeatures=true;
const RG=window.RG={};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const DB={get(k,d){try{const v=localStorage.getItem('rg_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('rg_'+k,JSON.stringify(v))}catch(e){toastMsg('تعذّر الحفظ')}}};
const firstLine=t=>(String(t).split('\n')[0]||'').slice(0,60)||'ملاحظة فارغة';
const now0=new Date();
const S={cy:now0.getFullYear(),cm:now0.getMonth(),sel:ymd(now0),note:null,ct:'world',pt:'dial',dial:'',face:'environment',
 sw:{run:false,t0:0,acc:0,laps:[]},tm:{run:false,end:0,left:0},map:DB.get('map',{lat:31.9539,lon:35.9106,label:'عمّان'}),
 recent:[],urls:[],hid:0,tx:'out',pin:''};

/* ---------- styles ---------- */
const css=document.createElement('style');
css.textContent=`
.item{display:flex;align-items:center;gap:10px;padding:11px 2px;border-bottom:1px solid #ffffff13}.item:last-child{border:0}
.item .grow{flex:1;min-width:0}.item small{display:block;color:var(--muted);font-size:11px;margin-top:2px}
.item b{word-break:break-word}
.ibtn{border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:12px;padding:8px 12px;font-size:13px}
.ibtn.red{color:var(--red)}
.blk{display:block;width:100%;margin-top:8px}
.seg{display:flex;gap:6px;margin-bottom:12px}.seg button{flex:1;border:1px solid var(--line);background:#ffffff0d;color:var(--text);border-radius:12px;padding:9px 4px;font-size:13px}
.seg button.on{background:linear-gradient(135deg,#e8c783,#9a6a2b);color:#171009;font-weight:700}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
.cal .dow{color:var(--muted);font-size:11px;padding:4px 0}
.cal .d{border:0;background:none;color:var(--text);padding:10px 0;border-radius:12px;font-size:14px;position:relative}
.cal .d.today{border:1px solid var(--gold)}.cal .d.sel{background:var(--gold);color:#201507;font-weight:700}
.cal .d.has:after{content:"";position:absolute;bottom:3px;left:50%;margin-left:-2px;width:4px;height:4px;border-radius:50%;background:var(--green)}
.mono{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:plaintext}
.center{text-align:center}
.rgov{position:absolute;inset:0;z-index:55;background:#050505f2;backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:18px;flex-direction:column;gap:12px}
.rgov .box{width:100%;max-width:330px;padding:22px;text-align:center}
.rgov img{max-width:100%;max-height:72%;border-radius:16px}
#dim{position:absolute;inset:0;z-index:70;pointer-events:none;background:#000;opacity:0}
#pinlock{position:absolute;inset:0;z-index:80;background:#050505;display:flex;align-items:center;justify-content:center;padding:24px}
#pinlock .pin-in{width:100%;max-width:300px;text-align:center}
.pin-dots{display:flex;gap:12px;justify-content:center;margin:16px 0 6px;direction:ltr}.pin-dots i{width:14px;height:14px;border-radius:50%;border:1px solid var(--gold)}.pin-dots i.f{background:var(--gold)}
.pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px;direction:ltr}.pin-pad button{height:62px;border-radius:50%;border:1px solid var(--line);background:#ffffff12;color:#fff;font-size:22px}
.vid{width:100%;height:370px;object-fit:cover;border-radius:22px;background:#000}
.stat{font-size:34px;font-weight:300;color:var(--gold2)}
.bar{height:8px;border-radius:6px;background:#ffffff18;overflow:hidden;margin-top:6px}.bar i{display:block;height:100%;background:linear-gradient(90deg,#e8c783,#9a6a2b)}
.wallet-card{padding:22px;background:linear-gradient(135deg,#b58a42,#3b2914)!important}
textarea.field{resize:none;line-height:1.7}
.flash{animation:fl .25s}@keyframes fl{0%{opacity:.2}100%{opacity:1}}
`;
document.head.appendChild(css);

/* ---------- IndexedDB (photos / music) ---------- */
let _db;
function idb(){return _db||(_db=new Promise((res,rej)=>{const r=indexedDB.open('royalgold',1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'});if(!d.objectStoreNames.contains('music'))d.createObjectStore('music',{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))}
async function idbTx(st,mode,fn){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction(st,mode),q=fn(t.objectStore(st));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})}
const idbAll=st=>idbTx(st,'readonly',s=>s.getAll());
const idbGet=(st,id)=>idbTx(st,'readonly',s=>s.get(id));
const idbPut=(st,v)=>idbTx(st,'readwrite',s=>s.put(v));
const idbDel=(st,id)=>idbTx(st,'readwrite',s=>s.delete(id));
const idbClr=st=>idbTx(st,'readwrite',s=>s.clear());

/* ---------- helpers ---------- */
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)();[0,.3,.6].forEach(t=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.2,a.currentTime+t);o.start(a.currentTime+t);o.stop(a.currentTime+t+.18)})}catch(e){}}
function alertBox(title,msg){beep();try{navigator.vibrate&&navigator.vibrate([300,150,300,150,300])}catch(e){}
 const d=document.createElement('div');d.className='rgov';d.innerHTML='<div class="glass box"><div style="font-size:42px">🔔</div><h2>'+esc(title)+'</h2><p class="sub">'+esc(msg||'')+'</p><button class="btn blk" onclick="this.closest(\'.rgov\').remove()">حسناً</button></div>';$('.phone').appendChild(d)}
function openUrl(u){location.href=u}
function rerender(){const st=screen.scrollTop;screen.innerHTML=page(current);post(current);screen.scrollTop=st}
RG.re=rerender;
const fmtDate=(d,o)=>d.toLocaleDateString('ar-JO',o||{weekday:'long',day:'numeric',month:'long'});
const fmtT=d=>d.toLocaleTimeString('ar-JO',{hour:'2-digit',minute:'2-digit'});

/* ---------- battery / network ---------- */
const BAT={lvl:null,chg:false};
function paintBat(){const t=BAT.lvl==null?'—':BAT.lvl+'%';$$('[data-bat]').forEach(e=>e.textContent=t);$$('[data-batsub]').forEach(e=>e.textContent=BAT.lvl==null?'غير متاح':(BAT.chg?'قيد الشحن ⚡':'على البطارية'));const st=$('.status .right span:last-child');if(st&&BAT.lvl!=null)st.textContent=t+' ▰'}
if(navigator.getBattery)navigator.getBattery().then(b=>{const u=()=>{BAT.lvl=Math.round(b.level*100);BAT.chg=b.charging;paintBat()};u();b.addEventListener('levelchange',u);b.addEventListener('chargingchange',u)}).catch(()=>{});
function netText(){const c=navigator.connection;return navigator.onLine?('متصل'+(c&&c.effectiveType?' · '+c.effectiveType.toUpperCase():'')):'غير متصل'}
function paintNet(){$$('[data-net]').forEach(e=>e.textContent=netText())}
addEventListener('online',paintNet);addEventListener('offline',paintNet);

/* ---------- weather (Open-Meteo, no key) ---------- */
let W=DB.get('weather',null);
const WC=c=>c===0?['صافٍ','☀️']:c===1?['غالباً صافٍ','🌤️']:c===2?['غائم جزئياً','⛅']:c===3?['غائم','☁️']:(c===45||c===48)?['ضباب','🌫️']:(c>=51&&c<=57)?['رذاذ','🌦️']:(c>=61&&c<=67)?['مطر','🌧️']:(c>=71&&c<=77)?['ثلج','❄️']:(c>=80&&c<=82)?['زخات مطر','🌧️']:(c===85||c===86)?['ثلج','❄️']:c>=95?['عاصفة رعدية','⛈️']:['—','☁️'];
function getPos(){return new Promise(r=>{if(!navigator.geolocation)return r(null);navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lon:p.coords.longitude}),()=>r(null),{timeout:9000,maximumAge:600000})})}
let wBusy=null;
function loadWeather(force){
 if(!force&&W&&Date.now()-W.t<30*60000)return Promise.resolve(W);
 if(wBusy)return wBusy;
 wBusy=(async()=>{
  let pos=await getPos(),def=false;
  if(pos)DB.set('lastpos',pos);else{pos=DB.get('lastpos',null);if(!pos){pos={lat:31.9539,lon:35.9106};def=true}}
  const u='https://api.open-meteo.com/v1/forecast?latitude='+pos.lat+'&longitude='+pos.lon+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2';
  const j=await (await fetch(u)).json();
  const c=j.current;let name=def?'عمّان':'موقعك';
  try{const g=await (await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+pos.lat+'&longitude='+pos.lon+'&localityLanguage=ar')).json();name=g.city||g.locality||g.principalSubdivision||name}catch(e){}
  let i=j.hourly.time.indexOf(String(c.time).slice(0,13)+':00');if(i<0)i=0;
  const hours=[];for(let k=1;k<=4;k++){const ix=i+k*3;if(!j.hourly.time[ix])break;const h=+j.hourly.time[ix].slice(11,13);hours.push({h:(h%12||12)+' '+(h<12?'ص':'م'),t:Math.round(j.hourly.temperature_2m[ix]),c:j.hourly.weather_code[ix]})}
  W={t:Date.now(),name,temp:Math.round(c.temperature_2m),feel:Math.round(c.apparent_temperature),hum:c.relative_humidity_2m,wind:Math.round(c.wind_speed_10m),code:c.weather_code,hi:Math.round(j.daily.temperature_2m_max[0]),lo:Math.round(j.daily.temperature_2m_min[0]),hours};
  DB.set('weather',W);return W;
 })().finally(()=>{wBusy=null});
 return wBusy;
}
function paintWeather(){
 const h=$('#hw');if(h){h.innerHTML=W?'<div><div class="sub">'+esc(W.name)+' · '+WC(W.code)[0]+'</div><div class="temp">'+W.temp+'°</div><div class="sub">العظمى '+W.hi+'° · الصغرى '+W.lo+'°</div></div><div style="font-size:48px">'+WC(W.code)[1]+'</div>':'<div class="sub">جارٍ تحميل الطقس…</div>'}
 const l=$('#lw');if(l)l.innerHTML=W?'<div style="font-size:24px">'+WC(W.code)[1]+' '+W.temp+'°</div><small>'+esc(W.name)+' · '+WC(W.code)[0]+'</small>':'<small>الطقس…</small>';
 const b=$('#wbox');if(b){b.innerHTML=W?'<div class="glass widget weather"><div><div class="sub">'+esc(W.name)+' · '+WC(W.code)[0]+'</div><div class="big-number">'+W.temp+'°</div><div class="sub">العظمى '+W.hi+'° · الصغرى '+W.lo+'°</div></div><span style="font-size:58px">'+WC(W.code)[1]+'</span></div>'+
  '<div class="two"><div class="glass tile"><div class="sub">الإحساس</div><strong>'+W.feel+'°</strong></div><div class="glass tile"><div class="sub">الرطوبة</div><strong>'+W.hum+'%</strong></div><div class="glass tile"><div class="sub">الرياح</div><strong>'+W.wind+' كم/س</strong></div><div class="glass tile"><div class="sub">آخر تحديث</div><strong style="font-size:18px">'+fmtT(new Date(W.t))+'</strong></div></div>'+
  (W.hours.length?'<h3>الساعات القادمة</h3><div class="two">'+W.hours.map(x=>'<div class="glass tile"><div class="sub">'+x.h+'</div><strong>'+WC(x.c)[1]+' '+x.t+'°</strong></div>').join('')+'</div>':''):'<div class="glass widget center sub">جارٍ تحميل الطقس…</div>'}
}
function refreshWeather(force){paintWeather();loadWeather(force).then(paintWeather).catch(()=>{if(!W){const t='<div class="sub">تعذّر تحميل الطقس — تحقق من الإنترنت</div>';['#hw','#wbox','#lw'].forEach(s=>{const e=$(s);if(e)e.innerHTML=t})}else{toastMsg('تعذّر التحديث — عرض آخر بيانات')}})}
RG.wRefresh=()=>{toastMsg('جارٍ التحديث…');refreshWeather(true)};

/* ---------- events / next appointment ---------- */
function nextEvent(){const n=new Date(),today=ymd(n),hm=pad(n.getHours())+':'+pad(n.getMinutes());
 const ev=DB.get('events',[]).filter(e=>e.d>today||(e.d===today&&(!e.t||e.t>=hm))).sort((a,b)=>(a.d+(a.t||'00:00')).localeCompare(b.d+(b.t||'00:00')));return ev[0]||null}
function nextText(){const e=nextEvent();if(!e)return 'لا مواعيد قادمة';return esc(e.x)+(e.t?' · '+e.t:'')+(e.d!==ymd(new Date())?' · '+e.d.slice(5):'')}

/* ---------- PAGES ---------- */
const P={};

P.home=()=>{const d=new Date();
 return head('مرحباً بك',fmtDate(d))+'<div class="actionbar"><button class="btn ghost" onclick="go(\'lock\')">◉ شاشة القفل</button><button class="btn ghost" onclick="openNotifications()">♧ الإشعارات</button></div>'+
 '<div class="glass widget weather" id="hw" onclick="go(\'weather\')"></div>'+
 '<div class="two"><div class="glass tile" onclick="go(\'calendar\')"><div class="sub">'+d.toLocaleDateString('ar-JO',{weekday:'long'})+'</div><strong>'+d.getDate()+'</strong><div class="sub" id="hnext"></div></div><div class="glass tile" onclick="go(\'settings\')"><div class="sub">البطارية</div><strong class="gold" data-bat>—</strong><div class="sub" data-batsub></div></div></div>'+
 appGrid(apps.slice(0,12))+'<div class="dock">'+apps.slice(0,4).map(a=>'<button class="app" onclick="go(\''+a[2]+'\')"><span class="appicon">'+a[1]+'</span></button>').join('')+'</div><div class="search" onclick="go(\'search\')">⌕　بحث في التطبيقات والمحتوى</div>'};

P.lock=()=>'<div class="lock-v4"><div class="lock-date" id="lockDate"></div><div class="lock-clock" id="lockClock"></div><div class="lock-widgets"><div class="lock-widget" id="lw"></div><div class="lock-widget" onclick="go(\'calendar\')"><div style="font-size:23px">▣ '+new Date().getDate()+'</div><small id="lnext"></small></div></div><div class="lock-bottom"><button class="circle" onclick="go(\'camera\')">◉</button><button class="circle" onclick="go(\'home\')">⌂</button></div><div class="hint" style="margin-top:12px">اضغط زر المنزل لفتح الشاشة الرئيسية</div></div>';

P.weather=()=>head('الطقس','حسب موقعك الحالي')+'<div id="wbox"></div><button class="btn blk" onclick="RG.wRefresh()">↻ تحديث</button><p class="sub center">البيانات من Open‑Meteo وتحتاج اتصالاً بالإنترنت.</p>';

/* calendar */
P.calendar=()=>{
 const ev=DB.get('events',[]),first=new Date(S.cy,S.cm,1),days=new Date(S.cy,S.cm+1,0).getDate(),off=first.getDay(),today=ymd(new Date());
 let cells='';['ح','ن','ث','ر','خ','ج','س'].forEach(x=>cells+='<div class="dow">'+x+'</div>');
 for(let i=0;i<off;i++)cells+='<div></div>';
 for(let d=1;d<=days;d++){const k=S.cy+'-'+pad(S.cm+1)+'-'+pad(d);cells+='<button class="d'+(k===today?' today':'')+(k===S.sel?' sel':'')+(ev.some(e=>e.d===k)?' has':'')+'" onclick="RG.calSel(\''+k+'\')">'+d+'</button>'}
 const list=ev.filter(e=>e.d===S.sel).sort((a,b)=>(a.t||'').localeCompare(b.t||''));
 const sd=new Date(S.sel+'T12:00:00');
 return head('التقويم',new Date(S.cy,S.cm,1).toLocaleDateString('ar-JO',{month:'long',year:'numeric'}))+
 '<div class="glass widget"><div class="two" style="margin-bottom:10px"><button class="ibtn" onclick="RG.calMove(-1)">› السابق</button><button class="ibtn" onclick="RG.calMove(1)">التالي ‹</button></div><div class="cal">'+cells+'</div><button class="ibtn blk" onclick="RG.calToday()">اليوم</button></div>'+
 '<div class="glass widget"><b>'+fmtDate(sd)+'</b>'+(list.length?list.map(e=>'<div class="item"><div class="grow"><b>'+esc(e.x)+'</b><small>'+(e.t||'طوال اليوم')+'</small></div><button class="ibtn red" onclick="RG.evDel(\''+e.id+'\')">حذف</button></div>').join(''):'<p class="sub">لا توجد مواعيد في هذا اليوم</p>')+
 '<input id="evx" class="field" placeholder="عنوان الموعد"><input id="evt" type="time" class="field"><button class="btn blk" onclick="RG.evAdd()">＋ إضافة موعد</button></div>'};
RG.calSel=k=>{S.sel=k;rerender()};
RG.calMove=n=>{S.cm+=n;if(S.cm<0){S.cm=11;S.cy--}if(S.cm>11){S.cm=0;S.cy++}rerender()};
RG.calToday=()=>{const n=new Date();S.cy=n.getFullYear();S.cm=n.getMonth();S.sel=ymd(n);rerender()};
RG.evAdd=()=>{const x=$('#evx').value.trim();if(!x){toastMsg('اكتب عنوان الموعد');return}const ev=DB.get('events',[]);ev.push({id:uid(),d:S.sel,t:$('#evt').value,x});DB.set('events',ev);toastMsg('تمت الإضافة');rerender()};
RG.evDel=id=>{DB.set('events',DB.get('events',[]).filter(e=>e.id!==id));rerender()};

/* notes */
P.notes=()=>{
 if(S.note!==null){const n=S.note==='new'?{x:''}:(DB.get('notes',[]).find(x=>x.id===S.note)||{x:''});
  return head('ملاحظة','')+'<div class="glass widget"><textarea id="nt" class="field" rows="12" placeholder="ابدأ الكتابة…">'+esc(n.x)+'</textarea><div class="two"><button class="btn" onclick="RG.noteSave()">حفظ</button><button class="btn ghost" onclick="RG.noteBack()">رجوع</button></div>'+(S.note!=='new'?'<button class="ibtn red blk" onclick="RG.noteDel()">حذف الملاحظة</button>':'')+'</div>'}
 const ns=DB.get('notes',[]).sort((a,b)=>b.ts-a.ts);
 return head('الملاحظات',ns.length+' ملاحظة')+'<input class="field" placeholder="بحث" oninput="RG.noteQ(this.value)"><button class="btn blk" onclick="RG.noteOpen(\'new\')">＋ ملاحظة جديدة</button><div class="glass widget" style="margin-top:12px">'+(ns.length?ns.map(n=>'<div class="item" data-q="'+esc(n.x.toLowerCase())+'" onclick="RG.noteOpen(\''+n.id+'\')"><div class="grow"><b>'+esc(firstLine(n.x))+'</b><small>'+fmtDate(new Date(n.ts),{day:'numeric',month:'long'})+'</small></div><span class="chev">‹</span></div>').join(''):'<p class="sub">لا توجد ملاحظات بعد</p>')+'</div>'};
RG.noteOpen=id=>{S.note=id;if(current!=='notes')go('notes');else rerender()};
RG.noteQ=q=>{q=q.toLowerCase();$$('.item[data-q]').forEach(e=>e.style.display=e.dataset.q.includes(q)?'flex':'none')};
RG.noteSave=(silent)=>{const x=($('#nt')||{}).value||'';const ns=DB.get('notes',[]);
 if(S.note==='new'){if(x.trim()){const n={id:uid(),x,ts:Date.now()};ns.push(n);S.note=n.id}}else{const n=ns.find(i=>i.id===S.note);if(n){n.x=x;n.ts=Date.now()}}
 DB.set('notes',ns);if(!silent)toastMsg(x.trim()?'تم الحفظ':'الملاحظة فارغة')};
RG.noteBack=()=>{RG.noteSave(true);S.note=null;rerender()};
RG.noteDel=()=>{DB.set('notes',DB.get('notes',[]).filter(n=>n.id!==S.note));S.note=null;toastMsg('تم الحذف');rerender()};

/* reminders */
P.reminders=()=>{const r=DB.get('rem',[]).sort((a,b)=>(a.done-b.done)||((a.at||'z').localeCompare(b.at||'z')));
 return head('التذكيرات',r.filter(x=>!x.done).length+' قيد الانتظار')+'<div class="glass widget"><input id="rx" class="field" placeholder="تذكير جديد"><input id="rat" type="datetime-local" class="field"><button class="btn blk" onclick="RG.remAdd()">＋ إضافة تذكير</button><p class="sub">ينبّهك التطبيق عند الموعد أثناء فتحه.</p></div><div class="glass widget">'+
 (r.length?r.map(x=>'<div class="item"><button class="ibtn" onclick="RG.remTog(\''+x.id+'\')">'+(x.done?'✓':'○')+'</button><div class="grow"><b style="'+(x.done?'text-decoration:line-through;opacity:.6':'')+'">'+esc(x.x)+'</b>'+(x.at?'<small>'+fmtDate(new Date(x.at),{day:'numeric',month:'short'})+' · '+fmtT(new Date(x.at))+'</small>':'')+'</div><button class="ibtn red" onclick="RG.remDel(\''+x.id+'\')">حذف</button></div>').join(''):'<p class="sub">لا توجد تذكيرات</p>')+'</div>'};
RG.remAdd=()=>{const x=$('#rx').value.trim();if(!x){toastMsg('اكتب نص التذكير');return}const r=DB.get('rem',[]);r.push({id:uid(),x,at:$('#rat').value,done:false,n:0});DB.set('rem',r);rerender()};
RG.remTog=id=>{const r=DB.get('rem',[]),i=r.find(x=>x.id===id);if(i)i.done=!i.done;DB.set('rem',r);rerender()};
RG.remDel=id=>{DB.set('rem',DB.get('rem',[]).filter(x=>x.id!==id));rerender()};
function checkReminders(){const r=DB.get('rem',[]);let ch=false;const n=Date.now();r.forEach(x=>{if(!x.done&&!x.n&&x.at&&new Date(x.at).getTime()<=n){x.n=1;ch=true;alertBox('تذكير',x.x)}});if(ch){DB.set('rem',r);if(current==='reminders')rerender()}}

/* clock */
const ZONES=[['عمّان','Asia/Amman'],['مكة / الرياض','Asia/Riyadh'],['القاهرة','Africa/Cairo'],['دبي','Asia/Dubai'],['إسطنبول','Europe/Istanbul'],['لندن','Europe/London'],['باريس','Europe/Paris'],['نيويورك','America/New_York'],['طوكيو','Asia/Tokyo']];
const fmtSW=ms=>{const c=Math.floor(ms/10)%100,s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000);return pad(m)+':'+pad(s)+'.'+pad(c)};
const fmtTM=ms=>{const t=Math.ceil(ms/1000),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return (h?pad(h)+':':'')+pad(m)+':'+pad(s)};
const swNow=()=>S.sw.acc+(S.sw.run?performance.now()-S.sw.t0:0);
P.clock=()=>{let body='';
 if(S.ct==='world')body='<div class="glass widget">'+ZONES.map(z=>'<div class="item"><div class="grow"><b>'+z[0]+'</b></div><span class="mono" data-tz="'+z[1]+'"></span></div>').join('')+'</div>';
 else if(S.ct==='stop')body='<div class="glass widget center"><div class="big-number mono" id="swd">'+fmtSW(swNow())+'</div><div class="two"><button class="btn" onclick="RG.swToggle()">'+(S.sw.run?'إيقاف':'ابدأ')+'</button><button class="btn ghost" onclick="'+(S.sw.run?'RG.swLap()':'RG.swReset()')+'">'+(S.sw.run?'لفة':'تصفير')+'</button></div></div>'+(S.sw.laps.length?'<div class="glass widget">'+S.sw.laps.map((l,i)=>'<div class="item"><div class="grow">لفة '+(S.sw.laps.length-i)+'</div><span class="mono">'+fmtSW(l)+'</span></div>').join('')+'</div>':'');
 else{const t=S.tm;body='<div class="glass widget center"><div class="big-number mono" id="tmd">'+(t.run?fmtTM(t.end-Date.now()):t.left?fmtTM(t.left):'00:00')+'</div>'+(t.run||t.left?'':'<div class="two"><input id="tmm" class="field" type="number" min="0" max="999" placeholder="دقائق" value="1"><input id="tms" class="field" type="number" min="0" max="59" placeholder="ثوانٍ" value="0"></div>')+'<div class="two"><button class="btn" onclick="RG.tmToggle()">'+(t.run?'إيقاف مؤقت':t.left?'متابعة':'ابدأ')+'</button><button class="btn ghost" onclick="RG.tmReset()">إلغاء</button></div><p class="sub">يعمل المؤقت أثناء فتح التطبيق.</p></div>'}
 return head('الساعة','أدوات الوقت')+'<div class="glass widget center"><div class="big-number mono" id="liveClock"></div><div class="sub">'+fmtDate(new Date())+'</div></div><div class="seg">'+[['world','العالم'],['stop','ساعة إيقاف'],['timer','مؤقت']].map(x=>'<button class="'+(S.ct===x[0]?'on':'')+'" onclick="RG.tab(\''+x[0]+'\')">'+x[1]+'</button>').join('')+'</div>'+body};
RG.tab=t=>{S.ct=t;if(current==='clock')rerender();else go('clock')};
RG.swToggle=()=>{const s=S.sw;if(s.run){s.acc+=performance.now()-s.t0;s.run=false}else{s.t0=performance.now();s.run=true}rerender()};
RG.swLap=()=>{S.sw.laps.unshift(swNow());rerender()};
RG.swReset=()=>{S.sw={run:false,t0:0,acc:0,laps:[]};rerender()};
RG.tmToggle=()=>{const t=S.tm;if(t.run){t.left=Math.max(0,t.end-Date.now());t.run=false}else{if(!t.left){const m=+($('#tmm')||{}).value||0,s=+($('#tms')||{}).value||0;t.left=(m*60+s)*1000}if(!t.left){toastMsg('حدّد مدة المؤقت');return}t.end=Date.now()+t.left;t.run=true;t.left=0}rerender()};
RG.tmReset=()=>{S.tm={run:false,end:0,left:0};rerender()};

/* calculator */
P.calculator=()=>head('الحاسبة','عمليات حسابية')+'<div class="glass widget"><input id="calcDisplay" class="field mono" value="0" readonly style="font-size:32px;text-align:left"><div class="grid" style="grid-template-columns:repeat(4,1fr);gap:8px">'+['C','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','±','0','.','='].map(k=>'<button class="btn'+(/[0-9.]/.test(k)?' ghost':'')+'" style="min-height:56px;font-size:20px" onclick="calcKey(\''+k+'\')">'+k+'</button>').join('')+'</div></div>';
window.calcKey=function(k){const d=$('#calcDisplay');if(!d)return;let v=d.value==='خطأ'?'0':d.value;
 if(k==='C')v='0';else if(k==='⌫')v=v.length>1?v.slice(0,-1):'0';
 else if(k==='±'){v=v.startsWith('-')?v.slice(1):(v==='0'?v:'-'+v)}
 else if(k==='='){try{const s=v.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/%/g,'/100');if(!/^[0-9+\-*/.()\s]+$/.test(s))throw 0;const r=Function('"use strict";return ('+s+')')();if(!isFinite(r))throw 0;v=String(+r.toFixed(10))}catch(e){v='خطأ'}}
 else{const op=/[+−×÷]/.test(k);if(v==='0'&&!op&&k!=='.'&&k!=='%')v=k;else{const last=v.slice(-1);if(op&&/[+−×÷]/.test(last))v=v.slice(0,-1)+k;else v+=k}}
 d.value=v};

/* health */
const hKey=()=>ymd(new Date());
const hGet=()=>{const H=DB.get('health',{});return {H,v:Object.assign({water:0,steps:0,sleep:0},H[hKey()])}};
const hSet=p=>{const {H,v}=hGet();H[hKey()]=Object.assign(v,p);DB.set('health',H)};
P.health=()=>{const v=hGet().v,on=DB.get('stepon',false);
 const hist=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-i);const k=ymd(d),h=DB.get('health',{})[k]||{};return '<div class="item"><div class="grow"><b>'+fmtDate(d,{weekday:'long',day:'numeric'})+'</b><small>💧 '+(h.water||0)+' · 😴 '+(h.sleep||0)+' ساعة</small></div><span class="mono">'+(h.steps||0)+' 🚶</span></div>'}).join('');
 return head('الصحة','ملخص اليوم')+'<div class="two"><div class="glass tile"><div class="sub">الخطوات</div><div class="stat mono" id="stepsN">'+v.steps+'</div></div><div class="glass tile"><div class="sub">الماء (كأس)</div><div class="stat mono" id="waterN">'+v.water+'</div><div class="bar"><i id="waterB" style="width:'+Math.min(100,v.water/8*100)+'%"></i></div></div></div>'+
 '<div class="glass widget"><div class="item"><div class="grow"><b>عدّاد الخطوات</b><small>تقريبي عبر حسّاس الحركة، ويعمل أثناء فتح التطبيق فقط</small></div><button class="toggle'+(on?' on':'')+'" onclick="RG.stepTog(this)"></button></div>'+
 '<div class="item"><div class="grow"><b>شرب الماء</b><small>الهدف 8 أكواب</small></div><button class="ibtn" onclick="RG.water(-1)">−</button><button class="ibtn" onclick="RG.water(1)">＋</button></div>'+
 '<div class="item"><div class="grow"><b>ساعات النوم</b><input id="slp" class="field" type="number" min="0" max="24" step="0.5" value="'+(v.sleep||'')+'" placeholder="مثال 7.5"></div><button class="ibtn" onclick="RG.sleep()">حفظ</button></div></div>'+
 '<h3>آخر 7 أيام</h3><div class="glass widget">'+hist+'</div>'};
RG.water=d=>{const v=hGet().v;hSet({water:Math.max(0,v.water+d)});const n=hGet().v.water;$('#waterN').textContent=n;$('#waterB').style.width=Math.min(100,n/8*100)+'%'};
RG.sleep=()=>{hSet({sleep:+$('#slp').value||0});toastMsg('تم حفظ ساعات النوم')};
let lastStep=0,avg=9.8;
function onMotion(e){const a=e.accelerationIncludingGravity;if(!a||a.x==null)return;const m=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z);avg=avg*.9+m*.1;const t=Date.now();if(m-avg>2.2&&t-lastStep>320){lastStep=t;hSet({steps:hGet().v.steps+1});const el=$('#stepsN');if(el)el.textContent=hGet().v.steps}}
function stepsOn(on){removeEventListener('devicemotion',onMotion);if(on)addEventListener('devicemotion',onMotion)}
RG.stepTog=b=>{const on=!DB.get('stepon',false);DB.set('stepon',on);b.classList.toggle('on',on);stepsOn(on);toastMsg(on?'بدأ عدّ الخطوات':'تم الإيقاف')};

/* wallet */
P.wallet=()=>{const tx=DB.get('tx',[]).sort((a,b)=>b.ts-a.ts),cur=DB.get('cur','د.أ'),m=new Date().getMonth(),inc=tx.filter(t=>t.k==='in').reduce((s,t)=>s+t.a,0),out=tx.filter(t=>t.k==='out').reduce((s,t)=>s+t.a,0);
 return head('المحفظة','دفتر دخلك ومصروفاتك')+'<div class="glass widget wallet-card"><div class="sub">الرصيد</div><div style="font-size:38px;font-weight:300" class="mono">'+(inc-out).toFixed(2)+' '+esc(cur)+'</div><div class="two" style="margin-top:14px"><div><div class="sub">الدخل</div><b class="mono">'+inc.toFixed(2)+'</b></div><div><div class="sub">المصروف</div><b class="mono">'+out.toFixed(2)+'</b></div></div></div>'+
 '<div class="glass widget"><div class="seg"><button class="'+(S.tx==='out'?'on':'')+'" onclick="RG.txType(\'out\')">مصروف</button><button class="'+(S.tx==='in'?'on':'')+'" onclick="RG.txType(\'in\')">دخل</button></div><input id="txa" class="field" type="number" inputmode="decimal" placeholder="المبلغ"><input id="txx" class="field" placeholder="البيان (مثال: بنزين)"><button class="btn blk" onclick="RG.txAdd()">＋ إضافة</button><input class="field" value="'+esc(cur)+'" onchange="DB_cur(this.value)" placeholder="العملة" style="margin-top:12px"></div>'+
 '<div class="glass widget">'+(tx.length?tx.slice(0,40).map(t=>'<div class="item"><div class="grow"><b>'+esc(t.x||(t.k==='in'?'دخل':'مصروف'))+'</b><small>'+fmtDate(new Date(t.ts),{day:'numeric',month:'short'})+'</small></div><b class="mono" style="color:'+(t.k==='in'?'var(--green)':'var(--red)')+'">'+(t.k==='in'?'+':'−')+t.a.toFixed(2)+'</b><button class="ibtn red" onclick="RG.txDel(\''+t.id+'\')">✕</button></div>').join(''):'<p class="sub">لا توجد حركات بعد</p>')+'</div>'};
window.DB_cur=v=>DB.set('cur',v.trim()||'د.أ');
RG.txType=k=>{S.tx=k;rerender()};
RG.txAdd=()=>{const a=parseFloat($('#txa').value);if(!(a>0)){toastMsg('أدخل مبلغاً صحيحاً');return}const t=DB.get('tx',[]);t.push({id:uid(),k:S.tx,a,x:$('#txx').value.trim(),ts:Date.now()});DB.set('tx',t);rerender()};
RG.txDel=id=>{DB.set('tx',DB.get('tx',[]).filter(t=>t.id!==id));rerender()};

/* maps (OpenStreetMap) */
const mapSrc=m=>'https://www.openstreetmap.org/export/embed.html?bbox='+(m.lon-.015)+','+(m.lat-.01)+','+(m.lon+.015)+','+(m.lat+.01)+'&layer=mapnik&marker='+m.lat+','+m.lon;
P.maps=()=>head('الخرائط',esc(S.map.label))+'<input id="mq" class="field" placeholder="ابحث عن مكان أو عنوان" onkeydown="if(event.key===\'Enter\')RG.mapSearch()"><div class="two"><button class="btn" onclick="RG.mapSearch()">بحث</button><button class="btn ghost" onclick="RG.mapMe()">📍 موقعي</button></div><div class="glass widget" style="padding:0;overflow:hidden;height:300px;margin-top:12px"><iframe id="mapf" style="width:100%;height:100%;border:0" loading="lazy"></iframe></div><div id="mres"></div><button class="btn ghost blk" onclick="RG.mapOpen()">فتح في تطبيق الخرائط</button><p class="sub center">الخريطة تحتاج اتصالاً بالإنترنت.</p>';
function mapShow(m){S.map=m;DB.set('map',m);const f=$('#mapf');if(f)f.src=mapSrc(m);const h=$('.pagehead .sub');if(h)h.textContent=m.label}
RG.mapSearch=async()=>{const q=$('#mq').value.trim();if(!q)return;$('#mres').innerHTML='<p class="sub">جارٍ البحث…</p>';try{const r=await (await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=ar&q='+encodeURIComponent(q))).json();window.__mr=r;$('#mres').innerHTML=r.length?'<div class="glass widget">'+r.map((x,i)=>'<div class="item" onclick="RG.mapPick('+i+')"><div class="grow"><b>'+esc(x.display_name)+'</b></div></div>').join('')+'</div>':'<p class="sub">لا نتائج</p>'}catch(e){$('#mres').innerHTML='<p class="sub">تعذّر البحث — تحقق من الإنترنت</p>'}};
RG.mapPick=i=>{const x=window.__mr[i];mapShow({lat:+x.lat,lon:+x.lon,label:x.display_name.split(',')[0]});$('#mres').innerHTML=''};
RG.mapMe=async()=>{const p=await getPos();if(!p){toastMsg('تعذّر تحديد الموقع — فعّل إذن الموقع');return}mapShow({lat:p.lat,lon:p.lon,label:'موقعي'})};
RG.mapOpen=()=>openUrl('geo:'+S.map.lat+','+S.map.lon+'?q='+S.map.lat+','+S.map.lon+'('+encodeURIComponent(S.map.label)+')');

/* phone */
P.phone=()=>{const cs=DB.get('contacts',[]).sort((a,b)=>a.n.localeCompare(b.n,'ar')),calls=DB.get('calls',[]);let body='';
 if(S.pt==='dial')body='<div class="glass widget center"><div class="big-number mono" style="font-size:34px;min-height:48px" id="dd">'+esc(S.dial)+'</div><div class="pin-pad" style="margin-top:6px">'+['1','2','3','4','5','6','7','8','9','*','0','#'].map(k=>'<button onclick="RG.dk(\''+k+'\')">'+k+'</button>').join('')+'</div><div class="two" style="margin-top:12px"><button class="btn" style="background:#22b96b;color:#fff" onclick="RG.call(S_dial())">☎ اتصال</button><button class="btn ghost" onclick="RG.dk(\'<\')">⌫</button></div><button class="ibtn blk" onclick="RG.saveNum()">حفظ كجهة اتصال</button></div>';
 else if(S.pt==='con')body='<div class="glass widget"><input id="cn" class="field" placeholder="الاسم"><input id="cp" class="field" type="tel" placeholder="الرقم"><button class="btn blk" onclick="RG.cAdd()">＋ حفظ</button></div><div class="glass widget">'+(cs.length?cs.map(c=>'<div class="item"><div class="grow"><b>'+esc(c.n)+'</b><small class="mono">'+esc(c.p)+'</small></div><button class="ibtn" onclick="RG.call(\''+esc(c.p)+'\')">☎</button><button class="ibtn" onclick="RG.sms(\''+esc(c.p)+'\')">✉</button><button class="ibtn red" onclick="RG.cDel(\''+c.id+'\')">✕</button></div>').join(''):'<p class="sub">لا توجد جهات اتصال محفوظة</p>')+'</div>';
 else body='<div class="glass widget">'+(calls.length?calls.map(c=>'<div class="item"><div class="grow"><b class="mono">'+esc(c.p)+'</b><small>'+fmtDate(new Date(c.ts),{day:'numeric',month:'short'})+' · '+fmtT(new Date(c.ts))+'</small></div><button class="ibtn" onclick="RG.call(\''+esc(c.p)+'\')">☎</button></div>').join(''):'<p class="sub">لا توجد مكالمات أجريتها من هنا</p>')+'</div>';
 return head('الهاتف','لوحة الاتصال وجهات الاتصال')+'<div class="seg">'+[['dial','المفاتيح'],['con','جهات الاتصال'],['rec','الأخيرة']].map(x=>'<button class="'+(S.pt===x[0]?'on':'')+'" onclick="RG.pTab(\''+x[0]+'\')">'+x[1]+'</button>').join('')+'</div>'+body};
window.S_dial=()=>S.dial;
RG.pTab=t=>{S.pt=t;rerender()};
RG.dk=k=>{S.dial=k==='<'?S.dial.slice(0,-1):(S.dial+k).slice(0,20);const d=$('#dd');if(d)d.textContent=S.dial};
RG.call=p=>{p=String(p).trim();if(!p){toastMsg('أدخل رقماً');return}const c=DB.get('calls',[]);c.unshift({p,ts:Date.now()});DB.set('calls',c.slice(0,30));openUrl('tel:'+encodeURIComponent(p))};
RG.sms=p=>{S.smsTo=p;go('messages')};
RG.saveNum=()=>{if(!S.dial){toastMsg('أدخل رقماً أولاً');return}S.pt='con';rerender();$('#cp').value=S.dial};
RG.cAdd=()=>{const n=$('#cn').value.trim(),p=$('#cp').value.trim();if(!n||!p){toastMsg('الاسم والرقم مطلوبان');return}const c=DB.get('contacts',[]);c.push({id:uid(),n,p});DB.set('contacts',c);rerender()};
RG.cDel=id=>{DB.set('contacts',DB.get('contacts',[]).filter(c=>c.id!==id));rerender()};

/* messages / mail (open the real apps) */
P.messages=()=>{const to=S.smsTo||'',log=DB.get('sms',[]);S.smsTo='';
 return head('الرسائل','يُجهَّز النص ثم يُرسَل عبر تطبيق الرسائل')+'<div class="glass widget"><input id="mto" class="field" list="clist" type="tel" placeholder="الرقم أو اسم جهة اتصال" value="'+esc(to)+'"><datalist id="clist">'+DB.get('contacts',[]).map(c=>'<option value="'+esc(c.p)+'">'+esc(c.n)+'</option>').join('')+'</datalist><textarea id="mbody" class="field" rows="5" placeholder="نص الرسالة"></textarea><button class="btn blk" onclick="RG.smsSend()">إرسال عبر تطبيق الرسائل</button></div>'+
 (log.length?'<h3>آخر ما جهّزته</h3><div class="glass widget">'+log.slice(0,10).map(l=>'<div class="item"><div class="grow"><b class="mono">'+esc(l.p)+'</b><small>'+esc(l.t.slice(0,60))+'</small></div></div>').join('')+'</div>':'')};
RG.smsSend=()=>{let p=$('#mto').value.trim();const t=$('#mbody').value;if(!p){toastMsg('أدخل الرقم');return}const c=DB.get('contacts',[]).find(x=>x.n===p);if(c)p=c.p;const l=DB.get('sms',[]);l.unshift({p,t,ts:Date.now()});DB.set('sms',l.slice(0,30));openUrl('sms:'+encodeURIComponent(p)+'?body='+encodeURIComponent(t))};
P.mail=()=>head('البريد','يُفتح تطبيق البريد لديك')+'<div class="glass widget"><input id="eto" class="field" type="email" placeholder="إلى"><input id="esub" class="field" placeholder="الموضوع"><textarea id="ebody" class="field" rows="7" placeholder="نص الرسالة"></textarea><button class="btn blk" onclick="RG.mailSend()">إرسال عبر تطبيق البريد</button></div>';
RG.mailSend=()=>{const t=$('#eto').value.trim();if(!t){toastMsg('أدخل البريد المستلم');return}openUrl('mailto:'+encodeURIComponent(t)+'?subject='+encodeURIComponent($('#esub').value)+'&body='+encodeURIComponent($('#ebody').value))};

/* camera */
let CAM=null;
P.camera=()=>head('الكاميرا','التقط وتُحفظ الصور في التطبيق')+'<video id="camv" class="vid" autoplay playsinline muted></video><div id="camerr" class="sub center"></div><div class="two" style="margin-top:12px"><button class="btn" onclick="RG.shoot()">● التقاط</button><button class="btn ghost" onclick="RG.flip()">⇄ تبديل</button></div><button class="ibtn blk" onclick="go(\'photos\')">فتح الصور</button>';
async function camStart(){camStop();try{CAM=await navigator.mediaDevices.getUserMedia({video:{facingMode:S.face,width:{ideal:1280}},audio:false});const v=$('#camv');if(v)v.srcObject=CAM;else camStop()}catch(e){const m=$('#camerr');if(m)m.textContent='تعذّر تشغيل الكاميرا — اسمح بإذن الكاميرا للتطبيق من إعدادات الجهاز'}}
function camStop(){if(CAM){CAM.getTracks().forEach(t=>t.stop());CAM=null}}
RG.flip=()=>{S.face=S.face==='environment'?'user':'environment';camStart()};
RG.shoot=()=>{const v=$('#camv');if(!v||!v.videoWidth){toastMsg('الكاميرا غير جاهزة');return}const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);c.toBlob(async b=>{await idbPut('photos',{id:uid(),blob:b,ts:Date.now(),name:'camera'});toastMsg('تم حفظ الصورة');v.classList.remove('flash');void v.offsetWidth;v.classList.add('flash')},'image/jpeg',.88)};

/* photos */
P.photos=()=>head('الصور','<span id="pcount">0</span> صورة')+'<label class="btn blk center" style="display:block">＋ إضافة صور من الجهاز<input type="file" accept="image/*" multiple hidden onchange="RG.addPhotos(this)"></label><h3>مكتبتي</h3><div class="photo-grid" id="pgrid"></div>';
function revokeUrls(){S.urls.forEach(u=>URL.revokeObjectURL(u));S.urls=[]}
async function postPhotos(){revokeUrls();const l=(await idbAll('photos')).sort((a,b)=>b.ts-a.ts),g=$('#pgrid');if(!g)return;$('#pcount').textContent=l.length;g.innerHTML=l.length?l.map(x=>{const u=URL.createObjectURL(x.blob);S.urls.push(u);return '<div class="photo" onclick="RG.view(\''+x.id+'\')" style="background:url('+u+') center/cover"></div>'}).join(''):'<p class="sub" style="grid-column:1/-1">لا توجد صور — التقط صورة أو أضفها</p>'}
RG.addPhotos=async inp=>{for(const f of inp.files)await idbPut('photos',{id:uid(),blob:f,ts:Date.now(),name:f.name});postPhotos()};
RG.view=async id=>{const x=await idbGet('photos',id);if(!x)return;const u=URL.createObjectURL(x.blob);S.urls.push(u);const d=document.createElement('div');d.className='rgov';d.innerHTML='<img src="'+u+'"><div class="two" style="width:100%"><button class="btn" onclick="this.closest(\'.rgov\').remove()">إغلاق</button><button class="btn ghost" onclick="RG.pdel(\''+id+'\',this)">حذف</button></div>';$('.phone').appendChild(d)};
RG.pdel=async(id,b)=>{await idbDel('photos',id);b.closest('.rgov').remove();postPhotos()};

/* files */
P.files=()=>head('الملفات','افتح أي ملف من جهازك')+'<label class="btn blk center" style="display:block">📂 اختيار ملف<input type="file" hidden onchange="RG.openFile(this)"></label><div id="fres" style="margin-top:12px"></div><div class="glass widget" style="margin-top:12px" id="fstore"></div>';
RG.openFile=async inp=>{const f=inp.files[0];if(!f)return;const u=URL.createObjectURL(f);S.urls.push(u);let pv='';
 if(f.type.startsWith('image/'))pv='<img src="'+u+'" style="max-width:100%;border-radius:14px">';else if(f.type.startsWith('audio/'))pv='<audio controls src="'+u+'" style="width:100%"></audio>';else if(f.type.startsWith('video/'))pv='<video controls playsinline src="'+u+'" style="width:100%;border-radius:14px"></video>';
 else if((f.type.startsWith('text/')||/\.(txt|json|csv|md|log|xml|html?|js|css)$/i.test(f.name))&&f.size<300000)pv='<pre style="white-space:pre-wrap;direction:ltr;text-align:left;max-height:300px;overflow:auto;font-size:12px">'+esc(await f.text())+'</pre>';
 $('#fres').innerHTML='<div class="glass widget"><b>'+esc(f.name)+'</b><div class="sub">'+(f.type||'نوع غير معروف')+' · '+(f.size/1024).toFixed(1)+' ك.ب · '+fmtDate(new Date(f.lastModified),{day:'numeric',month:'short',year:'numeric'})+'</div>'+pv+'</div>'};
async function postFiles(){const e=$('#fstore');if(!e)return;try{const s=await navigator.storage.estimate();e.innerHTML='<b>مساحة بيانات التطبيق</b><div class="sub">المستخدم '+(s.usage/1048576).toFixed(1)+' م.ب</div>'}catch(x){e.innerHTML='<div class="sub">لا تتوفر معلومات التخزين</div>'}}

/* music */
const AU=new Audio();AU.preload='auto';AU.volume=DB.get('vol',.8);
let ML=[],mi=-1;const murl={};
const fmtM=s=>isFinite(s)?Math.floor(s/60)+':'+pad(Math.floor(s%60)):'0:00';
P.music=()=>head('الموسيقى','مكتبتك من ملفات الجهاز')+'<div class="glass widget center"><div style="font-size:60px">♫</div><h2 id="mt">لم يتم اختيار مقطع</h2><input id="ms" type="range" min="0" max="1000" value="0" style="width:100%" oninput="RG.seek(this.value)"><div class="sub mono"><span id="mc">0:00</span> / <span id="md">0:00</span></div><div class="two" style="grid-template-columns:1fr 1fr 1fr;margin-top:10px"><button class="btn ghost" onclick="RG.mPrev()">⏮</button><button class="btn" id="mp" onclick="RG.mPlay()">▶</button><button class="btn ghost" onclick="RG.mNext()">⏭</button></div><input type="range" min="0" max="100" value="'+Math.round(AU.volume*100)+'" oninput="RG.vol(this.value)" style="width:100%;margin-top:8px"><div class="sub">مستوى الصوت</div></div><label class="btn blk center" style="display:block">＋ إضافة أغانٍ<input type="file" accept="audio/*" multiple hidden onchange="RG.addSongs(this)"></label><div class="glass widget" id="mlist" style="margin-top:12px"></div>';
async function loadMusic(){const all=(await idbAll('music')).sort((a,b)=>a.ts-b.ts);const playing=ML[mi]&&ML[mi].id;ML=all.map(t=>({id:t.id,name:t.name,url:murl[t.id]||(murl[t.id]=URL.createObjectURL(t.blob))}));mi=playing?ML.findIndex(t=>t.id===playing):-1}
function paintMusic(){const l=$('#mlist');if(l)l.innerHTML=ML.length?ML.map((t,i)=>'<div class="item"><div class="grow" onclick="RG.mPick('+i+')"><b>'+(i===mi?'▶ ':'')+esc(t.name)+'</b></div><button class="ibtn red" onclick="RG.mDel(\''+t.id+'\')">✕</button></div>').join(''):'<p class="sub">أضف ملفات صوتية لتبدأ</p>';const t=$('#mt');if(t)t.textContent=ML[mi]?ML[mi].name:'لم يتم اختيار مقطع';const p=$('#mp');if(p)p.textContent=AU.paused?'▶':'⏸';const m=$('#md');if(m)m.textContent=fmtM(AU.duration)}
async function postMusic(){await loadMusic();paintMusic()}
function playIdx(i){if(!ML.length)return;mi=(i+ML.length)%ML.length;AU.src=ML[mi].url;AU.play().catch(()=>{});paintMusic()}
RG.mPick=i=>playIdx(i);RG.mNext=()=>playIdx(mi+1);RG.mPrev=()=>playIdx(mi-1);
RG.mPlay=()=>{if(mi<0){playIdx(0);return}AU.paused?AU.play():AU.pause()};
RG.seek=v=>{if(isFinite(AU.duration))AU.currentTime=AU.duration*v/1000};
RG.vol=v=>{AU.volume=v/100;DB.set('vol',AU.volume)};
RG.addSongs=async inp=>{for(const f of inp.files)await idbPut('music',{id:uid(),name:f.name.replace(/\.[^.]+$/,''),blob:f,ts:Date.now()});await loadMusic();paintMusic()};
RG.mDel=async id=>{const wasCur=ML[mi]&&ML[mi].id===id;await idbDel('music',id);if(murl[id]){URL.revokeObjectURL(murl[id]);delete murl[id]}if(wasCur){AU.pause();AU.removeAttribute('src');mi=-1}await loadMusic();paintMusic()};
AU.addEventListener('play',paintMusic);AU.addEventListener('pause',paintMusic);AU.addEventListener('ended',()=>RG.mNext());
AU.addEventListener('timeupdate',()=>{const s=$('#ms');if(s&&isFinite(AU.duration))s.value=AU.currentTime/AU.duration*1000;const c=$('#mc');if(c)c.textContent=fmtM(AU.currentTime);const d=$('#md');if(d)d.textContent=fmtM(AU.duration)});

/* safari */
const BM0=[['Google','https://www.google.com'],['ويكيبيديا','https://ar.wikipedia.org'],['YouTube','https://www.youtube.com'],['الجزيرة','https://www.aljazeera.net']];
P.safari=()=>{const bm=DB.get('bm',BM0);return head('Safari','تصفح الويب في متصفح الجهاز')+'<input class="field" id="url" placeholder="ابحث أو أدخل عنوان موقع" onkeydown="if(event.key===\'Enter\')RG.web()"><button class="btn blk" onclick="RG.web()">انتقال</button><div class="glass widget" style="margin-top:14px"><h3>المفضلة</h3>'+bm.map((b,i)=>'<div class="item"><div class="grow" onclick="RG.openUrl(\''+esc(b[1])+'\')"><b>'+esc(b[0])+'</b><small>'+esc(b[1])+'</small></div><button class="ibtn red" onclick="RG.bmDel('+i+')">✕</button></div>').join('')+'<button class="ibtn blk" onclick="RG.bmAdd()">＋ حفظ العنوان المكتوب</button></div>'};
const toUrl=v=>{v=v.trim();if(!v)return '';if(/^https?:\/\//i.test(v))return v;if(/^[^\s]+\.[a-z]{2,}([\/?#].*)?$/i.test(v))return 'https://'+v;return 'https://www.google.com/search?q='+encodeURIComponent(v)};
RG.openUrl=u=>{window.open(u,'_blank')};RG.web=()=>{const u=toUrl($('#url').value);if(u)RG.openUrl(u)};
RG.bmAdd=()=>{const u=toUrl($('#url').value);if(!u||u.includes('google.com/search')){toastMsg('اكتب عنوان موقع صحيحاً');return}const bm=DB.get('bm',BM0);bm.push([u.replace(/^https?:\/\/(www\.)?/,'').split('/')[0],u]);DB.set('bm',bm);rerender()};
RG.bmDel=i=>{const bm=DB.get('bm',BM0);bm.splice(i,1);DB.set('bm',bm);rerender()};

/* about (was App Store) */
P.store=()=>head('حول التطبيق','Royal Gold')+'<div class="glass widget center"><div style="font-size:54px;color:var(--gold2)">◆</div><h2>Royal Gold</h2><p class="sub">واجهة بتصميم iOS 26 الذهبي مع وظائف حقيقية</p></div><div class="glass widget"><div class="item"><div class="grow"><b>المطوّر</b><small>Khader Abo Salha</small></div></div><div class="item"><div class="grow"><b>التواصل</b><small>mankhader@gmail.com</small></div><button class="ibtn" onclick="openUrl(\'mailto:mankhader@gmail.com\')">مراسلة</button></div><div class="item"><div class="grow"><b>الإصدار</b><small>2.0</small></div></div><div class="item"><div class="grow"><b>الشاشة</b><small class="mono">'+innerWidth+'×'+innerHeight+'</small></div></div><div class="item"><div class="grow"><b>الشبكة</b><small data-net></small></div></div></div>';

/* assistant (was Siri) */
P.siri=()=>head('المساعد','اكتب أمراً أو استخدم ميكروفون لوحة المفاتيح')+'<div class="siri-orb"></div><div class="glass widget"><input id="cmd" class="field" placeholder="مثال: مؤقت 5 دقائق" onkeydown="if(event.key===\'Enter\')RG.cmd()"><button class="btn blk" onclick="RG.cmd()">تنفيذ</button></div><div class="glass widget"><b>أوامر مدعومة</b>'+['الطقس','مؤقت 10 دقائق','ذكرني اشتري خبز','ملاحظة فكرة جديدة','اتصل أحمد','12*3+4','افتح الحاسبة','أي نص آخر = بحث في الويب'].map(x=>'<div class="item"><div class="grow sub">'+x+'</div></div>').join('')+'</div>';
RG.cmd=()=>{const q=($('#cmd').value||'').trim();if(!q)return;let m;
 if(/^[0-9+\-*/.()\s×÷−]+$/.test(q)&&/[0-9]/.test(q)){try{const r=Function('"use strict";return ('+q.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-')+')')();alertBox('الناتج',String(+(+r).toFixed(10)));return}catch(e){}}
 if((m=q.match(/^(?:مؤقت|مؤقّت)\s*(\d+)\s*(ثانية|ثواني|ثانيه|دقيقة|دقائق|دقيقه)?/))){const n=+m[1],sec=/ثان/.test(m[2]||'');S.tm={run:true,end:Date.now()+n*(sec?1000:60000),left:0};S.ct='timer';go('clock');toastMsg('بدأ المؤقت');return}
 if((m=q.match(/^(?:ذكرني|تذكير)\s+(.+)/))){const r=DB.get('rem',[]);r.push({id:uid(),x:m[1],at:'',done:false,n:0});DB.set('rem',r);go('reminders');return}
 if((m=q.match(/^(?:ملاحظة|دوّن|دون)\s+(.+)/))){const n=DB.get('notes',[]);n.push({id:uid(),x:m[1],ts:Date.now()});DB.set('notes',n);S.note=null;go('notes');return}
 if((m=q.match(/^(?:اتصل|اتصال)\s*(?:ب|بـ)?\s*(.+)/))){const t=m[1].trim(),c=DB.get('contacts',[]).find(c=>c.n.includes(t));RG.call(c?c.p:t);return}
 if(/طقس|جو/.test(q)){go('weather');return}
 const a=apps.find(a=>q.includes(a[0])||(a[0].length>2&&a[0].includes(q)));if(a&&/افتح|شغل|^[^ ]+$/.test(q)){go(a[2]);return}
 RG.openUrl('https://www.google.com/search?q='+encodeURIComponent(q))};

/* PIN lock (was Face ID) */
P.faceid=()=>{const has=!!DB.get('pin',null);return head('رمز القفل','حماية التطبيق')+'<div class="glass widget center"><div style="font-size:60px;color:var(--gold2)">🔒</div><h2>'+(has?'الرمز مُفعَّل':'الرمز غير مُفعَّل')+'</h2><p class="sub">يُطلب الرمز عند فتح التطبيق وبعد غيابه عن الشاشة.</p></div><div class="glass widget">'+(has?'<input id="pold" class="field" type="password" inputmode="numeric" maxlength="6" placeholder="الرمز الحالي"><button class="btn blk" onclick="RG.pinOff()">إزالة الرمز</button><button class="ibtn blk" onclick="RG.pinNow()">قفل الآن</button>':'<input id="p1" class="field" type="password" inputmode="numeric" maxlength="6" placeholder="رمز جديد (4–6 أرقام)"><input id="p2" class="field" type="password" inputmode="numeric" maxlength="6" placeholder="تأكيد الرمز"><button class="btn blk" onclick="RG.pinSet()">تفعيل الرمز</button>')+'</div>'};
async function sha(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('rg:'+s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=5381;for(const c of 'rg:'+s)h=((h<<5)+h+c.charCodeAt(0))|0;return 'x'+h}}
RG.pinSet=async()=>{const a=$('#p1').value,b=$('#p2').value;if(!/^\d{4,6}$/.test(a)){toastMsg('الرمز 4 إلى 6 أرقام');return}if(a!==b){toastMsg('الرمزان غير متطابقين');return}DB.set('pin',await sha(a));DB.set('pinlen',a.length);toastMsg('تم تفعيل الرمز');rerender()};
RG.pinOff=async()=>{if(await sha($('#pold').value)!==DB.get('pin')){toastMsg('الرمز غير صحيح');return}DB.set('pin',null);toastMsg('تمت إزالة الرمز');rerender()};
function pinDots(){const n=DB.get('pinlen',4),e=$('#pdots');if(e)e.innerHTML=[...Array(n)].map((_,i)=>'<i class="'+(i<S.pin.length?'f':'')+'"></i>').join('')}
function pinShow(){if($('#pinlock')||!DB.get('pin',null))return;S.pin='';const d=document.createElement('div');d.id='pinlock';d.innerHTML='<div class="pin-in"><div style="font-size:42px">🔒</div><h2>أدخل رمز القفل</h2><div class="pin-dots" id="pdots"></div><div class="sub" id="pmsg">&nbsp;</div><div class="pin-pad">'+[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>k===''?'<span></span>':'<button onclick="RG.pinKey(\''+k+'\')">'+k+'</button>').join('')+'</div></div>';$('.phone').appendChild(d);pinDots()}
RG.pinNow=()=>pinShow();
RG.pinKey=async k=>{if(k==='⌫')S.pin=S.pin.slice(0,-1);else S.pin+=k;pinDots();if(S.pin.length===DB.get('pinlen',4)){if(await sha(S.pin)===DB.get('pin')){$('#pinlock').remove()}else{$('#pmsg').textContent='رمز غير صحيح';try{navigator.vibrate(200)}catch(e){}}S.pin='';setTimeout(pinDots,150)}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)S.hid=Date.now();else if(S.hid&&Date.now()-S.hid>30000)pinShow()});

/* settings */
P.settings=()=>{const hap=DB.get('haptic',true),br=DB.get('bright',100);
 return head('الإعدادات','حالة جهازك الحقيقية')+'<div class="glass widget"><input class="field" placeholder="بحث في الإعدادات" oninput="filterRows(this)"></div><div class="glass widget" id="settingsRows">'+
 row('⌁','الشبكة','<span data-net></span>')+
 row('🔋','البطارية','<span data-bat>—</span> · <span data-batsub></span>')+
 row('▣','التخزين','<span id="sto">…</span>')+
 row('🖼','الخلفية','تغيير خلفية التطبيق',"go('wallpaper')")+
 '<div class="row"><span class="symbol">☼</span><div class="grow"><b>سطوع الشاشة (داخل التطبيق)</b><input type="range" min="30" max="100" value="'+br+'" oninput="RG.bright(this.value)" style="width:100%"></div></div>'+
 '<div class="row"><span class="symbol">≋</span><div class="grow"><b>الاهتزاز عند التنقل</b></div><button class="toggle'+(hap?' on':'')+'" onclick="RG.haptic(this)"></button></div>'+
 row('🔒','رمز القفل','حماية التطبيق برمز',"go('faceid')")+
 row('ⓘ','حول التطبيق','المطوّر والإصدار',"go('store')")+
 row('🗑','مسح كل بيانات التطبيق','الملاحظات والصور والإعدادات',"RG.wipe()")+'</div>'};
RG.bright=v=>{DB.set('bright',+v);applyBright()};
function applyBright(){const d=$('#dim');if(d)d.style.opacity=((100-DB.get('bright',100))/100*.75).toFixed(2)}
RG.haptic=b=>{const on=!DB.get('haptic',true);DB.set('haptic',on);b.classList.toggle('on',on)};
RG.wipe=async()=>{if(!confirm('سيتم حذف كل بياناتك داخل التطبيق نهائياً. متابعة؟'))return;try{localStorage.clear()}catch(e){}try{await idbClr('photos');await idbClr('music')}catch(e){}ML=[];mi=-1;AU.pause();location.reload()};
async function postSettings(){paintBat();paintNet();try{const s=await navigator.storage.estimate();const e=$('#sto');if(e)e.textContent='يستخدم التطبيق '+(s.usage/1048576).toFixed(1)+' م.ب'}catch(x){const e=$('#sto');if(e)e.textContent='—'}}
const _vib=navigator.vibrate?navigator.vibrate.bind(navigator):null;
try{navigator.vibrate=(...a)=>(_vib&&DB.get('haptic',true))?_vib(...a):false}catch(e){}

/* ---------- hook into the existing app ---------- */
const POST={home(){refreshWeather();paintBat();const n=$('#hnext');if(n)n.innerHTML=nextText()},
 lock(){refreshWeather();const n=$('#lnext');if(n)n.innerHTML=nextText();if(window.updateLockClock)updateLockClock()},
 weather(){refreshWeather()},clock(){const c=$('#liveClock');if(c)c.textContent=new Date().toLocaleTimeString('ar-JO');tick()},
 camera:camStart,photos:postPhotos,music:postMusic,files:postFiles,settings:postSettings,maps(){const f=$('#mapf');if(f)f.src=mapSrc(S.map)},store:paintNet,
 notes(){const t=$('#nt');if(t&&S.note==='new')t.focus()}};
function post(p){const f=POST[p];if(f)try{f()}catch(e){console.error(e)}}
const _page=page;page=function(p){const f=P[p];return f?f():_page(p)};

/* recent apps + history (Android back button) */
const nameOf=p=>({settings:'الإعدادات',wallpaper:'الخلفية',weather:'الطقس'}[p])||((apps.find(a=>a[2]===p)||[])[0])||p;
let popping=false;
const _go=go;
go=function(p){if(p!=='camera')camStop();if(current==='notes'&&p!=='notes'&&S.note!==null){RG.noteSave(true);S.note=null}
 _go(p);post(p);
 if(p!=='home'&&p!=='lock'){S.recent=S.recent.filter(x=>x!==p);S.recent.unshift(p);S.recent=S.recent.slice(0,5)}
 if(!popping&&!(history.state&&history.state.p===p))history.pushState({p},'')};
history.replaceState({p:'home'},'');
addEventListener('popstate',e=>{
 const ov=$$('.control-overlay.show,.shade.show,.switcher.show,.rgov');
 if(ov.length){ov.forEach(x=>x.classList.contains('rgov')?x.remove():x.classList.remove('show'));history.pushState({p:current},'');return}
 if(current==='notes'&&S.note!==null){RG.noteSave(true);S.note=null}
 popping=true;try{go((e.state&&e.state.p)||'home')}finally{popping=false}});

/* block accidental "swipe down on home = lock screen" while scrolling */
(function(){const ph=$('.phone');let y0=0;ph.addEventListener('touchstart',e=>{y0=e.touches[0].clientY},{capture:true,passive:true});
 ph.addEventListener('touchend',e=>{const dy=e.changedTouches[0].clientY-y0;if(current==='home'&&y0>=65&&dy>100)e.stopImmediatePropagation()},{capture:true,passive:true})})();

/* control center / notifications / switcher with real content */
(function(){const c=$('#control');if(c)c.innerHTML='<div class="pagehead"><h1>مركز التحكم</h1><button class="btn ghost" onclick="closeControl()">تم</button></div><div class="control-grid"><div class="control"><span>⌁</span><small data-net></small></div><div class="control"><span>🔋</span><small><span data-bat>—</span></small></div><div class="control" onclick="closeControl();go(\'camera\')"><span>◎</span><small>الكاميرا</small></div><div class="control" onclick="closeControl();RG.tab(\'timer\')"><span>⏱</span><small>مؤقت</small></div><div class="control" onclick="closeControl();go(\'calculator\')"><span>＋</span><small>الحاسبة</small></div><div class="control" onclick="closeControl();RG.noteOpen(\'new\')"><span>▤</span><small>ملاحظة</small></div></div><div class="glass widget" style="margin-top:14px"><b>السطوع (داخل التطبيق)</b><input type="range" class="field" min="30" max="100" value="'+DB.get('bright',100)+'" oninput="RG.bright(this.value)"><b>صوت الموسيقى</b><input type="range" class="field" min="0" max="100" value="'+Math.round(AU.volume*100)+'" oninput="RG.vol(this.value)"></div>';
 const dim=document.createElement('div');dim.id='dim';$('.phone').appendChild(dim);applyBright()})();
const _oc=window.closeControl;
const _openN=window.openNotifications;
window.openNotifications=function(){const el=$('#notifications');if(!el)return;
 const ev=DB.get('events',[]).filter(e=>e.d===ymd(new Date())).sort((a,b)=>(a.t||'').localeCompare(b.t||'')),rem=DB.get('rem',[]).filter(r=>!r.done).slice(0,5);
 let n='';ev.forEach(e=>n+='<div class="notice"><b>التقويم</b><small>اليوم'+(e.t?' · '+e.t:'')+'</small><p>'+esc(e.x)+'</p></div>');rem.forEach(r=>n+='<div class="notice"><b>التذكيرات</b><small>'+(r.at?fmtDate(new Date(r.at),{day:'numeric',month:'short'})+' · '+fmtT(new Date(r.at)):'بدون موعد')+'</small><p>'+esc(r.x)+'</p></div>');
 if(!n)n='<div class="notice"><b>لا توجد إشعارات</b><p class="sub">مواعيدك وتذكيراتك ستظهر هنا</p></div>';
 el.innerHTML='<div class="shade-top"><span id="shadeTime"></span><button class="btn ghost" onclick="closeNotifications()">إغلاق</button></div><div class="shade-date" id="shadeDate"></div><div class="shade-controls"><button onclick="closeNotifications();go(\'calendar\')">▦<small>التقويم</small></button><button onclick="closeNotifications();go(\'reminders\')">✓<small>التذكيرات</small></button><button onclick="closeNotifications();go(\'weather\')">☼<small>الطقس</small></button><button onclick="closeNotifications();go(\'settings\')">⚙<small>الإعدادات</small></button></div><h3>مركز الإشعارات</h3>'+n+'<button class="btn ghost" onclick="clearNotices()">إخفاء</button>';
 const t=new Date();$('#shadeTime').textContent=fmtT(t);$('#shadeDate').textContent=fmtDate(t);el.classList.add('show')};
window.openSwitcher=function(){const el=$('#switcher');if(!el)return;el.innerHTML='<div class="pagehead"><h1>التطبيقات المفتوحة</h1><button class="btn ghost" onclick="closeSwitcher()">تم</button></div><div class="glass widget" onclick="go(\'home\');closeSwitcher()"><b>⌂ الرئيسية</b></div>'+S.recent.map(p=>'<div class="glass widget" onclick="go(\''+p+'\');closeSwitcher()"><b>'+esc(nameOf(p))+'</b></div>').join('')+'<button class="btn blk" onclick="S_clr()">مسح القائمة</button>';el.classList.add('show')};
window.S_clr=()=>{S.recent=[];window.openSwitcher()};

/* search across content */
window.searchApps=function(q){const el=$('#searchResults');if(!el)return;q=(q||'').trim().toLowerCase();if(!q){el.innerHTML=appGrid(apps.slice(0,8));return}
 const f=apps.filter(a=>a[0].toLowerCase().includes(q)),ns=DB.get('notes',[]).filter(n=>n.x.toLowerCase().includes(q)).slice(0,5),cs=DB.get('contacts',[]).filter(c=>c.n.toLowerCase().includes(q)||c.p.includes(q)).slice(0,5),es=DB.get('events',[]).filter(e=>e.x.toLowerCase().includes(q)).slice(0,5);
 el.innerHTML=(f.length?appGrid(f):'')+(ns.length?'<h3>الملاحظات</h3>'+ns.map(n=>row('▤',esc(firstLine(n.x)),'',"RG.noteOpen('"+n.id+"')")).join(''):'')+(cs.length?'<h3>جهات الاتصال</h3>'+cs.map(c=>row('☎',esc(c.n),esc(c.p),"RG.call('"+esc(c.p)+"')")).join(''):'')+(es.length?'<h3>المواعيد</h3>'+es.map(e=>row('▦',esc(e.x),e.d,"go('calendar')")).join(''):'')+((f.length+ns.length+cs.length+es.length)?'':'<p class="sub center">لا نتائج</p>')};

/* app list tweaks: honest names, remove the fake incoming call */
apps.forEach(a=>{if(a[2]==='store'){a[0]='حول';a[1]='ⓘ'}if(a[2]==='siri'){a[0]='المساعد'}if(a[2]==='faceid'){a[0]='رمز القفل';a[1]='🔒'}});
const ic=apps.findIndex(a=>a[2]==='incoming');if(ic>=0)apps.splice(ic,1);

/* periodic work */
let tc=0;
function tick(){
 const c=$('#liveClock');if(c)c.textContent=new Date().toLocaleTimeString('ar-JO');
 $$('[data-tz]').forEach(e=>{try{e.textContent=new Date().toLocaleTimeString('ar-JO',{timeZone:e.dataset.tz,hour:'2-digit',minute:'2-digit'})}catch(x){}});
 const sw=$('#swd');if(sw&&S.sw.run)sw.textContent=fmtSW(swNow());
 const t=S.tm;if(t.run){const left=t.end-Date.now();const d=$('#tmd');if(d)d.textContent=fmtTM(Math.max(0,left));if(left<=0){S.tm={run:false,end:0,left:0};alertBox('انتهى المؤقت','⏱');if(current==='clock')rerender()}}
 if(++tc%20===0)checkReminders();
 const st=$('.status span:first-child');if(st&&tc%40===0)st.textContent=new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:false})}
setInterval(tick,250);

/* init */
if(DB.get('stepon',false))stepsOn(true);
paintBat();paintNet();
go('home');
history.replaceState({p:'home'},'');
if(DB.get('pin',null))pinShow();
})();
