import {json} from '../../_lib/common.js';
import {guarded,admin,body,createInvitation,safeTeacher,fail} from '../../_lib/teacher-auth.js';
export const onRequest=guarded(async c=>{
  await admin(c);const db=c.env.CATALOG_DB;
  if(c.request.method==='POST')return json(await createInvitation(c,await body(c.request)),201);
  if(c.request.method!=='GET')fail('Method not allowed.',405);
  const rows=await db.prepare('SELECT * FROM teachers ORDER BY created_at DESC LIMIT 500').all();const count=await db.prepare("SELECT COUNT(*) n FROM teacher_submissions WHERE status IN ('pending','publishing')").first();
  return json({teachers:rows.results.map(safeTeacher),pendingCount:count.n});
});
