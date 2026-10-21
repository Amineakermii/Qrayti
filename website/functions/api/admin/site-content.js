import {json} from '../../_lib/common.js';
import {adminGuard,readJSON,getContent,normalizeContent} from '../../_lib/site-content.js';
export async function onRequest(context){
  const a=await adminGuard(context);if(!a.ok)return a.response;const db=context.env.CATALOG_DB;
  try{
    const current=await getContent(db);
    if(context.request.method==='GET')return json({ok:true,...current});
    if(!['PUT','POST'].includes(context.request.method))return json({error:'Method not allowed'},405);
    const body=await readJSON(context.request);if(!Number.isInteger(body.revision))return json({error:'Revision required'},400);
    const at=new Date().toISOString();let result;
    if(context.request.method==='PUT'){
      const draft=normalizeContent(body.content);
      result=await db.prepare("UPDATE site_content SET draft_json=?1,revision=revision+1,updated_at=?2 WHERE id='main' AND revision=?3 RETURNING revision").bind(JSON.stringify(draft),at,body.revision).first();
    }else if(body.action==='publish'){
      const id=crypto.randomUUID();
      const out=await db.batch([
        db.prepare("UPDATE site_content SET published_json=draft_json,published_revision=revision+1,revision=revision+1,updated_at=?1,token=?2 WHERE id='main' AND revision=?3 RETURNING revision").bind(at,id,body.revision),
        db.prepare("INSERT INTO site_versions (id,revision,content_json,created_at,created_by) SELECT ?1,revision,published_json,?2,?3 FROM site_content WHERE id='main' AND token=?1").bind(id,at,a.email)
      ]);result=out[0].results?.[0];
    }else if(body.action==='restore'){
      const v=await db.prepare('SELECT content_json FROM site_versions WHERE id=?1').bind(String(body.id||'')).first();if(!v)return json({error:'Version not found'},404);
      result=await db.prepare("UPDATE site_content SET draft_json=?1,revision=revision+1,updated_at=?2 WHERE id='main' AND revision=?3 RETURNING revision").bind(v.content_json,at,body.revision).first();
    }else return json({error:'Unknown action'},400);
    if(!result)return json({error:'Another session saved changes. Reload before saving.',code:'conflict'},409);
    return json({ok:true,...await getContent(db)});
  }catch(e){console.error('site-content',e.message);return json({error:e.message||'Could not save content'},400);}
}
