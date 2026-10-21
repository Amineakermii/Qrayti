const COOKIE='qrayti_admin';
function noStore(extra={}){return {'Cache-Control':'no-store',...extra}}
export {noStore};
export function adminEmail(context){return context?.env?.ADMIN_EMAIL||'9rayti.learn@gmail.com'}
function b64u(buf){return btoa(String.fromCharCode(...new Uint8Array(buf))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
async function sign(secret,msg){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64u(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(msg)))}
export async function makeCookie(context){const secret=context.env.ADMIN_SESSION_SECRET;if(!secret)throw new Error('ADMIN_SESSION_SECRET missing');const exp=Math.floor(Date.now()/1000)+604800;const msg=`admin.${exp}`;const sig=await sign(secret,msg);return `${COOKIE}=${msg}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`}
export function logoutCookie(){return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}
export async function isAdminRequest(context){const secret=context.env.ADMIN_SESSION_SECRET||context.env.ADMIN_PASSWORD;if(!secret)return false;const raw=(context.request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE}=`));if(!raw)return false;const v=raw.slice(COOKIE.length+1);const parts=v.split('.');if(parts.length!==3)return false;const exp=Number(parts[1]);if(!exp||exp<Math.floor(Date.now()/1000))return false;return await sign(secret,`${parts[0]}.${parts[1]}`)===parts[2]}
export async function requireAdmin(context){if(await isAdminRequest(context))return {ok:true,email:adminEmail(context)};return {ok:false,response:Response.json({error:'Wrong password or expired admin session'},{status:401,headers:noStore()})}}
export function checkPassword(context,value){return String(value||'')===String(context.env.ADMIN_PASSWORD||'')}
