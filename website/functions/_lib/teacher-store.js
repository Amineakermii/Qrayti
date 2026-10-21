import {clean,normalizeMeta} from './common.js';
import {limits,fail,now} from './teacher-auth.js';
import {fileType} from './teacher-files.js';
export function validateMeta(raw={},final=false){
  if(!['info','lt','lce'].includes(raw.licence)||![1,2,3,4].includes(Number(raw.year))||![1,2].includes(Number(raw.semester))||!['cours','td','tp','exam','resume','qcm','extra'].includes(raw.category))fail('Choose a valid licence, year, semester and course category.');
  const m=normalizeMeta(raw);if(!m.displayName||!m.subjectName)fail('Course title and subject are required.');
  if((final&&!m.subjectId)||(m.subjectId&&!/^[a-zA-Z0-9_-]{1,90}$/.test(m.subjectId)))fail('Choose or create a valid subject ID.');
  if(!/^[a-zA-Z0-9_-]{1,40}$/.test(m.track))fail('Invalid track.');return m;
}
export function submissionView(r){return {id:r.id,teacherId:r.teacher_id,teacherName:r.teacher_name,university:r.university,institution:r.institution,displayName:JSON.parse(r.final_meta||r.meta_json).displayName,originalName:r.original_name,mime:r.mime,size:r.size,meta:JSON.parse(r.final_meta||r.meta_json),status:r.status==='publishing'?'pending':r.status,processing:r.status==='publishing',version:r.version,createdAt:r.created_at,reviewedAt:r.reviewed_at,feedback:r.feedback,publishedFileId:r.published_file_id};}
export const selectSubmission=`SELECT s.*,t.name teacher_name,t.university,t.institution FROM teacher_submissions s JOIN teachers t ON t.id=s.teacher_id`;
export async function usage(db,id){const time=now(),day=new Date(time).toISOString().slice(0,10);const r=await db.prepare(`SELECT COALESCE(SUM(CASE WHEN day=? THEN 1 ELSE 0 END),0) dailyFiles,COALESCE(SUM(CASE WHEN day=? THEN size ELSE 0 END),0) dailyBytes,COALESCE(SUM(CASE WHEN status!='approved' THEN size ELSE 0 END),0) outstandingBytes FROM teacher_submissions WHERE teacher_id=? AND (status IN ('pending','publishing','approved','rejected') OR (status IN ('reserved','receiving') AND expires_at>?))`).bind(day,day,id,time).first();return r;}
export async function reserve(c,t,b){
  const db=c.env.CATALOG_DB,time=now(),day=new Date(time).toISOString().slice(0,10),id=crypto.randomUUID(),filename=clean(b.filename,180),size=Number(b.declaredSize),requestId=clean(b.requestId,80);
  if(!/^[a-zA-Z0-9_-]{16,80}$/.test(requestId))fail('Invalid upload request ID.');if(!filename||/[\\/]/.test(filename))fail('Invalid filename.');fileType(filename);
  if(!Number.isSafeInteger(size)||size<1)fail('Choose a nonempty file.');if(size>limits.fileBytes)fail('Maximum file size is 25 MiB.',413);if(b.rightsConfirmed!==true)fail('Confirm that you have permission to publish these files.');
  const meta=validateMeta(b.meta);meta.sourceInstructor=t.name;meta.sourceUniversity=t.university;meta.sourceInstitution=t.institution;meta.sourceBasis='teacher';meta.status='draft';meta.rightsConfirmed=true;
  // Expired attempts use independent random keys, so a delayed writer cannot corrupt a retry.
  const expired=await db.prepare("SELECT id,r2_key FROM teacher_submissions WHERE teacher_id=? AND (status='failed' OR (status IN ('reserved','receiving') AND expires_at<?)) LIMIT 30").bind(t.id,time).all();
  for(const row of expired.results){await c.env.TEACHER_UPLOADS.delete(row.r2_key);await db.prepare("DELETE FROM teacher_submissions WHERE id=? AND (status='failed' OR (status IN ('reserved','receiving') AND expires_at<?))").bind(row.id,time).run();}
  const existing=await db.prepare('SELECT id,status FROM teacher_submissions WHERE teacher_id=? AND request_id=?').bind(t.id,requestId).first();if(existing)return {created:false,...existing,status:existing.status==='receiving'?'reserved':existing.status==='publishing'?'pending':existing.status};
  // Separate attempt window survives failed-file cleanup and invitation rotation.
  const attempt=await db.prepare(`INSERT INTO teacher_upload_limits(teacher_id,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(teacher_id) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END WHERE expires_at<=? OR attempts<60 RETURNING expires_at`).bind(t.id,time+3600000,time,time,time).first();
  if(!attempt){const window=await db.prepare('SELECT expires_at FROM teacher_upload_limits WHERE teacher_id=?').bind(t.id).first();fail('Too many upload attempts. Please try again after the hourly reset.',429,{retryAt:new Date(window?.expires_at||time+3600000).toISOString()});}
  const sql=`INSERT INTO teacher_submissions(id,teacher_id,request_id,original_name,size,meta_json,rights_at,r2_key,status,generation,day,expires_at,created_at)
    SELECT ?,?,?,?,?,?,?,?,'reserved',?,?,?,? WHERE EXISTS(SELECT 1 FROM teachers WHERE id=? AND status='active' AND generation=? AND expires_at>?)
    AND (SELECT COUNT(*) FROM teacher_submissions WHERE teacher_id=? AND day=? AND (status IN ('pending','publishing','approved','rejected') OR(status IN ('reserved','receiving') AND expires_at>?)))<20
    AND (SELECT COALESCE(SUM(size),0) FROM teacher_submissions WHERE teacher_id=? AND day=? AND (status IN ('pending','publishing','approved','rejected') OR(status IN ('reserved','receiving') AND expires_at>?)))+?<=?
    AND (SELECT COALESCE(SUM(size),0) FROM teacher_submissions WHERE teacher_id=? AND (status IN ('pending','publishing','rejected') OR(status IN ('reserved','receiving') AND expires_at>?)))+?<=?
    ON CONFLICT(teacher_id,request_id) DO NOTHING RETURNING id,status`;
  const row=await db.prepare(sql).bind(id,t.id,requestId,filename,size,JSON.stringify(meta),new Date(time).toISOString(),'submissions/'+id,t.generation,day,time+3600000,new Date(time).toISOString(),t.id,t.generation,time,t.id,day,time,t.id,day,time,size,limits.dailyBytes,t.id,time,size,limits.outstandingBytes).first();
  if(!row){const duplicate=await db.prepare('SELECT id,status FROM teacher_submissions WHERE teacher_id=? AND request_id=?').bind(t.id,requestId).first();if(duplicate)return {created:false,...duplicate};fail('Upload limit reached. Please contact the owner or try after the daily reset.',429,{retryAt:new Date(new Date(day).getTime()+86400000).toISOString()});}
  return {created:true,...row};
}
