import {json,clean,safeInt} from '../../_lib/common.js';
import {adminGuard,ensureContent,readJSON} from '../../_lib/site-content.js';
export async function onRequest(c){
  const a=await adminGuard(c);if(!a.ok)return a.response;
  const db=c.env.CATALOG_DB;await ensureContent(db);
  if(c.request.method==='GET'){
    const r=await db.prepare('SELECT id,value_json FROM static_overrides').all();
    return json({items:r.results.map(x=>({id:x.id,...JSON.parse(x.value_json)}))});
  }
  if(c.request.method!=='PUT')return json({error:'Method not allowed'},405);
  try{
    const b=await readJSON(c.request),m=b.meta||{},id=clean(b.id,100);
    if(!/^[a-z0-9_-]+$/i.test(id)||!clean(m.displayName,220))return json({error:'Invalid file'},400);
    const patch={displayName:clean(m.displayName,220),group:clean(m.group,180),sourceUniversity:clean(m.sourceUniversity,180),sourceInstitution:clean(m.sourceInstitution,180),sourceInstructor:clean(m.sourceInstructor,180),status:m.status==='hidden'?'hidden':'published'};
    if(typeof m.originalGroup==='string'&&m.group!==m.originalGroup)patch.groupTitle=patch.group;
    else if(typeof m.groupTitle==='string')patch.groupTitle=clean(m.groupTitle,220);
    await db.prepare('INSERT INTO static_overrides (id,licence,year,semester,track,value_json) VALUES (?1,?2,?3,?4,?5,?6) ON CONFLICT(id) DO UPDATE SET value_json=excluded.value_json').bind(id,clean(m.licence,20),safeInt(m.year,1,4,1),safeInt(m.semester,1,2,1),clean(m.track||'common',40),JSON.stringify(patch)).run();
    return json({ok:true});
  }catch(e){return json({error:e.message},400);}
}
