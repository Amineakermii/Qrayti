import {guarded,teacher,fail} from '../../../../_lib/teacher-auth.js';
import {downloadPrivate} from '../../../../_lib/teacher-files.js';
export const onRequest=guarded(async c=>{const t=(await teacher(c)).row;if(!['GET','HEAD'].includes(c.request.method))fail('Method not allowed.',405);const r=await c.env.CATALOG_DB.prepare('SELECT * FROM teacher_submissions WHERE id=? AND teacher_id=?').bind(c.params.id,t.id).first();return downloadPrivate(c,r);});
