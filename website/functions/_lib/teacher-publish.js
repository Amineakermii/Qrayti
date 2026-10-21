import {clean,fileKind} from './common.js';
import {fail,now} from './teacher-auth.js';
import {selectSubmission,submissionView,validateMeta} from './teacher-store.js';
const get=(db,id)=>db.prepare(selectSubmission+' WHERE s.id=?').bind(id).first();
export async function reviewSubmission(c,id,b,reviewer){
  const db=c.env.CATALOG_DB;let row=await get(db,id);if(!row||!['pending','publishing','approved','rejected'].includes(row.status))fail('Submission not found.',404);
  if(!['approve','reject'].includes(b.action))fail('Choose approve or reject.');
  if(row.status==='approved'&&b.action==='approve')return submissionView(row);
  if(Number(b.version)!==row.version||['approved','rejected'].includes(row.status))fail('This submission changed. Reload its latest status.',409);
  const time=new Date().toISOString();
  if(b.action==='reject'){
    const reason=clean(b.reason,2000);if(!reason)fail('Explain why this submission was rejected.');
    const event=crypto.randomUUID();
    const result=await db.batch([
      db.prepare("UPDATE teacher_submissions SET status='rejected',feedback=?,reviewed_at=?,reviewer=?,version=version+1,lease=? WHERE id=? AND version=? AND status='pending'").bind(reason,time,reviewer,event,id,row.version),
      db.prepare("INSERT INTO teacher_review_events(id,submission_id,action,reviewer,created_at) SELECT ?,id,'reject',?,? FROM teacher_submissions WHERE id=? AND status='rejected' AND lease=?").bind(event,reviewer,time,id,event)
    ]);if(!result[0].meta.changes)fail('This submission is already being reviewed. Reload it.',409);return submissionView(await get(db,id));
  }
  if(!c.env.COURSE_FILES)fail('Published course storage is unavailable.',503);
  const lease=crypto.randomUUID();
  if(row.status==='pending'){
    const m=validateMeta({...JSON.parse(row.meta_json),...b.meta},true);
    // Only the owner may correct credits; teacher input never controls its identity.
    m.sourceInstructor=clean(b.meta?.sourceInstructor,180)||row.teacher_name;m.sourceUniversity=clean(b.meta?.sourceUniversity,180)||row.university;m.sourceInstitution=clean(b.meta?.sourceInstitution,180)||row.institution;m.sourceBasis='teacher';m.status='published';
    const claimed=await db.prepare("UPDATE teacher_submissions SET status='publishing',final_meta=?,published_file_id=?,reviewer=?,pub_lease=?,pub_until=? WHERE id=? AND status='pending' AND version=? RETURNING id").bind(JSON.stringify(m),'qf_teacher_'+id.replaceAll('-',''),reviewer,lease,now()+120000,id,row.version).first();
    if(!claimed)fail('Another review is running. Reload the submission.',409);
  }else{
    const claimed=await db.prepare("UPDATE teacher_submissions SET pub_lease=?,pub_until=? WHERE id=? AND status='publishing' AND pub_until<? RETURNING id").bind(lease,now()+120000,id,now()).first();
    if(!claimed)fail('Publication is already running. Refresh shortly.',409);
  }
  row=await get(db,id);const m=JSON.parse(row.final_meta),key='teacher-published/'+row.published_file_id+'.'+row.original_name.split('.').pop().toLowerCase();
  try{
    const object=await c.env.TEACHER_UPLOADS.get(row.r2_key);if(!object||object.size!==row.size)fail('Original file is unavailable. Contact the owner.',503);
    // Safe to repeat after a lost response: key and immutable approved metadata stay fixed.
    await c.env.COURSE_FILES.put(key,object.body,{httpMetadata:{contentType:row.mime,cacheControl:'private, no-store'},sha256:row.sha256});
    const record={id:row.published_file_id,r2_key:key,original_name:row.original_name,display_name:m.displayName,licence:m.licence,year:m.year,semester:m.semester,track:m.track,subject_id:m.subjectId,subject_name:m.subjectName,subject_ar:m.subjectAr,subject_abbr:m.subjectAbbr,category:m.category,category_name:m.categoryName,category_ar:m.categoryAr,group_name:m.group,group_title:m.groupTitle,topic:m.topic,kind:fileKind(row.original_name,row.mime),mime:row.mime,size:row.size,source_university:m.sourceUniversity,source_institution:m.sourceInstitution,source_instructor:m.sourceInstructor,source_basis:'teacher',status:'published',created_by:row.reviewer};
    const keys=Object.keys(record),result=await db.batch([
      db.prepare(`INSERT INTO content_files(${keys.join(',')}) SELECT ${keys.map(()=>'?').join(',')} WHERE EXISTS(SELECT 1 FROM teacher_submissions WHERE id=? AND status='publishing' AND pub_lease=?) ON CONFLICT(id) DO NOTHING`).bind(...Object.values(record),id,lease),
      db.prepare("UPDATE teacher_submissions SET status='approved',reviewed_at=?,version=version+1,pub_until=0 WHERE id=? AND status='publishing' AND pub_lease=? AND EXISTS(SELECT 1 FROM content_files WHERE id=teacher_submissions.published_file_id)").bind(time,id,lease),
      db.prepare("INSERT OR IGNORE INTO teacher_review_events(id,submission_id,action,reviewer,created_at) SELECT 'approve:'||id,id,'approve',reviewer,reviewed_at FROM teacher_submissions WHERE id=? AND status='approved'").bind(id)
    ]);
    const done=await get(db,id);if(!result[1].meta.changes&&done.status!=='approved')fail('Publication needs a retry. No course was announced as published.',409);return submissionView(done);
  }catch(e){await db.prepare("UPDATE teacher_submissions SET pub_until=0 WHERE id=? AND status='publishing' AND pub_lease=?").bind(id,lease).run().catch(()=>{});throw e;}
}
