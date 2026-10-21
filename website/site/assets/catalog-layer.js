(()=>{
  const cache=new Map();
  const CATEGORY_META={
    cours:{name:'Cours',ar:'دروس'},td:{name:'TD',ar:'أعمال موجهة'},tp:{name:'TP',ar:'أعمال تطبيقية'},
    qcm:{name:'QCM',ar:'أسئلة اختيار متعدد'},resume:{name:'Résumés',ar:'ملخّصات'},exam:{name:'Examens',ar:'فروض وامتحانات'},extra:{name:'Fichiers',ar:'ملفات إضافية'}
  };
  const contextKey=q=>`${q.licence||'info'}:${q.year||1}:${q.semester||1}:${q.track||'common'}`;
  async function load(q){
    const key=contextKey(q),now=Date.now(),hit=cache.get(key);
    if(hit&&now-hit.at<60000)return hit.promise;
    const p=(async()=>{
      const params=new URLSearchParams({licence:q.licence||'info',year:q.year||1,semester:q.semester||1,track:q.track||'common'});
      const r=await fetch(`/api/catalog?${params}`,{headers:{Accept:'application/json'},cache:'no-store'});
      if(!r.ok)return {files:[]};
      const data=await r.json();
      return data&&Array.isArray(data.files)?data:{files:[]};
    })().catch(()=>({files:[]}));
    cache.set(key,{at:now,promise:p});
    return p;
  }
  function cloneSubject(s){return {...s,categories:(s.categories||[]).map(c=>({...c}))}}
  function merge(base,extra){
    if(!extra?.files?.length&&!extra?.overrides?.length)return base;
    const out={...base,subjects:(base.subjects||[]).map(cloneSubject),files:[...(base.files||[])],program:[...(base.program||[])]};
    const ids=new Set(out.files.map(f=>String(f.id)));
    const subjects=new Map(out.subjects.map(s=>[String(s.id),s]));
    for(const f0 of extra.files||[]){
      if(!f0?.id||ids.has(String(f0.id)))continue;
      const f={...f0,dynamic:true};ids.add(String(f.id));out.files.push(f);
      let s=subjects.get(String(f.subject));
      if(!s){
        s={id:f.subject,name:f.subjectName||f.subject,ar:f.subjectAr||'',abbr:f.subjectAbbr||'',source:'admin',count:0,categories:[]};
        subjects.set(String(s.id),s);out.subjects.push(s);
      }
      s.count=Number(s.count||0)+1;
      let c=(s.categories||[]).find(x=>String(x.id)===String(f.category));
      if(!c){const meta=CATEGORY_META[f.category]||{name:f.categoryName||'Fichiers',ar:f.categoryAr||''};c={id:f.category,name:f.categoryName||meta.name,ar:f.categoryAr||meta.ar,count:0};s.categories.push(c)}
      c.count=Number(c.count||0)+1;
    }
    if(extra.overrides?.length){
      const changes=new Map(extra.overrides.map(x=>[x.id,x]));
      out.files=out.files.map(f=>changes.has(f.id)?{...f,...changes.get(f.id)}:f).filter(f=>f.status!=='hidden');
      for(const s of out.subjects){const fs=out.files.filter(f=>f.subject===s.id);s.count=fs.length;s.categories=s.categories.map(c=>({...c,count:fs.filter(f=>f.category===c.id).length})).filter(c=>c.count>0);}
    }
    return out;
  }
  async function withRemote(base,q){return merge(base,await load(q))}
  function invalidate(q){if(q)cache.delete(contextKey(q));else cache.clear()}
  window.QraytiCatalogLayer={withRemote,invalidate};
})();
