import {guarded,admin,fail} from '../../../../_lib/teacher-auth.js';
import {downloadPrivate} from '../../../../_lib/teacher-files.js';
export const onRequest=guarded(async c=>{await admin(c);if(!['GET','HEAD'].includes(c.request.method))fail('Method not allowed.',405);const r=await c.env.CATALOG_DB.prepare('SELECT * FROM teacher_submissions WHERE id=?').bind(c.params.id).first();return downloadPrivate(c,r);});
