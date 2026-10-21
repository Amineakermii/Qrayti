import {json,normalizeMeta,validateMeta} from '../../../_lib/common.js';
import {requireAdmin} from '../../../_lib/auth.js';
import {rowToAdmin} from '../../../_lib/catalog-db.js';
export async function onRequest(context){
  const a=await requireAdmin(context);if(!a.ok)return a.response;if(!context.env.CATALOG_DB||!context.env.COURSE_FILES)return json({error:'Storage bindings missing'},503);
  const id=context.params.id,row=await context.env.CATALOG_DB.prepare('SELECT * FROM content_files WHERE id=?1').bind(id).first();if(!row)return json({error:'Not found'},404);
  if(context.request.method==='GET')return json({item:rowToAdmin(row)});
  if(context.request.method==='DELETE'){
    await context.env.CATALOG_DB.prepare('DELETE FROM content_files WHERE id=?1').bind(id).run();await context.env.COURSE_FILES.delete(row.r2_key).catch(()=>{});return new Response(null,{status:204});
  }
  if(context.request.method==='PATCH'){
    const body=await context.request.json().catch(()=>({})),meta=normalizeMeta({licence:body.licence??row.licence,year:body.year??row.year,semester:body.semester??row.semester,track:body.track??row.track,subjectId:body.subjectId??row.subject_id,subjectName:body.subjectName??row.subject_name,subjectAr:body.subjectAr??row.subject_ar,subjectAbbr:body.subjectAbbr??row.subject_abbr,category:body.category??row.category,categoryName:body.categoryName??row.category_name,categoryAr:body.categoryAr??row.category_ar,group:body.group??row.group_name,groupTitle:body.groupTitle??row.group_title,topic:body.topic??row.topic,displayName:body.displayName??row.display_name,sourceUniversity:body.sourceUniversity??row.source_university,sourceInstitution:body.sourceInstitution??row.source_institution,sourceInstructor:body.sourceInstructor??row.source_instructor,sourceBasis:body.sourceBasis??row.source_basis,status:body.status??row.status});const errors=validateMeta(meta);if(errors.length)return json({error:'Missing metadata',fields:errors},400);
    const sql=`UPDATE content_files SET display_name=?1,licence=?2,year=?3,semester=?4,track=?5,subject_id=?6,subject_name=?7,subject_ar=?8,subject_abbr=?9,category=?10,category_name=?11,category_ar=?12,group_name=?13,group_title=?14,topic=?15,source_university=?16,source_institution=?17,source_instructor=?18,source_basis=?19,status=?20,updated_at=CURRENT_TIMESTAMP WHERE id=?21`;
    await context.env.CATALOG_DB.prepare(sql).bind(meta.displayName,meta.licence,meta.year,meta.semester,meta.track,meta.subjectId,meta.subjectName,meta.subjectAr,meta.subjectAbbr,meta.category,meta.categoryName,meta.categoryAr,meta.group,meta.groupTitle,meta.topic,meta.sourceUniversity,meta.sourceInstitution,meta.sourceInstructor,meta.sourceBasis,meta.status,id).run();const fresh=await context.env.CATALOG_DB.prepare('SELECT * FROM content_files WHERE id=?1').bind(id).first();return json({ok:true,item:rowToAdmin(fresh)});
  }
  return json({error:'Method not allowed'},405);
}
