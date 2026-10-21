import {json,clean} from '../../_lib/common.js';
import {adminGuard,ensureContent} from '../../_lib/site-content.js';
export async function onRequest(c){
  const a=await adminGuard(c);if(!a.ok)return a.response;const db=c.env.CATALOG_DB;await ensureContent(db);
  if(c.request.method==='GET'){const r=await db.prepare('SELECT id,name,mime,size,created_at createdAt FROM site_media ORDER BY created_at DESC LIMIT 500').all();return json({items:(r.results||[]).map(x=>({...x,url:'/api/media/'+x.id}))});}
  if(c.request.method!=='POST')return json({error:'Method not allowed'},405);
  if(!c.env.COURSE_FILES)return json({error:'Image storage unavailable'},503);
  if(Number(c.request.headers.get('content-length'))>9*1024*1024)return json({error:'Maximum image size: 8 MB'},413);
  try{
    const form=await c.request.formData(),file=form.get('file');
    if(!file||typeof file.arrayBuffer!=='function'||!file.size||file.size>8*1024*1024)return json({error:'Choose an image under 8 MB'},400);
    const bytes=new Uint8Array(await file.arrayBuffer());let mime='',ext='';
    if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71){mime='image/png';ext='png';}
    else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){mime='image/jpeg';ext='jpg';}
    else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'){mime='image/webp';ext='webp';}
    else return json({error:'Use PNG, JPG or WebP images'},400);
    const id=crypto.randomUUID(),key='site-media/'+id+'.'+ext;
    await c.env.COURSE_FILES.put(key,bytes,{httpMetadata:{contentType:mime}});
    try{await db.prepare('INSERT INTO site_media (id,r2_key,name,mime,size,created_at) VALUES (?1,?2,?3,?4,?5,?6)').bind(id,key,clean(file.name,180),mime,file.size,new Date().toISOString()).run();}
    catch(e){await c.env.COURSE_FILES.delete(key);throw e;}
    return json({ok:true,item:{id,name:clean(file.name,180),url:'/api/media/'+id,mime,size:file.size}},201);
  }catch{return json({error:'Could not upload image'},400);}
}
