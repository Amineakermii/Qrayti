import {fileKind,sizeText} from './common.js';
export async function duplicateWarnings(db,meta,size,originalName){
  const q=`SELECT id,display_name,original_name,size,status FROM content_files
           WHERE size=?1 AND (lower(display_name)=lower(?2) OR lower(original_name)=lower(?3)) LIMIT 6`;
  const r=await db.prepare(q).bind(Number(size)||0,meta.displayName||'',originalName||'').all();return r.results||[];
}
export async function insertFile(db,{id,key,meta,originalName,mime,size,createdBy}){
  const kind=fileKind(originalName,mime);
  const sql=`INSERT INTO content_files (
    id,r2_key,original_name,display_name,licence,year,semester,track,subject_id,subject_name,subject_ar,subject_abbr,
    category,category_name,category_ar,group_name,group_title,topic,kind,mime,size,source_university,source_institution,source_instructor,source_basis,status,created_by
  ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?26,?27)`;
  await db.prepare(sql).bind(id,key,originalName,meta.displayName,meta.licence,meta.year,meta.semester,meta.track,meta.subjectId,meta.subjectName,meta.subjectAr,meta.subjectAbbr,meta.category,meta.categoryName,meta.categoryAr,meta.group,meta.groupTitle,meta.topic,kind,mime||'application/octet-stream',Number(size)||0,meta.sourceUniversity,meta.sourceInstitution,meta.sourceInstructor,meta.sourceBasis,meta.status,createdBy||'').run();
  return {id,kind,size:Number(size)||0,sizeText:sizeText(size),status:meta.status,r2Key:key};
}
export function rowToAdmin(r){return {id:r.id,displayName:r.display_name,originalName:r.original_name,licence:r.licence,year:r.year,semester:r.semester,track:r.track,subjectId:r.subject_id,subjectName:r.subject_name,subjectAr:r.subject_ar,subjectAbbr:r.subject_abbr,category:r.category,categoryName:r.category_name,categoryAr:r.category_ar,group:r.group_name,groupTitle:r.group_title,topic:r.topic,kind:r.kind,mime:r.mime,size:Number(r.size)||0,sizeText:sizeText(r.size),sourceUniversity:r.source_university,sourceInstitution:r.source_institution,sourceInstructor:r.source_instructor,sourceBasis:r.source_basis,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at,createdBy:r.created_by};}
