import {json,normalizeMeta,validateMeta,newId,fileExt,clean} from '../../_lib/common.js';
import {requireAdmin} from '../../_lib/auth.js';
import {duplicateWarnings,insertFile} from '../../_lib/catalog-db.js';
export async function onRequest(context){
  const a=await requireAdmin(context);if(!a.ok)return a.response;if(!context.env.CATALOG_DB||!context.env.COURSE_FILES)return json({error:'Storage bindings missing'},503);
  const u=new URL(context.request.url),action=u.searchParams.get('action');
  if(action==='create'&&context.request.method==='POST'){
    const body=await context.request.json().catch(()=>({})),fileName=clean(body.fileName||'file.bin',220),size=Number(body.size)||0,mime=clean(body.mime||'application/octet-stream',120),meta=normalizeMeta(body.meta||{});if(!meta.displayName)meta.displayName=fileName.replace(/\.[^.]+$/,'');const errors=validateMeta(meta,true);if(errors.length)return json({error:errors.includes('rightsConfirmed')?'Confirm publishing rights and that this is not a paid book':'Missing metadata',fields:errors},400);
    const id=newId(),ext=fileExt(fileName)||'bin',key=`uploads/${id}.${ext}`,mp=await context.env.COURSE_FILES.createMultipartUpload(key),duplicates=await duplicateWarnings(context.env.CATALOG_DB,meta,size,fileName);
    return json({ok:true,id,key,uploadId:mp.uploadId,fileName,size,mime,duplicates});
  }
  const key=clean(u.searchParams.get('key'),300),uploadId=clean(u.searchParams.get('uploadId'),180);if(!key.startsWith('uploads/qf_')||!uploadId)return json({error:'Invalid multipart state'},400);
  const mp=context.env.COURSE_FILES.resumeMultipartUpload(key,uploadId);
  if(action==='part'&&context.request.method==='PUT'){
    const partNumber=Number(u.searchParams.get('partNumber'));if(!Number.isInteger(partNumber)||partNumber<1||partNumber>10000||!context.request.body)return json({error:'Invalid part'},400);
    try{return json(await mp.uploadPart(partNumber,context.request.body))}catch(err){return json({error:String(err?.message||err)},400)}
  }
  if(action==='complete'&&context.request.method==='POST'){
    const body=await context.request.json().catch(()=>({})),parts=Array.isArray(body.parts)?body.parts:[],id=clean(body.id,90),fileName=clean(body.fileName,220),mime=clean(body.mime||'application/octet-stream',120),size=Number(body.size)||0,meta=normalizeMeta(body.meta||{});if(!id||!key.includes(id)||!parts.length)return json({error:'Incomplete multipart state'},400);if(!meta.displayName)meta.displayName=fileName.replace(/\.[^.]+$/,'');const errors=validateMeta(meta,true);if(errors.length)return json({error:errors.includes('rightsConfirmed')?'Confirm publishing rights and that this is not a paid book':'Missing metadata',fields:errors},400);
    try{await mp.complete(parts)}catch(err){return json({error:String(err?.message||err)},400)}
    try{const item=await insertFile(context.env.CATALOG_DB,{id,key,meta,originalName:fileName,mime,size,createdBy:a.email});return json({ok:true,item},201)}catch(err){await context.env.COURSE_FILES.delete(key).catch(()=>{});return json({error:'Could not save catalog record',detail:String(err?.message||err)},500)}
  }
  if(action==='abort'&&context.request.method==='DELETE'){try{await mp.abort()}catch{}return new Response(null,{status:204})}
  return json({error:'Unsupported multipart action'},405);
}
