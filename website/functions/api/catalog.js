import {json,safeInt,sizeText} from '../_lib/common.js';
export async function onRequestGet(context){
  if(!context.env.CATALOG_DB)return json({files:[],warning:'catalog unavailable'},200,{'cache-control':'public, max-age=30'});
  const u=new URL(context.request.url),licence=u.searchParams.get('licence')||'info',year=safeInt(u.searchParams.get('year'),1,4,1),semester=safeInt(u.searchParams.get('semester'),1,2,1),track=u.searchParams.get('track')||'common';
  const q=`SELECT id,original_name,display_name,subject_id,subject_name,subject_ar,subject_abbr,category,category_name,category_ar,group_name,group_title,topic,kind,mime,size,source_university,source_institution,source_instructor,source_basis
           FROM content_files WHERE status='published' AND licence=?1 AND year=?2 AND semester=?3 AND (track=?4 OR track='common') ORDER BY updated_at ASC`;
  const result=await context.env.CATALOG_DB.prepare(q).bind(licence,year,semester,track).all();
  const files=(result.results||[]).map(r=>({
    id:r.id,subject:r.subject_id,subjectName:r.subject_name,subjectAr:r.subject_ar||'',subjectAbbr:r.subject_abbr||'',category:r.category,categoryName:r.category_name,categoryAr:r.category_ar||'',group:r.group_name,groupTitle:r.group_title||'',topic:r.topic||'',
    name:r.original_name,displayName:r.display_name,kind:r.kind,size:Number(r.size)||0,sizeText:sizeText(r.size),sourceUniversity:r.source_university||'',sourceInstitution:r.source_institution||'',sourceInstructor:r.source_instructor||'',sourceBasis:r.source_basis||'admin',sourcePath:r.source_basis==='teacher'?'Qrayti Teachers':'Qrayti Admin',assetUrl:`/api/files/${encodeURIComponent(r.id)}`,downloadUrl:`/api/files/${encodeURIComponent(r.id)}?download=1`
  }));
  const overrides=await context.env.CATALOG_DB.prepare("SELECT id,value_json FROM static_overrides WHERE licence=?1 AND year=?2 AND semester=?3 AND (track=?4 OR track='common')").bind(licence,year,semester,track).all().catch(()=>({results:[]}));
  return json({schemaVersion:2,files,overrides:(overrides.results||[]).map(x=>({id:x.id,...JSON.parse(x.value_json)}))},200,{'cache-control':'public, max-age=30, stale-while-revalidate=120'});
}
