(()=>{
  'use strict';
  const KEY_FAV='qrayti.v30.favorites';
  const KEY_REC='qrayti.v30.recent';
  const KEY_CONT='qrayti.v30.continue';
  const MAX_FAV=40,MAX_REC=12;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(k,d=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const now=()=>Date.now();
  let staticIndexPromise=null;

  function toast(msg){
    let t=$('#v30Toast');
    if(!t){t=document.createElement('div');t.id='v30Toast';t.className='v30-toast';document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),1800);
  }
  function currentHash(){return location.hash||'#/welcome'}
  function cleanHash(hash=currentHash()){
    const raw=String(hash||'#/welcome').replace(/^#/,'');const [p,q='']=raw.split('?');const sp=new URLSearchParams(q);sp.delete('open');return '#'+p+(sp.toString()?'?'+sp.toString():'');
  }
  function routeWithOpen(route,id){
    const raw=String(route||'#/welcome').replace(/^#/,'');const [p,q='']=raw.split('?');const sp=new URLSearchParams(q);sp.set('open',id);return '#'+p+'?'+sp.toString();
  }
  function itemRoute(item){
    if(item.route)return item.route;
    const q=new URLSearchParams({licence:item.licence||'info',subject:item.subjectId||item.subject||'',category:item.category||'extra',group:item.group||'ملفات إضافية',year:String(item.year||1),track:item.track||'common',semester:String(item.semester||1)});
    return '#/files?'+q.toString();
  }
  function navigateItem(item){
    if(!item)return;
    const r=routeWithOpen(itemRoute(item),item.id);
    if(location.hash===r){maybeAutoOpen();return}
    location.hash=r;
  }
  function staticIndex(){
    if(!staticIndexPromise)staticIndexPromise=fetch('/admin/static-index.json?v=30',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('index');return r.json()}).catch(()=>({items:[]}));
    return staticIndexPromise;
  }
  function storeRecent(item){
    if(!item?.id)return;
    const list=read(KEY_REC,[]).filter(x=>x.id!==item.id);list.unshift({...item,openedAt:now()});write(KEY_REC,list.slice(0,MAX_REC));refreshPersonalUI();
  }
  function toggleFavorite(item){
    if(!item?.id)return false;
    const list=read(KEY_FAV,[]);const i=list.findIndex(x=>x.id===item.id);let on=false;
    if(i>=0)list.splice(i,1);else{list.unshift({...item,savedAt:now()});on=true}
    write(KEY_FAV,list.slice(0,MAX_FAV));decorateFiles();refreshHub();refreshPersonalUI();return on;
  }
  function itemFromRow(row){
    const open=row?.querySelector('[data-file]');if(!open)return null;
    const id=open.dataset.file,label=row.querySelector('.file-name')?.textContent?.trim()||id,source=row.querySelector('.file-source')?.textContent?.trim()||'',size=row.querySelector('.file-size')?.textContent?.trim()||'';
    return {id,label,source,size,route:cleanHash(),pageTitle:document.title};
  }
  function saveContinue(){
    const h=cleanHash(),path=h.replace(/^#/,'').split('?')[0];
    if(!['/subjects','/subject','/groups','/tp-teacher','/files','/videos','/language-check','/average'].includes(path))return;
    const title=$('.context-head h1,.chapter-hero h1,.subjects-top h1,.average-hero h1')?.textContent?.trim()||document.title.replace(/\s*-\s*قرايتي.*$/,'');
    write(KEY_CONT,{route:h,title,at:now()});
  }
  function prettyTime(ts){
    const d=Math.max(0,now()-(Number(ts)||0)),m=Math.floor(d/60000);if(m<1)return 'توا';if(m<60)return `من ${m} د`;
    const h=Math.floor(m/60);if(h<24)return `من ${h} س`;return `من ${Math.floor(h/24)} يوم`;
  }

  function ensureHub(){
    if($('#v30HubModal'))return;
    document.body.insertAdjacentHTML('beforeend',`<div class="modal v30-hub-modal" id="v30HubModal" aria-hidden="true"><div class="modal-backdrop" data-v30-close="hub"></div><section class="v30-hub-panel" role="dialog" aria-modal="true" aria-label="محفوظاتي"><div class="v30-hub-head"><div><span class="mini-label">قرايتي متاعك</span><h2>كمّل من وين وقفت</h2><p>المفضلة وآخر الملفات محفوظين على الجهاز هذا فقط.</p></div><button class="close-x" data-v30-close="hub" aria-label="إغلاق">×</button></div><div class="v30-hub-cols"><section><div class="v30-list-head"><b>⭐ المفضلة</b><span id="v30FavCount">0</span></div><div id="v30FavList" class="v30-saved-list"></div></section><section><div class="v30-list-head"><b>🕘 آخر ما فتحت</b><span id="v30RecCount">0</span></div><div id="v30RecList" class="v30-saved-list"></div></section></div></section></div>`);
  }
  function showHub(){ensureHub();refreshHub();const m=$('#v30HubModal');m.classList.add('show');m.setAttribute('aria-hidden','false');document.documentElement.classList.add('qrayti-modal-open')}
  function hideHub(){const m=$('#v30HubModal');if(!m)return;m.classList.remove('show');m.setAttribute('aria-hidden','true');document.documentElement.classList.remove('qrayti-modal-open')}
  function savedItemHtml(x,kind){return `<article class="v30-saved-item" data-v30-saved="${kind}" data-id="${esc(x.id)}"><button class="v30-saved-open" type="button"><span>${kind==='fav'?'⭐':'📄'}</span><div><b>${esc(x.label||x.displayName||x.id)}</b><small>${esc(x.source||x.subjectName||'')}${x.openedAt?` • ${prettyTime(x.openedAt)}`:''}</small></div></button>${kind==='fav'?'<button class="v30-remove-fav" type="button" title="نحّي من المفضلة">×</button>':''}</article>`}
  function refreshHub(){
    if(!$('#v30HubModal'))return;const fav=read(KEY_FAV,[]),rec=read(KEY_REC,[]);
    $('#v30FavCount').textContent=fav.length;$('#v30RecCount').textContent=rec.length;
    $('#v30FavList').innerHTML=fav.length?fav.map(x=>savedItemHtml(x,'fav')).join(''):'<div class="v30-empty">ما حفظت حتى ملف توا.</div>';
    $('#v30RecList').innerHTML=rec.length?rec.map(x=>savedItemHtml(x,'rec')).join(''):'<div class="v30-empty">أول ملف تفتحو يظهر هنا.</div>';
  }
  function ensureTopSaved(){
    const actions=$('.top-actions');if(!actions||$('#v30SavedTop'))return;
    const b=document.createElement('button');b.id='v30SavedTop';b.className='icon-btn v30-saved-top';b.title='المفضلة وآخر الملفات';b.setAttribute('aria-label','المفضلة وآخر الملفات');b.innerHTML='<span>★</span>';actions.insertBefore(b,actions.firstChild);
  }
  function ensureBottomNav(){
    if($('#v30BottomNav'))return;
    document.body.insertAdjacentHTML('beforeend',`<nav class="v30-bottom-nav" id="v30BottomNav" aria-label="تنقل سريع"><button data-v30-nav="home"><span>⌂</span><small>الرئيسية</small></button><button data-v30-nav="search"><span>⌕</span><small>البحث</small></button><button data-v30-nav="saved"><span>★</span><small>محفوظاتي</small></button><button data-v30-nav="continue"><span>↻</span><small>كمّل</small></button></nav>`);
  }
  function refreshPersonalUI(){
    // v31: keep favorites/recent/continue features behind the top ★ hub,
    // but do not show the large personal panel on the homepage.
    const panel=$('#v30PersonalPanel');
    if(panel)panel.remove();
  }

  function decorateFiles(){
    const favIds=new Set(read(KEY_FAV,[]).map(x=>x.id));
    $$('.file-row').forEach(row=>{
      const open=row.querySelector('[data-file]');if(!open)return;const id=open.dataset.file;row.dataset.v30File=id;
      const src=row.querySelector('.file-source');if(src&&!src.classList.contains('v30-source-badge'))src.classList.add('v30-source-badge');
      const actions=row.querySelector('.file-actions');if(!actions||actions.querySelector('[data-v30-fav]'))return;
      actions.insertAdjacentHTML('afterbegin',`<button class="v30-mini-action v30-fav ${favIds.has(id)?'active':''}" data-v30-fav="${esc(id)}" title="المفضلة" aria-label="المفضلة">★</button><button class="v30-mini-action" data-v30-share="${esc(id)}" title="شارك" aria-label="شارك">↗</button><button class="v30-mini-action" data-v30-report="${esc(id)}" title="بلّغ على مشكلة" aria-label="بلّغ على مشكلة">!</button>`);
    });
  }
  function decorateContextShare(){
    const head=$('.context-head,.chapter-hero-copy');if(!head||head.querySelector('.v30-context-share'))return;
    const b=document.createElement('button');b.className='v30-context-share';b.type='button';b.innerHTML='<span>↗</span> شارك الصفحة';head.appendChild(b);
  }
  async function shareUrl(url,title='قرايتي'){
    try{if(navigator.share){await navigator.share({title,url});return}await navigator.clipboard.writeText(url);toast('تنسخ الرابط ✅')}catch(e){if(e?.name!=='AbortError')toast('ما نجّمتش ننسخ الرابط')}
  }
  function reportItem(item){
    const subject=encodeURIComponent(`Qrayti - مشكلة في ملف: ${item.label||item.id}`);
    const body=encodeURIComponent(`سلام، لقيت مشكلة في ملف على قرايتي.\n\nالملف: ${item.label||''}\nID: ${item.id||''}\nالمصدر: ${item.source||''}\nالصفحة: ${location.href}\n\nنوع المشكلة (اكتب هنا): مصدر / سداسي / اسم / ملف لا يفتح / تكرار / أخرى\n\nالتفاصيل:`);
    location.href=`mailto:9rayti.learn@gmail.com?subject=${subject}&body=${body}`;
  }

  async function setupSmartSearch(){
    const modal=$('#searchModal'),input=$('#globalSearch'),results=$('#searchResults');if(!modal||!input||!results)return;
    if(!$('#v30SearchFilters')){
      const box=document.createElement('div');box.id='v30SearchFilters';box.className='v30-search-filters';box.innerHTML=`<select id="v30SearchLicence"><option value="">كل الإجازات</option><option value="info">Sciences Info</option><option value="lt">LT</option><option value="lce">LCE</option></select><select id="v30SearchYear"><option value="">كل السنوات</option><option value="1">سنة 1</option><option value="2">سنة 2</option></select><select id="v30SearchSemester"><option value="">S1 + S2</option><option value="1">S1</option><option value="2">S2</option></select><select id="v30SearchCategory"><option value="">كل الأنواع</option><option value="cours">Cours</option><option value="td">TD</option><option value="tp">TP</option><option value="exam">Examens</option><option value="resume">Résumés</option><option value="extra">Fichiers</option></select><select id="v30SearchSource"><option value="">كل الجامعات</option></select>`;
      modal.querySelector('.search-box')?.insertAdjacentElement('afterend',box);
      ['v30SearchLicence','v30SearchYear','v30SearchSemester','v30SearchCategory','v30SearchSource'].forEach(id=>$('#'+id)?.addEventListener('change',()=>renderSmartSearch(input.value)));
    }
    const idx=await staticIndex();const srcSel=$('#v30SearchSource');if(srcSel&&srcSel.options.length===1){const src=[...new Set((idx.items||[]).map(x=>x.sourceUniversity).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ar'));src.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;srcSel.appendChild(o)})}
    input.placeholder='لوّج في كامل قرايتي: مادة، ملف، جامعة، TD...';
    input.addEventListener('input',e=>{e.stopImmediatePropagation();renderSmartSearch(e.target.value)},true);
  }
  async function renderSmartSearch(q){
    const results=$('#searchResults');if(!results)return;const idx=await staticIndex(),term=String(q||'').trim().toLowerCase();
    const filters={lic:$('#v30SearchLicence')?.value||'',year:$('#v30SearchYear')?.value||'',sem:$('#v30SearchSemester')?.value||'',cat:$('#v30SearchCategory')?.value||'',src:$('#v30SearchSource')?.value||''};
    if(!term&&!Object.values(filters).some(Boolean)){results.innerHTML='<div class="search-hint">اكتب كلمة، أو استعمل الفلاتر باش تلوّج في المكتبة الكل.</div>';return}
    const rows=[];for(const x of idx.items||[]){
      if(filters.lic&&x.licence!==filters.lic)continue;if(filters.year&&String(x.year)!==filters.year)continue;if(filters.sem&&String(x.semester)!==filters.sem)continue;if(filters.cat&&x.category!==filters.cat)continue;if(filters.src&&x.sourceUniversity!==filters.src)continue;
      if(term){const key=`${x.displayName||''} ${x.name||''} ${x.subjectName||''} ${x.group||''} ${x.sourceUniversity||''} ${x.sourceInstitution||''}`.toLowerCase();if(!key.includes(term))continue}
      rows.push(x);if(rows.length>=80)break;
    }
    results.innerHTML=rows.length?`<div class="v30-search-summary"><b>${rows.length}</b> نتيجة${rows.length===80?' أولى':''}</div>`+rows.map(x=>`<button class="result-item v30-search-result" data-v30-index-id="${esc(x.id)}"><span><b>${esc(x.displayName||x.name)}</b><small>${esc(x.subjectName||'')} • ${esc(x.categoryName||x.category||'')} • ${esc(x.sourceUniversity||'المصدر موش مذكور')}</small></span><span class="result-kind">${esc(String(x.semester||1)==='2'?'S2':'S1')}</span></button>`).join(''):'<div class="search-hint">ما لقينا حتى نتيجة بالفلاتر هاذم.</div>';
  }
  async function indexItem(id){const idx=await staticIndex();return (idx.items||[]).find(x=>String(x.id)===String(id))}

  function maybeAutoOpen(){
    const raw=(location.hash||'').replace(/^#/,'');const [p,q='']=raw.split('?');const sp=new URLSearchParams(q),id=sp.get('open');if(!id)return;
    const b=document.querySelector(`[data-file="${CSS.escape(id)}"]`);if(!b)return;
    sp.delete('open');const clean='#'+p+(sp.toString()?'?'+sp.toString():'');history.replaceState(null,'',location.pathname+location.search+clean);setTimeout(()=>b.click(),60);
  }
  function enhanceScreen(){
    setTimeout(()=>{saveContinue();decorateFiles();decorateContextShare();refreshPersonalUI();maybeAutoOpen()},80);
  }

  document.addEventListener('click',async e=>{
    const close=e.target.closest('[data-v30-close]');if(close){hideHub();return}
    if(e.target.closest('#v30SavedTop')||e.target.closest('[data-v30-open-hub]')||e.target.closest('[data-v30-nav="saved"]')){showHub();return}
    if(e.target.closest('[data-v30-nav="home"]')){location.hash='#/welcome';return}
    if(e.target.closest('[data-v30-nav="search"]')){$('#searchBtn')?.click();return}
    if(e.target.closest('[data-v30-nav="continue"]')||e.target.closest('[data-v30-continue]')){const c=read(KEY_CONT,null);if(c?.route)location.hash=c.route;else location.hash='#/licence';return}
    const r=e.target.closest('[data-v30-recent-id]');if(r){const x=read(KEY_REC,[]).find(x=>x.id===r.dataset.v30RecentId);if(x)navigateItem(x);return}
    const saved=e.target.closest('[data-v30-saved]');if(saved&&!e.target.closest('.v30-remove-fav')){const list=saved.dataset.v30Saved==='fav'?read(KEY_FAV,[]):read(KEY_REC,[]),x=list.find(y=>y.id===saved.dataset.id);if(x){hideHub();navigateItem(x)}return}
    const rem=e.target.closest('.v30-remove-fav');if(rem){const card=rem.closest('[data-v30-saved]'),x=read(KEY_FAV,[]).find(y=>y.id===card?.dataset.id);if(x)toggleFavorite(x);return}
    const fav=e.target.closest('[data-v30-fav]');if(fav){e.preventDefault();e.stopPropagation();const row=fav.closest('.file-row'),item=itemFromRow(row);const on=toggleFavorite(item);toast(on?'تحفظ في المفضلة ⭐':'تنحّى من المفضلة');return}
    const sh=e.target.closest('[data-v30-share]');if(sh){e.preventDefault();e.stopPropagation();const item=itemFromRow(sh.closest('.file-row'));shareUrl(location.origin+location.pathname+routeWithOpen(cleanHash(),item.id),item.label);return}
    if(e.target.closest('.v30-context-share')){shareUrl(location.href,document.title);return}
    const rep=e.target.closest('[data-v30-report]');if(rep){e.preventDefault();e.stopPropagation();reportItem(itemFromRow(rep.closest('.file-row')));return}
    const idxBtn=e.target.closest('[data-v30-index-id]');if(idxBtn){const x=await indexItem(idxBtn.dataset.v30IndexId);if(x){document.querySelector('[data-close="search"]')?.click();navigateItem(x)}return}
    const open=e.target.closest('[data-file]');if(open){const row=open.closest('.file-row'),item=itemFromRow(row);if(item)storeRecent(item)}
  },true);

  window.addEventListener('hashchange',()=>setTimeout(enhanceScreen,120));
  document.getElementById('app')?.addEventListener('qrayti:screen-rendered',enhanceScreen);
  ensureTopSaved();ensureBottomNav();ensureHub();setupSmartSearch();enhanceScreen();
})();
