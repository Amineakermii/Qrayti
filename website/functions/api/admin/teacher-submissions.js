import {json} from '../../_lib/common.js';
import {guarded,admin,fail} from '../../_lib/teacher-auth.js';
import {selectSubmission,submissionView} from '../../_lib/teacher-store.js';
export const onRequest=guarded(async c=>{
  await admin(c);if(c.request.method!=='GET')fail('Method not allowed.',405);const q=new URL(c.request.url).searchParams,status=q.get('status')||'',teacherId=q.get('teacherId')||'',offset=Math.max(0,Math.min(100000,Number(q.get('offset'))||0));
  if(status&&!['all','pending','approved','rejected'].includes(status))fail('Unknown status.');
  const rows=await c.env.CATALOG_DB.prepare(selectSubmission+" WHERE s.status IN ('pending','publishing','approved','rejected') AND (?='' OR ?='all' OR s.status=? OR (?='pending' AND s.status='publishing')) AND (?='' OR s.teacher_id=?) ORDER BY s.created_at DESC LIMIT 100 OFFSET ?").bind(status,status,status,status,teacherId,teacherId,offset).all();const count=await c.env.CATALOG_DB.prepare("SELECT COUNT(*) n FROM teacher_submissions WHERE status IN ('pending','publishing')").first();
  return json({items:rows.results.map(submissionView),pendingCount:count.n,nextOffset:rows.results.length===100?offset+100:null});
});
