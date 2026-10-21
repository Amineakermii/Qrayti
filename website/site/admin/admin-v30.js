(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api=async(url,opt={})=>{const r=await fetch(url,{credentials:'same-origin',headers:{Accept:'application/json',...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d};
  const fmt=n=>{n=Number(n)||0;for(const u of ['B','KB','MB','GB']){if(n<1024||u==='GB')return `${n<10&&u!=='B'?n.toFixed(1):Math.round(n)} ${u}`;n/=1024}}
  function ensure(){
    const grid=$('#overviewTab .overview-grid');if(!grid||$('#v30HealthPanel'))return;
    grid.insertAdjacentHTML('afterend',`<section class="panel v30-admin-health" id="v30HealthPanel"><div class="panel-head"><div><span class="eyebrow">v30 • Site Health</span><h2>صحة قرايتي وBackup</h2><p>فحص سريع للفهرس، المصادر وملفات الـAdmin قبل أي تحديث كبير.</p></div><div class="queue-actions"><button class="ghost" id="v30HealthRefresh">عاود افحص</button><button class="ghost" id="v30HealthBackup">Backup JSON</button></div></div><div class="v30-health-grid"><article><span>🩺</span><div><small>الحالة</small><b id="v30HealthState">نثبت…</b><em id="v30HealthNote">—</em></div></article><article><span>🧬</span><div><small>Duplicate IDs</small><b id="v30DupIds">—</b><em>Static + Admin</em></div></article><article><span>❔</span><div><small>مصدر غير معروف</small><b id="v30Unknown">—</b><em>راجعهم وقت تلقى المصدر</em></div></article><article><span>🆕</span><div><small>Admin آخر 7 أيام</small><b id="v30RecentAdmin">—</b><em id="v30Drafts">—</em></div></article></div></section>`);
    $('#v30HealthRefresh').onclick=health;$('#v30HealthBackup').onclick=backup;
  }
  let last=null,healthRunning=false;
  async function data(){
    const [idx,dyn]=await Promise.all([fetch('static-index.json?v=30',{cache:'no-store'}).then(r=>r.json()),api('/api/admin/export').catch(()=>({items:[]}))]);
    return {staticItems:idx.items||[],dynamicItems:dyn.items||[]};
  }
  async function health(){
    if(healthRunning)return;
    healthRunning=true;
    ensure();
    const stateEl=$('#v30HealthState');
    if(stateEl)stateEl.textContent='نثبت…';
    try{
      last=await data();const all=[...last.staticItems,...last.dynamicItems];const ids=new Map;let dup=0,unknown=0;
      for(const x of all){const id=String(x.id||'');if(ids.has(id))dup++;else ids.set(id,1);if(!String(x.sourceUniversity||'').trim())unknown++}
      const cutoff=Date.now()-7*864e5,recent=last.dynamicItems.filter(x=>Date.parse(x.createdAt||0)>=cutoff).length,drafts=last.dynamicItems.filter(x=>x.status==='draft').length;
      $('#v30DupIds').textContent=dup;$('#v30Unknown').textContent=unknown;$('#v30RecentAdmin').textContent=recent;$('#v30Drafts').textContent=`${drafts} Draft`;
      const ok=dup===0;$('#v30HealthState').textContent=ok?'باهي ✅':'يلزم مراجعة ⚠️';$('#v30HealthNote').textContent=`${all.length.toLocaleString()} سجل • ${fmt(all.reduce((a,x)=>a+(Number(x.size)||0),0))}`;
    }catch(e){$('#v30HealthState').textContent='الفحص فشل';$('#v30HealthNote').textContent=e.message}
    finally{healthRunning=false}
  }
  async function backup(){
    if(!last)last=await data();const blob=new Blob([JSON.stringify({version:30,exportedAt:new Date().toISOString(),static:last.staticItems,dynamic:last.dynamicItems},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`qrayti-v30-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)
  }
  // v32 performance fix: never observe the whole Admin DOM. The old observer
  // reacted to health-panel updates and could recursively launch health() again.
  // Poll only the login gate at a low frequency, then stop forever after login.
  ensure();
  if($('#adminLoginGate')?.hidden){health()}else{
    const loginWatch=setInterval(()=>{
      if($('#adminLoginGate')?.hidden){clearInterval(loginWatch);health()}
    },500);
    addEventListener('pagehide',()=>clearInterval(loginWatch),{once:true});
  }
})();
