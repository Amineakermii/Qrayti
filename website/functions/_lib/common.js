export function json(data,status=200,headers={}){
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
}
export function text(value,status=200,headers={}){return new Response(value,{status,headers});}
export function clean(value,max=240){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
export function safeInt(value,min,max,fallback){const n=Number(value);return Number.isInteger(n)&&n>=min&&n<=max?n:fallback}
export function fileExt(name){const m=String(name||'').toLowerCase().match(/\.([a-z0-9]{1,12})$/);return m?m[1]:''}
export function fileKind(name,mime=''){
  const ext=fileExt(name),m=String(mime||'').toLowerCase();
  if(ext==='pdf'||m.includes('pdf'))return 'pdf';
  if(['png','jpg','jpeg','webp','gif','bmp','svg'].includes(ext)||m.startsWith('image/'))return 'image';
  if(['txt','md','csv','json','xml','log'].includes(ext)||m.startsWith('text/'))return 'text';
  if(['mp3','wav','ogg','m4a','aac','flac'].includes(ext)||m.startsWith('audio/'))return 'audio';
  if(['doc','docx','odt','ppt','pptx','pps','ppsx','xls','xlsx'].includes(ext))return 'doc';
  if(['pkt','pka'].includes(ext))return 'packet';
  if(['zip','rar','7z','tar','gz'].includes(ext))return 'archive';
  return 'other';
}
export function sizeText(bytes){const n=Number(bytes)||0;if(n<1024)return `${n} B`;if(n<1024**2)return `${(n/1024).toFixed(1)} KB`;return `${(n/1024**2).toFixed(1)} MB`}
export function safeFilename(name){return clean(name,180).replace(/[\\/\r\n"]/g,'_')||'file'}
export function categoryMeta(id){
  const m={cours:['Cours','دروس'],td:['TD','أعمال موجهة'],tp:['TP','أعمال تطبيقية'],qcm:['QCM','أسئلة اختيار متعدد'],resume:['Résumés','ملخصات'],exam:['Examens','فروض وامتحانات'],extra:['Fichiers','ملفات إضافية']};
  const x=m[id]||m.extra;return {name:x[0],ar:x[1]};
}
export function normalizeMeta(input={}){
  const category=['cours','td','tp','qcm','resume','exam','extra'].includes(input.category)?input.category:'extra';
  const cm=categoryMeta(category);
  return {
    licence:['info','lt','lce'].includes(input.licence)?input.licence:'info',
    year:safeInt(input.year,1,4,1),semester:safeInt(input.semester,1,2,1),track:clean(input.track||'common',40)||'common',
    subjectId:clean(input.subjectId,90),subjectName:clean(input.subjectName,180),subjectAr:clean(input.subjectAr,180),subjectAbbr:clean(input.subjectAbbr,30),
    category,categoryName:clean(input.categoryName||cm.name,80)||cm.name,categoryAr:clean(input.categoryAr||cm.ar,80)||cm.ar,
    group:clean(input.group||'ملفات إضافية',180)||'ملفات إضافية',groupTitle:clean(input.groupTitle,220),topic:clean(input.topic,220),displayName:clean(input.displayName,220),
    sourceUniversity:clean(input.sourceUniversity,180),sourceInstitution:clean(input.sourceInstitution,180),sourceInstructor:clean(input.sourceInstructor,180),sourceBasis:clean(input.sourceBasis||'admin',40)||'admin',
    rightsConfirmed:input.rightsConfirmed===true,
    status:['draft','published','hidden'].includes(input.status)?input.status:'draft'
  };
}
export function validateMeta(meta,requireRights=false){
  const errors=[];if(!meta.subjectId)errors.push('subjectId');if(!meta.subjectName)errors.push('subjectName');if(!meta.displayName)errors.push('displayName');if(!meta.group)errors.push('group');if(requireRights&&meta.rightsConfirmed!==true)errors.push('rightsConfirmed');return errors;
}
export function newId(){return `qf_${Date.now().toString(36)}_${crypto.randomUUID().replaceAll('-','').slice(0,10)}`}
