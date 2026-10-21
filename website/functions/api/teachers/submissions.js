import {json} from '../../_lib/common.js';
import {guarded,teacher,fail} from '../../_lib/teacher-auth.js';
import {selectSubmission,submissionView,usage} from '../../_lib/teacher-store.js';
export const onRequest=guarded(async c=>{const t=(await teacher(c)).row;if(c.request.method!=='GET')fail('Method not allowed.',405);const offset=Math.max(0,Math.min(100000,Number(new URL(c.request.url).searchParams.get('offset'))||0));const rows=await c.env.CATALOG_DB.prepare(selectSubmission+" WHERE s.teacher_id=? AND s.status IN ('pending','publishing','approved','rejected') ORDER BY s.created_at DESC LIMIT 100 OFFSET ?").bind(t.id,offset).all();return json({items:rows.results.map(submissionView),usage:await usage(c.env.CATALOG_DB,t.id),nextOffset:rows.results.length===100?offset+100:null});});
