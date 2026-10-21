import {json} from '../../../_lib/common.js';
import {guarded,admin,body,fail} from '../../../_lib/teacher-auth.js';
import {selectSubmission,submissionView} from '../../../_lib/teacher-store.js';
import {reviewSubmission} from '../../../_lib/teacher-publish.js';
export const onRequest=guarded(async c=>{const a=await admin(c);if(c.request.method==='PATCH')return json({item:await reviewSubmission(c,c.params.id,await body(c.request),a.email)});if(c.request.method!=='GET')fail('Method not allowed.',405);const r=await c.env.CATALOG_DB.prepare(selectSubmission+" WHERE s.id=? AND s.status IN ('pending','publishing','approved','rejected')").bind(c.params.id).first();if(!r)fail('Submission not found.',404);return json({item:submissionView(r)});});
