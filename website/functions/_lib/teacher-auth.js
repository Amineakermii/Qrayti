import {json,clean} from './common.js';
import {requireAdmin} from './auth.js';
import {readJSON} from './site-content.js';

export const limits=Object.freeze({fileBytes:25*1024**2,dailyFiles:20,dailyBytes:250*1024**2,outstandingBytes:500*1024**2});
export const now=()=>Date.now();
export const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
export const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',typeof value==='string'?new TextEncoder().encode(value):value)),v=>v.toString(16).padStart(2,'0')).join('');
export function fail(message,status=400,extra={}){throw Object.assign(new Error(message),{status,extra});}
export const safeTeacher=r=>({id:r.id,name:r.name,email:r.email,university:r.university,institution:r.institution,status:r.status,generation:r.generation,expiresAt:new Date(r.expires_at).toISOString(),createdAt:r.created_at});
export function originGuard(request){if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')!==new URL(request.url).origin)fail('This action must be sent from Qrayti.',403);}
export function storage(c){if(!c.env.CATALOG_DB||!c.env.TEACHER_UPLOADS)fail('Teacher portal storage is unavailable. Please try later.',503);return c.env.CATALOG_DB;}
export async function body(request){try{return await readJSON(request,32768);}catch{fail('Invalid or oversized JSON request.');}}
export function guarded(fn){return async c=>{try{originGuard(c.request);return await fn(c);}catch(e){if(e.status)return json({error:e.message,...e.extra},e.status);console.error(JSON.stringify({event:'teacher_portal_failed',path:new URL(c.request.url).pathname}));return json({error:'The request could not be completed. Please retry.',code:'temporarily_unavailable'},503);}};}
export async function admin(c){const a=await requireAdmin(c);if(!a.ok)fail('Please sign in to Admin v2.',401);storage(c);return a;}
export function cookieValue(c){return (c.request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('qrayti_teacher='))?.slice(15)||'';}
export const sessionCookie=(raw,max)=>`qrayti_teacher=${raw}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${max}`;
export async function teacher(c){
  const db=storage(c),raw=cookieValue(c);if(!/^[a-f0-9]{64}$/.test(raw))fail('Your teacher session has expired. Open your invitation again.',401);
  const sessionHash=await hash(raw),r=await db.prepare(`SELECT t.* FROM teacher_sessions s JOIN teachers t ON t.id=s.teacher_id WHERE s.hash=? AND s.generation=t.generation AND s.expires_at>? AND t.expires_at>? AND t.status='active'`).bind(sessionHash,now(),now()).first();
  if(!r)fail('Your teacher session has expired or access was revoked.',401);return {row:r,sessionHash};
}
export async function createInvitation(c,input,id=null){
  const db=storage(c),raw=token(),tokenHash=await hash(raw),expires=now()+90*86400000;
  if(id){const r=await db.prepare(`UPDATE teachers SET generation=generation+1,token_hash=?,expires_at=?,status='active' WHERE id=? RETURNING *`).bind(tokenHash,expires,id).first();if(!r)fail('Teacher not found.',404);return {teacher:safeTeacher(r),token:raw,invitationUrl:new URL('/teachers/#invite='+raw,c.request.url).href};}
  const name=clean(input.name,120),email=clean(input.email,180),university=clean(input.university,180),institution=clean(input.institution,180);
  if(!name||!university||!institution||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))fail('Enter a name, valid email, Tunisian university and faculty.');
  const newId=crypto.randomUUID();await db.prepare('INSERT INTO teachers(id,name,email,university,institution,token_hash,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(newId,name,email,university,institution,tokenHash,expires,new Date().toISOString()).run();
  return {teacher:safeTeacher(await db.prepare('SELECT * FROM teachers WHERE id=?').bind(newId).first()),token:raw,invitationUrl:new URL('/teachers/#invite='+raw,c.request.url).href};
}
