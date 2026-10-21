import {json,clean} from './common.js';
import {requireAdmin} from './auth.js';

export const blankContent=()=>({schema:2,template:'classic',brand:{name:'',logo:''},home:{badge:'',title:'',accent:'',description:'',cta:'',install:'',image:'',imageAlt:'',showCampuses:true,motion:false},contact:{email:'',instagram:''},colors:{primary:'',secondary:''},texts:[],images:[]});
const text=(v,max=2000)=>String(v??'').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').slice(0,max);
export function safeImage(v){const s=clean(v,1000);if(!s)return '';if(/^\/(?:assets|api\/media)\/[a-zA-Z0-9_./%?=&-]+$/.test(s)&&!s.includes('..'))return s;throw new Error('Choose an image from the media library');}
const route=v=>{const s=text(v,500);if(s==='*'||/^\/#\/[a-zA-Z0-9_/?=&%.-]*$/.test(s)||/^\/teachers\/#\/(fr|en)$/.test(s))return s;throw new Error('Invalid page route');};
export function normalizeContent(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Content must be an object');
  if(!['classic','classic-motion'].includes(raw.template))throw new Error('Template is not available');
  const d=blankContent();d.template=raw.template;
  for(const k of ['name'])d.brand[k]=text(raw.brand?.[k],120);
  d.brand.logo=safeImage(raw.brand?.logo);
  for(const k of ['badge','title','accent','description','cta','install','imageAlt'])d.home[k]=text(raw.home?.[k],k==='description'?2000:240);
  d.home.image=safeImage(raw.home?.image);d.home.showCampuses=raw.home?.showCampuses!==false;d.home.motion=raw.home?.motion===true;
  const email=clean(raw.contact?.email,160);if(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))throw new Error('Invalid email');d.contact.email=email;
  const instagram=clean(raw.contact?.instagram,300);if(instagram&&!/^https:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(instagram))throw new Error('Use an Instagram profile URL');d.contact.instagram=instagram;
  for(const k of ['primary','secondary']){const c=raw.colors?.[k]||'';if(c&&!/^#[0-9a-f]{6}$/i.test(c))throw new Error('Invalid color');d.colors[k]=c;}
  if(!Array.isArray(raw.texts)||raw.texts.length>400||!Array.isArray(raw.images)||raw.images.length>200)throw new Error('Too many text or image edits');
  const ids=new Set();
  d.texts=raw.texts.map(x=>{const id=clean(x.id,80);if(!id||ids.has(id)||!String(x.original||'').trim())throw new Error('Invalid text edit');ids.add(id);if(x.attribute&&!['placeholder','title','aria-label'].includes(x.attribute))throw new Error('Invalid text attribute');return {id,route:route(x.route),original:text(x.original,2000),value:text(x.value,4000),...(x.attribute?{attribute:x.attribute}:{})};});
  d.images=raw.images.map(x=>({id:clean(x.id,80),route:route(x.route),original:text(x.original,1000),src:safeImage(x.src),alt:text(x.alt,240)})).filter(x=>x.original&&x.src);
  return d;
}
export async function adminGuard(context){
  const a=await requireAdmin(context);if(!a.ok)return a;
  if(!['GET','HEAD'].includes(context.request.method)){
    const origin=context.request.headers.get('Origin');
    if(origin&&origin!==new URL(context.request.url).origin)return {ok:false,response:json({error:'Origin not allowed'},403)};
  }
  if(!context.env.CATALOG_DB)return {ok:false,response:json({error:'Catalog storage unavailable'},503)};
  return a;
}
export async function readJSON(request,max=300000){
  if(!request.headers.get('content-type')?.includes('application/json'))throw new Error('Use application/json');
  if(Number(request.headers.get('content-length'))>max)throw new Error('Request too large');
  const reader=request.body?.getReader();if(!reader)throw new Error('Missing body');let size=0,parts=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error('Request too large');}parts.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function ensureContent(db){
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS site_content (id TEXT PRIMARY KEY,draft_json TEXT NOT NULL,published_json TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,published_revision INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,token TEXT NOT NULL DEFAULT \'\')'),
    db.prepare('CREATE TABLE IF NOT EXISTS site_versions (id TEXT PRIMARY KEY,revision INTEGER NOT NULL,content_json TEXT NOT NULL,created_at TEXT NOT NULL,created_by TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS site_media (id TEXT PRIMARY KEY,r2_key TEXT NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,created_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS static_overrides (id TEXT PRIMARY KEY,licence TEXT NOT NULL,year INTEGER NOT NULL,semester INTEGER NOT NULL,track TEXT NOT NULL,value_json TEXT NOT NULL)'),
    db.prepare("INSERT OR IGNORE INTO site_content (id,draft_json,published_json,updated_at) VALUES ('main',?1,?1,?2)").bind(JSON.stringify(blankContent()),new Date().toISOString())
  ]);
}
export async function getContent(db){await ensureContent(db);const r=await db.prepare("SELECT * FROM site_content WHERE id='main'").first();return {draft:JSON.parse(r.draft_json),published:JSON.parse(r.published_json),revision:r.revision,publishedRevision:r.published_revision,updatedAt:r.updated_at};}
