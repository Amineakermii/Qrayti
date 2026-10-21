import {json} from '../../../_lib/common.js';
import {guarded,admin,body,createInvitation,safeTeacher,fail} from '../../../_lib/teacher-auth.js';
export const onRequest=guarded(async c=>{
  await admin(c);if(c.request.method!=='PATCH')fail('Method not allowed.',405);const b=await body(c.request);
  if(b.action==='rotate')return json(await createInvitation(c,{},c.params.id));
  if(b.action!=='revoke')fail('Unknown action.');
  const row=await c.env.CATALOG_DB.prepare("UPDATE teachers SET status='revoked',generation=generation+1 WHERE id=? RETURNING *").bind(c.params.id).first();if(!row)fail('Teacher not found.',404);return json({teacher:safeTeacher(row)});
});
