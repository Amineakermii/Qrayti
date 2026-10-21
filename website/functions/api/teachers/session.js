import {json} from '../../_lib/common.js';
import {guarded,storage,body,hash,token,now,fail,teacher,safeTeacher,limits,sessionCookie,cookieValue} from '../../_lib/teacher-auth.js';
export const onRequest=guarded(async c=>{
  const db=storage(c),method=c.request.method;
  if(method==='GET')return json({teacher:safeTeacher((await teacher(c)).row),limits});
  if(method==='DELETE'){const raw=cookieValue(c);if(raw)await db.prepare('DELETE FROM teacher_sessions WHERE hash=?').bind(await hash(raw)).run();return new Response(null,{status:204,headers:{'Cache-Control':'no-store','Set-Cookie':sessionCookie('',0)}});}
  if(method!=='POST')fail('Method not allowed.',405);
  const input=await body(c.request),time=now(),window=Math.floor(time/900000),ip=c.request.headers.get('CF-Connecting-IP')||'local';
  const key=await hash(ip+':'+window),limit=await db.prepare(`INSERT INTO teacher_login_limits(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 WHERE attempts<10 RETURNING attempts`).bind(key,(window+1)*900000).first();
  if(!limit)fail('Too many sign-in attempts. Try again later.',429,{retryAt:new Date((window+1)*900000).toISOString()});
  const raw=typeof input.token==='string'?input.token:'';
  const row=await db.prepare(`SELECT * FROM teachers WHERE token_hash=? AND status='active' AND expires_at>?`).bind(await hash(raw),time).first();
  if(!row)fail('Invitation is invalid, expired or revoked. Contact the owner.',401);
  const session=token(),expires=Math.min(row.expires_at,time+7*86400000);
  await db.batch([db.prepare('INSERT INTO teacher_sessions(hash,teacher_id,generation,expires_at) VALUES(?,?,?,?)').bind(await hash(session),row.id,row.generation,expires),db.prepare('DELETE FROM teacher_login_limits WHERE key=? OR expires_at<?').bind(key,time),db.prepare('DELETE FROM teacher_sessions WHERE expires_at<?').bind(time)]);
  return json({teacher:safeTeacher(row),limits},200,{'Set-Cookie':sessionCookie(session,Math.floor((expires-time)/1000))});
});
