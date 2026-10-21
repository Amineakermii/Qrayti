import {json,normalizeMeta,validateMeta,newId,fileExt} from '../../_lib/common.js';
import {requireAdmin} from '../../_lib/auth.js';
import {duplicateWarnings,insertFile} from '../../_lib/catalog-db.js';
export async function onRequestPost(context){
  const a=await requireAdmin(context);if(!a.ok)return a.response;if(!context.env.CATALOG_DB||!context.env.COURSE_FILES)return json({error:'Storage bindings missing'},503);
  const form=await context.request.formData().catch(()=>null);if(!form)return json({error:'Invalid form data'},400);
  const file=form.get('file');if(!file||typeof file.stream!=='function')return json({error:'File missing'},400);
  if(Number(file.size)>95*1024*1024)return json({error:'Use multipart upload for files larger than 95 MB'},413);
  const raw=JSON.parse(String(form.get('meta')||'{}')),meta=normalizeMeta(raw);if(!meta.displayName)meta.displayName=String(file.name||'file').replace(/\.[^.]+$/,'');const errors=validateMeta(meta,true);if(errors.length)return json({error:errors.includes('rightsConfirmed')?'Confirm publishing rights and that this is not a paid book':'Missing metadata',fields:errors},400);
  const ext=fileExt(file.name)||'bin',id=newId(),key=`uploads/${id}.${ext}`,mime=file.type||'application/octet-stream';
  const duplicates=await duplicateWarnings(context.env.CATALOG_DB,meta,file.size,file.name);
  await context.env.COURSE_FILES.put(key,file.stream(),{httpMetadata:{contentType:mime,cacheControl:'public, max-age=3600'}});
  try{const item=await insertFile(context.env.CATALOG_DB,{id,key,meta,originalName:file.name,mime,size:file.size,createdBy:a.email});return json({ok:true,item,duplicates},201)}catch(err){await context.env.COURSE_FILES.delete(key).catch(()=>{});return json({error:'Could not save catalog record',detail:String(err?.message||err)},500)}
}
