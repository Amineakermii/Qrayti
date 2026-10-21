const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const categories=[['cours','Cours'],['td','TD'],['tp','TP'],['exam','Examens'],['resume','Résumés'],['qcm','QCM'],['extra','Fichiers']];
const size=value=>Number(value)>=1048576?(Number(value)/1048576).toFixed(1)+' MB':Math.ceil(Number(value)/1024)+' KB';

// The host owns memory for this signed-in session. Credentials never enter it.
export function mountTeachers({root,request,language='en',notice=()=>{},catalog=[],memory={}}){
  const t=(ar,en)=>language==='ar'?ar:en;
  memory.drafts??={};memory.invite??={};memory.filter??={status:'pending',teacherId:''};memory.busy??=new Set();
  let alive=true,teacherSequence=0,listSequence=0,detailSequence=0,teachers=[],items=[],pendingCount=0,detail=null,invitation='',error='',loading=true,teachersLoading=true;
  const $=selector=>root.querySelector(selector);
  const safeId=id=>encodeURIComponent(id);
  const date=value=>value?new Intl.DateTimeFormat(language==='ar'?'ar-TN':'en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';
  const button=(action,label,attrs='')=>`<button type="button" data-teacher-action="${action}" ${attrs}>${label}</button>`;
  const labelStatus=value=>({pending:t('قيد المراجعة','Pending'),approved:t('منشور','Approved'),rejected:t('مرفوض','Rejected'),active:t('مفعّل','Active'),revoked:t('ملغى','Revoked'),expired:t('منتهي الصلاحية','Expired')}[value]||value);
  const badge=value=>`<span class="status ${value==='approved'||value==='active'?'good':value==='pending'?'draft':''}">${escape(labelStatus(value))}</span>`;
  const field=(label,name,value,attributes='')=>`<label><span>${label}</span><input name="${name}" value="${escape(value)}" ${attributes}></label>`;
  const select=(label,name,choices,value)=>`<label><span>${label}</span><select name="${name}">${choices.map(([id,text])=>`<option value="${escape(id)}" ${String(value)===String(id)?'selected':''}>${escape(text)}</option>`).join('')}</select></label>`;
  const optionsFor=name=>[...new Set(catalog.map(item=>item[name]).filter(Boolean))];
  const dataList=(id,values)=>`<datalist id="${id}">${values.map(value=>`<option value="${escape(value)}"></option>`).join('')}</datalist>`;
  function showError(message){if(!alive)return;error=message;const box=$('[data-teacher-error]');if(box){box.textContent=message;box.hidden=false;box.focus({preventScroll:true});}notice(message,true);}
  function clearError(){error='';const box=$('[data-teacher-error]');if(box){box.hidden=true;box.textContent='';}}
  const send=(path,body)=>request(path,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  function draftFor(item){
    if(!memory.drafts[item.id])memory.drafts[item.id]={version:item.version,values:{...item.meta,displayName:item.displayName,sourceInstructor:item.meta?.sourceInstructor||item.teacherName||'',sourceUniversity:item.meta?.sourceUniversity||item.university||'',sourceInstitution:item.meta?.sourceInstitution||item.institution||'',reason:''}};
    return memory.drafts[item.id];
  }
  function inviteHTML(){
    const v=memory.invite;
    return `<section class="card teacher-invitations"><h2>${t('دعوة أستاذ','Invite a teacher')}</h2><p class="hint">${t('تحقّق من هوية الأستاذ ثم ابعث الرابط شخصيًا. لا نرسل إيميلات ولا نتحقّق آليًا من الانتماء الجامعي.','Verify the teacher’s identity, then send the link privately. No automatic email delivery or verification of academic affiliation.')}</p><form id="teacherInviteForm" class="form-grid">${field(t('اسم الأستاذ','Teacher name'),'name',v.name,'required maxlength="120" autocomplete="off"')}${field(t('إيميل التواصل (خاص)','Contact email (private)'),'email',v.email,'required type="email" maxlength="254" autocomplete="off"')}${field(t('الجامعة التونسية','Tunisian university'),'university',v.university,'required maxlength="200" list="teacherUniversities"')}${field(t('الكلية أو المعهد','Faculty or institute'),'institution',v.institution,'required maxlength="200" list="teacherInstitutions"')}<p class="hint wide">${t('اختار من الاقتراحات أو اكتب مؤسسة تونسية أخرى. الرابط صالح 90 يومًا.','Choose a suggestion or enter another Tunisian institution. Invitations expire after 90 days.')}</p><div class="wide">${button('create',t('إنشاء رابط شخصي','Create personal invitation'),`class="primary" ${memory.busy.has('invite')?'disabled':''}`)}</div></form>${dataList('teacherUniversities',optionsFor('sourceUniversity'))}${dataList('teacherInstitutions',optionsFor('sourceInstitution'))}${invitation?`<aside class="teacher-secret"><h3>${t('انسخ الرابط الآن','Copy the link now')}</h3><p>${t('رابط سري: من يملكه ينجم يدخل باسم الأستاذ. يظهر مرة واحدة فقط. ابعثه في رسالة خاصة.','Secret link: anyone holding it can sign in as this teacher. It is shown only once. Send it privately.')}</p><label>${t('رابط الدعوة الشخصي','Personal invitation link')}<input id="teacherInvitationLink" readonly dir="ltr" autocomplete="off" value="${escape(invitation)}"></label><div class="actions">${button('copy',t('نسخ الرابط','Copy link'))}${button('dismiss-link',t('إخفاء الرابط','Dismiss link'))}</div></aside>`:''}</section>`;
  }
  function teachersHTML(){
    return `<section class="card"><h2>${t('وصول الأساتذة','Teacher access')}</h2><p class="hint">${t('تجديد الرابط أو إلغاء الوصول يوقف الرابط القديم وكل جلسات الأستاذ فورًا.','Rotating or revoking access immediately invalidates the old link and all of that teacher’s sessions.')}</p>${teachersLoading?`<p role="status">${t('تحميل الأساتذة…','Loading teachers…')}</p>`:teachers.length?`<div class="teacher-access-list">${teachers.map(teacher=>{const status=teacher.status==='active'&&new Date(teacher.expiresAt)<new Date()?'expired':teacher.status;return `<article class="teacher-access"><div><h3>${escape(teacher.name)}</h3>${badge(status)}<p>${escape(teacher.university)} · ${escape(teacher.institution)}</p><p class="hint">${escape(teacher.email)}</p><small>${t('أنشئت','Created')} ${escape(date(teacher.createdAt))} · ${t('تنتهي','Expires')} ${escape(date(teacher.expiresAt))}</small></div><div class="actions">${button('rotate',t('تجديد الرابط','Rotate link'),`data-id="${escape(teacher.id)}" ${memory.busy.has('teacher:'+teacher.id)?'disabled':''}`)}${button('revoke',t('إلغاء الوصول','Revoke access'),`data-id="${escape(teacher.id)}" class="teacher-danger" ${teacher.status==='revoked'||memory.busy.has('teacher:'+teacher.id)?'disabled':''}`)}</div></article>`;}).join('')}</div>`:`<p class="empty">${t('لم تتم دعوة أي أستاذ بعد.','No teachers invited yet.')}</p>`}</section>`;
  }
  function queueHTML(){
    return `<section class="card"><div class="teacher-section-head"><h2>${t('مراجعة الملفات','Submission review')} <span class="status draft" aria-label="${t('عدد الملفات قيد المراجعة','Pending submissions')}">${pendingCount}</span></h2>${button('refresh',t('تحديث','Refresh'))}</div><div class="teacher-filters">${select(t('حالة الملف','Submission status'),'status',[['pending',t('قيد المراجعة','Pending')],['approved',t('منشور','Approved')],['rejected',t('مرفوض','Rejected')],['all',t('كل الحالات','All statuses')]],memory.filter.status)}${select(t('الأستاذ','Teacher'),'teacherId',[['',t('كل الأساتذة','All teachers')],...teachers.map(x=>[x.id,x.name])],memory.filter.teacherId)}</div>${loading?`<p role="status">${t('تحميل الملفات…','Loading submissions…')}</p>`:items.length?`<div class="teacher-submissions">${items.map(item=>`<article class="teacher-submission ${memory.selected===item.id?'selected':''}"><div><h3>${escape(item.displayName)}</h3>${badge(item.status)}<p>${escape(item.teacherName||teachers.find(x=>x.id===item.teacherId)?.name)} · ${escape(item.institution||item.meta?.sourceInstitution)}</p><p class="hint">${escape(item.meta?.subjectName)} · ${escape(item.meta?.licence)} / ${escape(item.meta?.year)} / S${escape(item.meta?.semester)} · ${escape(item.meta?.category)}</p><small>${escape(item.mime)} · ${size(item.size)} · ${escape(date(item.createdAt))}</small></div>${button('review',t('فتح المراجعة','Review'),`data-id="${escape(item.id)}" aria-pressed="${memory.selected===item.id}"`)}</article>`).join('')}</div>`:`<p class="empty">${t('لا توجد ملفات بهذه الفلاتر.','No submissions match these filters.')}</p>`}</section>`;
  }
  function reviewHTML(){
    if(!memory.selected)return `<section class="card teacher-review"><h2>${t('اختار ملف للمراجعة','Select a submission')}</h2><p>${t('نزّل الملف وراجع الحقوق والمحتوى قبل اتخاذ القرار.','Download the file and review its content and sharing rights before deciding.')}</p></section>`;
    if(!detail)return `<section class="card teacher-review" aria-busy="true"><p role="status">${t('تحميل المراجعة…','Loading review…')}</p></section>`;
    const item=detail,draft=draftFor(item),v=draft.values,stale=draft.version!==item.version,closed=item.status!=='pending',busy=memory.busy.has('review:'+item.id),disabled=closed||stale||busy;
    const choices=[...new Map(catalog.filter(x=>String(x.licence)===String(v.licence)&&String(x.year)===String(v.year)&&String(x.semester)===String(v.semester)&&String(x.track||'common')===String(v.track||'common')).filter(x=>x.subjectId).map(x=>[x.subjectId,x])).values()];
    return `<section class="card teacher-review"><div class="teacher-section-head"><h2>${t('تفاصيل المراجعة','Review details')}</h2>${badge(item.status)}</div><h3>${escape(item.displayName)}</h3><p>${escape(item.teacherName)} · ${escape(item.university)} · ${escape(item.institution)}</p><p class="hint">${escape(item.originalName)} · ${escape(item.mime)} · ${size(item.size)}</p><a class="teacher-download" href="/api/admin/teacher-submissions/${safeId(item.id)}/file" download rel="noreferrer">${t('تنزيل الملف للمراجعة','Download for review')} ↓</a><p class="hint">${t('فحوص نوع الملف لا تعني أنه خالٍ من البرمجيات الضارة. راجع الملف وحق نشره.','Format checks are not a malware scan. Review the file and permission to share it.')}</p>${item.processing?`<p class="teacher-warning">${t('النشر قيد المعالجة أو يحتاج إعادة المحاولة. أعد الموافقة لاستكمال نفس النشر.','Publication is processing or needs recovery. Retry approval to resume the same publication.')}</p>`:''}${stale&&!closed?`<p class="teacher-warning">${t('تغيّرت المراجعة. تعديلاتك محفوظة هنا؛ حمّل آخر نسخة قبل اتخاذ القرار.','This review changed. Your edits are preserved here; load the latest version before deciding.')}${button('reload-review',t('تحميل آخر نسخة','Load latest review'))}</p>`:''}${closed?`<p class="teacher-result">${t('تمت المراجعة','Reviewed')} ${escape(date(item.reviewedAt))}${item.reviewedBy?' · '+escape(item.reviewedBy):''}${item.publishedFileId?' · '+t('الملف منشور في الكاتالوغ.','The course is published in the catalog.'):''}</p>${item.feedback?`<p>${t('تعليق للأستاذ:','Feedback to teacher:')} ${escape(item.feedback)}</p>`:''}`:''}<form id="teacherReviewForm" class="form-grid"><fieldset class="teacher-fields" ${disabled||item.processing?'disabled':''}>${field(t('عنوان الكور النهائي','Final course title'),'displayName',v.displayName,'required maxlength="200"')}${select(t('الإجازة','Licence'),'licence',[['info','Sciences de l’Informatique'],['lt','LT'],['lce','LCE']],v.licence)}${select(t('السنة','Year'),'year',[[1,'1'],[2,'2'],[3,'3'],[4,'4']],v.year)}${select(t('السداسي','Semester'),'semester',[[1,'S1'],[2,'S2']],v.semester)}${select(t('الشعبة','Track'),'track',[['common',t('جذع مشترك','Common')],['genie','Génie Logiciel'],['multimedia','Multimédia']],v.track)}${select(t('القسم','Category'),'category',categories,v.category)}<label class="wide"><span>${t('مادة موجودة (اختياري)','Existing subject (optional)')}</span><select name="existingSubject"><option value="">${t('اختار مادة أو حدّد مادة جديدة أسفل','Choose a subject or finalize a new one below')}</option>${choices.map(x=>`<option value="${escape(x.subjectId)}">${escape(x.subjectName)}</option>`).join('')}</select></label>${field(t('معرّف المادة النهائي','Final subject ID'),'subjectId',v.subjectId,'required maxlength="90" pattern="(?:[A-Za-z0-9_]|-){1,90}" aria-describedby="teacherSubjectHint"')}${field(t('اسم المادة النهائي','Final subject name'),'subjectName',v.subjectName,'required maxlength="200"')}<p id="teacherSubjectHint" class="hint wide">${t('المادة المقترحة تحتاج معرّفًا نهائيًا: حروف لاتينية وأرقام و _ أو -.','A proposed subject needs a final ID: Latin letters, numbers, underscores or hyphens.')}</p>${field(t('المجموعة / الشابتر','Group / chapter'),'group',v.group,'maxlength="200"')}${field(t('جامعة المصدر','Source university'),'sourceUniversity',v.sourceUniversity,'required maxlength="200"')}${field(t('مؤسسة المصدر','Source institution'),'sourceInstitution',v.sourceInstitution,'required maxlength="200"')}${field(t('الأستاذ صاحب المحتوى','Source instructor'),'sourceInstructor',v.sourceInstructor,'required maxlength="120"')}<label class="wide"><span>${t('سبب الرفض (يظهر للأستاذ)','Rejection reason (visible to teacher)')}</span><textarea name="reason" maxlength="2000" rows="3">${escape(v.reason)}</textarea></label></fieldset>${!closed?`<p class="teacher-warning wide">${t('الموافقة تنشر هذا الكور مباشرة للطلبة. ليست جزءًا من مسودة الموقع أو زر نشر الموقع.','Approval publishes this course to students immediately. It is separate from the website draft and Publish website button.')}</p><div class="actions wide">${button('approve',item.processing?t('إعادة محاولة النشر','Retry publication'):t('الموافقة والنشر','Approve & publish'),`class="primary" ${disabled?'disabled':''}`)}${button('reject',t('رفض مع تعليق','Reject with feedback'),`class="teacher-danger" ${disabled||item.processing?'disabled':''}`)}</div>`:''}</form></section>`;
  }
  function render(){
    if(!alive)return;
    const active=root.contains(document.activeElement)?document.activeElement:null;
    const focus=active?.name?{form:active.form?.id,name:active.name,start:active.selectionStart,end:active.selectionEnd}:null;
    root.innerHTML=`<div class="teacher-workspace"><div class="page-head"><div><span class="eyebrow">QRAYTI / ADMIN V2</span><h1>${t('الأساتذة','Teachers')}</h1><p>${t('دعوات شخصية وملفات خاصة حتى توافق على نشرها.','Personal invitations and private submissions until you approve publication.')}</p></div></div><div data-teacher-error class="teacher-error" role="alert" tabindex="-1" ${error?'':'hidden'}>${escape(error)}</div><div class="teacher-layout"><div>${queueHTML()}${reviewHTML()}</div><div>${inviteHTML()}${teachersHTML()}</div></div></div>`;
    if(focus){const input=focus.form?$('#'+focus.form)?.elements.namedItem(focus.name):root.querySelector('[name="'+focus.name+'"]');if(input&&!input.disabled){input.focus({preventScroll:true});if(focus.start!==null&&input.setSelectionRange)try{input.setSelectionRange(focus.start,focus.end);}catch{}}}
  }
  async function loadTeachers(){
    const sequence=++teacherSequence;
    try{const data=await request('/api/admin/teachers');if(!alive||sequence!==teacherSequence)return;teachers=data.teachers||[];pendingCount=data.pendingCount??pendingCount;teachersLoading=false;render();}catch(e){if(alive&&sequence===teacherSequence){teachersLoading=false;render();showError(e.status===401?t('انتهت جلسة الإدارة. ادخل من جديد؛ تعديلاتك محفوظة في هذه الصفحة.','Admin session expired. Sign in again; your edits remain in this page.'):e.message);}}
  }
  async function loadList(){
    const sequence=++listSequence;loading=true;render();
    const query=new URLSearchParams();if(memory.filter.status!=='all')query.set('status',memory.filter.status);if(memory.filter.teacherId)query.set('teacherId',memory.filter.teacherId);
    try{const data=await request('/api/admin/teacher-submissions?'+query);if(!alive||sequence!==listSequence)return;items=data.items||[];pendingCount=data.pendingCount??pendingCount;loading=false;render();}catch(e){if(alive&&sequence===listSequence){loading=false;items=[];render();showError(e.message);}}
  }
  async function loadDetail(id,{reset=false}={}){
    if(memory.selected!==id)return;
    const sequence=++detailSequence;
    try{const data=await request('/api/admin/teacher-submissions/'+safeId(id));if(!alive||sequence!==detailSequence||memory.selected!==id)return;if(reset)delete memory.drafts[id];detail=data.item;render();}catch(e){if(alive&&sequence===detailSequence)showError(e.message);}
  }
  function capture(event){
    const element=event.target;
    if(element.closest('#teacherInviteForm'))memory.invite[element.name]=element.value;
    if(element.closest('#teacherReviewForm')&&detail){const draft=draftFor(detail);draft.values[element.name]=element.value;}
  }
  async function mutate(key,operation){
    if(memory.busy.has(key))return;
    memory.busy.add(key);clearError();render();
    try{await operation();}catch(e){if(alive)showError(e.message);}finally{memory.busy.delete(key);if(alive)render();else memory.refresh?.();}
  }
  async function decide(action){
    if(!detail||detail.status!=='pending')return;
    const item=detail,draft=draftFor(item);if(draft.version!==item.version)return;
    const values={...draft.values};delete values.existingSubject;delete values.reason;
    if(action==='reject'&&!draft.values.reason?.trim()){showError(t('سبب الرفض مطلوب ويظهر للأستاذ.','A rejection reason is required and will be visible to the teacher.'));return;}
    if(action==='approve'){
      if(!/^[a-zA-Z0-9_-]{1,90}$/.test(values.subjectId||'')){showError(t('حدّد معرّف المادة النهائي قبل النشر.','Choose a valid final subject ID before publishing.'));$('#teacherReviewForm [name="subjectId"]')?.focus();return;}
      if(!$('#teacherReviewForm').reportValidity())return;
      if(!confirm(t('الموافقة تنشر هذا الكور مباشرة للطلبة. تأكدت من المحتوى وحق نشره؟','Approve and publish this course to students now? Confirm that you reviewed the content and sharing rights.')))return;
    }
    await mutate('review:'+item.id,async()=>{
      try{
        const data=await send('/api/admin/teacher-submissions/'+safeId(item.id),{version:draft.version,action,...(action==='approve'?{meta:{...values,year:Number(values.year),semester:Number(values.semester)}}:{reason:draft.values.reason.trim()})});
        delete memory.drafts[item.id];
        if(!alive)return;
        if(memory.selected===item.id){detailSequence++;detail=data.item;}
        notice(action==='approve'?t('تم نشر الكور.','Course published.'):t('تم رفض الملف وإرسال التعليق للأستاذ في مساحته.','Submission rejected. Feedback is visible in the teacher workspace.'));
        await loadList();
      }catch(e){
        if(!alive||memory.selected!==item.id)return;
        if(e.status===409){await loadDetail(item.id);showError(t('تغيّرت المراجعة. تعديلاتك محفوظة؛ حمّل آخر نسخة قبل اتخاذ قرار آخر.','This review changed. Your edits are preserved; load the latest review before another decision.'));}
        else if(e.status===503){await loadDetail(item.id);showError(t('لم يتم تأكيد النشر. تعديلاتك محفوظة؛ أعد محاولة النشر لاستكمال العملية.','Publication was not confirmed. Your edits are preserved; retry publication to resume.'));}
        else showError(e.status===401?t('انتهت جلسة الإدارة. ادخل من جديد. تعديلاتك محفوظة.','Admin session expired. Sign in again. Your edits are preserved.'):e.message);
      }
    });
  }
  async function click(event){
    const control=event.target.closest('[data-teacher-action]');if(!control||!root.contains(control)||control.disabled)return;
    const action=control.dataset.teacherAction,id=control.dataset.id;
    if(action==='review'){clearError();memory.selected=id;detail=null;render();await loadDetail(id);return;}
    if(action==='refresh'){clearError();await Promise.all([loadTeachers(),loadList()]);return;}
    if(action==='reload-review'){clearError();await loadDetail(memory.selected,{reset:true});return;}
    if(action==='dismiss-link'){invitation='';render();return;}
    if(action==='copy'){try{await navigator.clipboard.writeText(invitation);if(alive)notice(t('تم نسخ الرابط. ابعثه بشكل خاص.','Link copied. Share it privately.'));}catch{showError(t('تعذّر النسخ. اختار الرابط وانسخه يدويًا.','Could not copy. Select the link and copy it manually.'));$('#teacherInvitationLink')?.select();}return;}
    if(action==='create'){
      if(!$('#teacherInviteForm').reportValidity())return;
      await mutate('invite',async()=>{const data=await request('/api/admin/teachers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(memory.invite)});memory.invite={};if(!alive)return;invitation=data.invitationUrl;await loadTeachers();$('#teacherInvitationLink')?.focus();});return;
    }
    if(action==='rotate'||action==='revoke'){
      const teacher=teachers.find(x=>x.id===id);if(!teacher)return;
      if(!confirm(action==='revoke'?t(`إلغاء وصول ${teacher.name}؟ الرابط وكل جلساته تتوقف فورًا.`,`Revoke access for ${teacher.name}? Their link and all sessions stop immediately.`):t(`تجديد رابط ${teacher.name}؟ الرابط القديم وكل جلساته تتوقف فورًا.`,`Rotate the link for ${teacher.name}? Their old link and all sessions stop immediately.`)))return;
      await mutate('teacher:'+id,async()=>{const data=await send('/api/admin/teachers/'+safeId(id),{action});if(!alive)return;invitation=action==='rotate'?data.invitationUrl:'';await loadTeachers();notice(action==='revoke'?t('تم إلغاء الوصول.','Access revoked.'):t('الرابط الجديد جاهز. انسخه الآن.','New invitation ready. Copy it now.'));});return;
    }
    if(action==='approve'||action==='reject')await decide(action);
  }
  function change(event){
    capture(event);const element=event.target;
    if(element.closest('.teacher-filters')){memory.filter[element.name]=element.value;memory.selected=null;detail=null;detailSequence++;clearError();loadList();}
    if(element.closest('#teacherReviewForm')&&element.name==='existingSubject'&&detail){const item=catalog.find(x=>x.subjectId===element.value&&String(x.licence)===String(draftFor(detail).values.licence)&&String(x.year)===String(draftFor(detail).values.year)&&String(x.semester)===String(draftFor(detail).values.semester)&&String(x.track||'common')===String(draftFor(detail).values.track||'common'));if(item){Object.assign(draftFor(detail).values,{subjectId:item.subjectId,subjectName:item.subjectName});render();}}
    else if(element.closest('#teacherReviewForm')&&['licence','year','semester','track'].includes(element.name))render();
  }
  const submit=event=>{event.preventDefault();if(event.target.id==='teacherInviteForm')$('[data-teacher-action="create"]')?.click();};
  root.addEventListener('input',capture);root.addEventListener('change',change);root.addEventListener('click',click);root.addEventListener('submit',submit);
  const refresh=()=>{loadTeachers();loadList();if(memory.selected)loadDetail(memory.selected);};memory.refresh=refresh;
  render();refresh();
  return ()=>{alive=false;teacherSequence++;listSequence++;detailSequence++;invitation='';root.replaceChildren();if(memory.refresh===refresh)delete memory.refresh;root.removeEventListener('input',capture);root.removeEventListener('change',change);root.removeEventListener('click',click);root.removeEventListener('submit',submit);};
}
