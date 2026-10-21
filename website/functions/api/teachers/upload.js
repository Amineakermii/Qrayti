import {json} from '../../_lib/common.js';
import {guarded,teacher,body,fail,now} from '../../_lib/teacher-auth.js';
import {reserve,submissionView} from '../../_lib/teacher-store.js';
import {readValidatedFile} from '../../_lib/teacher-files.js';
export const onRequest=guarded(async c=>{
  const principal=await teacher(c),t=principal.row,db=c.env.CATALOG_DB;
  if(c.request.method==='POST'){const result=await reserve(c,t,await body(c.request));return json({id:result.id,status:result.status},result.created?201:200);}
  if(c.request.method!=='PUT')fail('Method not allowed.',405);
  const id=new URL(c.request.url).searchParams.get('id');let row=await db.prepare('SELECT * FROM teacher_submissions WHERE id=? AND teacher_id=?').bind(id,t.id).first();if(!row)fail('Upload not found.',404);
  if(['pending','publishing','approved','rejected'].includes(row.status))return json({item:submissionView(row)});
  const lease=crypto.randomUUID();row=await db.prepare("UPDATE teacher_submissions SET status='receiving',lease=? WHERE id=? AND teacher_id=? AND generation=? AND status='reserved' AND expires_at>? RETURNING *").bind(lease,id,t.id,t.generation,now()).first();if(!row)fail('Upload expired or is already running. Retry the file.',409);
  try{
    const file=await readValidatedFile(c.request,row);await teacher(c);
    await c.env.TEACHER_UPLOADS.put(row.r2_key,file.bytes,{httpMetadata:{contentType:file.mime,cacheControl:'private, no-store'}});
    const saved=await db.prepare(`UPDATE teacher_submissions SET status='pending',version=1,mime=?,sha256=? WHERE id=? AND lease=? AND status='receiving' AND expires_at>? AND EXISTS(SELECT 1 FROM teachers WHERE id=? AND generation=? AND status='active' AND expires_at>?) RETURNING *`).bind(file.mime,file.sha256,id,lease,now(),t.id,t.generation,now()).first();
    if(!saved)fail('Access or upload expired before completion. Contact the owner.',401);return json({item:submissionView(saved)},201);
  }catch(e){
    // A finalization response may fail after committing. Never delete accepted bytes.
    // If the database is unavailable, retain the object for later reconciliation.
    const failed=await db.prepare("UPDATE teacher_submissions SET status='failed' WHERE id=? AND lease=? AND status='receiving' RETURNING id").bind(id,lease).first().catch(()=>null);
    if(failed)await c.env.TEACHER_UPLOADS.delete(row.r2_key).catch(()=>{});
    throw e;
  }
});
