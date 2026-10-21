import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
// Isolated real UI, with only the remote API boundary replaced. No live mutations.
const server=createServer(async(req,res)=>{
  if(req.url==='/') {res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/admin/v2.css"><link rel="stylesheet" href="/admin/teachers.css"></head><body><main id="view"></main></body></html>');return;}
  if(!/^\/admin\/(teachers\.js|teachers\.css|v2\.css)$/.test(req.url)){res.writeHead(404).end();return;}
  try{res.setHeader('Content-Type',req.url.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(new URL('../site'+req.url,import.meta.url)));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.env.CHROMIUM_PATH || undefined)});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function localIntegration(){
  const base='http://127.0.0.1:8791'; // Never accept a remote override for mutating tests.
  const admin=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  const uploader=await browser.newContext({serviceWorkers:'block'});
  const reader=await browser.newContext({serviceWorkers:'block'});
  const adminPage=await admin.newPage(),teacherPage=await uploader.newPage();
  const prefix='admin-ui-local-'+Date.now(),pdf='%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n';
  const runtimeErrors=[];adminPage.on('pageerror',e=>runtimeErrors.push(e.message));adminPage.on('dialog',d=>d.accept());
  try{
    await adminPage.goto(base+'/admin/v2');await adminPage.locator('[data-lang="en"]').click();
    await adminPage.locator('#loginForm [name="password"]').fill('local-admin-test-only');await adminPage.locator('#loginForm [type="submit"]').click();
    await adminPage.locator('#workspace:not([hidden])').waitFor();
    await adminPage.locator('#sidebar [data-nav="editor"]').click();
    await adminPage.locator('[data-bind="home.title"]').fill(prefix+' unsaved editor title');
    await adminPage.locator('#sidebar [data-nav="teachers"]').click();
    for(const [name,value] of Object.entries({name:prefix,email:prefix+'@example.test',university:'University of Jendouba',institution:'ISI Kef'}))await adminPage.locator('#teacherInviteForm [name="'+name+'"]').fill(value);
    await adminPage.locator('[data-teacher-action="create"]').click();
    await adminPage.locator('#teacherInvitationLink').waitFor();
    const invitation=await adminPage.locator('#teacherInvitationLink').inputValue();
    const token=new URLSearchParams(new URL(invitation).hash.slice(1)).get('invite');
    await teacherPage.goto(base+'/teachers/');
    const submission=await teacherPage.evaluate(async({token,title,pdf})=>{
      const api=async(path,method,body)=>{const response=await fetch(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(response.status+': '+data.error);return data;};
      await api('/api/teachers/session','POST',{token});
      const reserved=await api('/api/teachers/upload','POST',{filename:'review.pdf',declaredSize:new TextEncoder().encode(pdf).length,requestId:crypto.randomUUID(),rightsConfirmed:true,meta:{displayName:title,licence:'info',year:1,semester:1,track:'common',subjectId:'',subjectName:'UI proposed subject',category:'cours',group:'Chapter 1'}});
      const response=await fetch('/api/teachers/upload?id='+encodeURIComponent(reserved.id),{method:'PUT',body:pdf});const data=await response.json();if(!response.ok)throw Error(response.status+': '+data.error);return data.item;
    },{token,title:prefix,pdf});
    let catalog=await (await reader.request.get(base+'/api/catalog?licence=info&year=1&semester=1&track=common')).json();
    assert.equal(catalog.files.some(x=>x.displayName===prefix),false,'Unreviewed course is absent from public catalog');
    await adminPage.locator('[data-teacher-action="dismiss-link"]').click();
    await adminPage.locator('[data-teacher-action="refresh"]').click();
    await adminPage.locator('[data-teacher-action="review"][data-id="'+submission.id+'"]').click();
    await adminPage.locator('#teacherReviewForm [name="displayName"]').fill(prefix+' approved');
    await adminPage.locator('#teacherReviewForm [name="subjectId"]').fill('ui_verified_subject');
    await adminPage.locator('#teacherReviewForm [name="subjectName"]').fill('UI verified subject');
    await adminPage.locator('[data-theme-toggle]').click();
    await adminPage.locator('[data-lang="ar"]').click();
    await adminPage.locator('#teacherReviewForm').waitFor();
    assert.equal(await adminPage.locator('#teacherReviewForm [name="displayName"]').inputValue(),prefix+' approved');
    await adminPage.locator('[data-lang="en"]').click();await adminPage.locator('#teacherReviewForm').waitFor();
    await mkdir(new URL('../test-results/',import.meta.url),{recursive:true});
    await adminPage.screenshot({path:fileURLToPath(new URL('../test-results/teacher-admin-review-desktop.png',import.meta.url)),fullPage:true});
    await adminPage.locator('[data-teacher-action="approve"]').click();
    await adminPage.locator('.teacher-result').waitFor();
    catalog=await (await reader.request.get(base+'/api/catalog?licence=info&year=1&semester=1&track=common')).json();
    const published=catalog.files.find(x=>x.displayName===prefix+' approved');
    assert.ok(published,'Approved course appears in public catalog');assert.equal(published.subject,'ui_verified_subject');assert.equal(published.sourceInstructor,prefix);
    assert.equal(await (await reader.request.get(base+published.downloadUrl)).text(),pdf,'Published bytes match the private submission');
    await adminPage.locator('#sidebar [data-nav="editor"]').click();
    assert.equal(await adminPage.locator('[data-bind="home.title"]').inputValue(),prefix+' unsaved editor title','Review does not alter or save website editor draft');
    await adminPage.locator('#sidebar [data-nav="teachers"]').click();await adminPage.locator('#teacherReviewForm').waitFor();
    await adminPage.locator('[data-lang="ar"]').click();await adminPage.setViewportSize({width:390,height:844});
    await adminPage.locator('#teacherReviewForm').waitFor();
    await adminPage.waitForFunction(()=>document.querySelector('#sidebar').getBoundingClientRect().left>=innerWidth);
    assert.equal(await adminPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await adminPage.screenshot({path:fileURLToPath(new URL('../test-results/teacher-admin-review-phone-ar.png',import.meta.url)),fullPage:true});
    assert.deepEqual(runtimeErrors,[]);
    console.log('PASS: real local8791 admin invitation, teacher private upload, corrected UI approval, public catalog and identical bytes, unsaved website draft preservation, desktop/Arabic phone screenshots');
  }finally{await Promise.all([admin.close(),uploader.close(),reader.close()]);}
}
try{
  await page.goto('http://127.0.0.1:'+server.address().port);
  const mounted=await page.evaluate(async()=>{
    let module;try{module=await import('/admin/teachers.js');}catch{return false;}
    const teacher={id:'t1',name:'Teacher One',email:'one@example.test',university:'University of Jendouba',institution:'ISI Kef',status:'active',expiresAt:'2027-01-01T00:00:00Z',generation:1,createdAt:'2026-10-14T10:00:00Z'};
    const meta={licence:'info',year:1,semester:1,track:'common',subjectId:'',subjectName:'Proposed topic',category:'cours',group:'Chapter 1',sourceUniversity:teacher.university,sourceInstitution:teacher.institution,sourceInstructor:teacher.name};
    window.fixtures={teachers:[teacher],items:[1,2].map(n=>({id:'s'+n,teacherId:'t1',teacherName:'Teacher One',university:teacher.university,institution:teacher.institution,displayName:'Course '+n,originalName:'original.pdf',mime:'application/pdf',size:1234,meta:{...meta},status:'pending',version:1,createdAt:'2026-10-14T10:00:00Z',reviewedAt:null,feedback:'',publishedFileId:null,processing:false})),calls:[],delay:0,fail:0};
    window.memory={};window.notices=[];
    window.request=async(path,options={})=>{
      const f=window.fixtures,method=options.method||'GET',body=options.body?JSON.parse(options.body):null;
      f.calls.push({path,method,body});
      if(method==='GET'&&path==='/api/admin/teachers')return {teachers:structuredClone(f.teachers),pendingCount:f.items.filter(x=>x.status==='pending').length};
      if(method==='POST'){const created={...teacher,...body,id:'t2'};f.teachers.push(created);return {teacher:created,token:'TEST-SECRET',invitationUrl:location.origin+'/teachers/#invite=TEST-SECRET'};}
      if(path.startsWith('/api/admin/teachers/')&&method==='PATCH'){const item=f.teachers.find(x=>x.id===path.split('/').at(-1));if(body.action==='revoke')item.status='revoked';return {teacher:structuredClone(item),...(body.action==='rotate'?{token:'ROTATED-SECRET',invitationUrl:location.origin+'/teachers/#invite=ROTATED-SECRET'}:{})};}
      if(path.startsWith('/api/admin/teacher-submissions?')){const p=new URL(path,location.origin).searchParams;const items=structuredClone(f.items.filter(x=>(!p.get('status')||p.get('status')==='all'||x.status===p.get('status'))&&(!p.get('teacherId')||x.teacherId===p.get('teacherId'))));if(f.delay)await new Promise(r=>setTimeout(r,f.delay));return {items,pendingCount:f.items.filter(x=>x.status==='pending').length};}
      const item=f.items.find(x=>x.id===path.split('/').at(-1));
      if(method==='GET'){const snapshot=structuredClone(item);if(f.detailDelay?.[item.id])await new Promise(r=>setTimeout(r,f.detailDelay[item.id]));return {item:snapshot};}
      if(f.mutationDelay)await new Promise(r=>setTimeout(r,f.mutationDelay));
      if(f.fail){const status=f.fail;f.fail=0;if(status===409)item.version++;if(status===503)item.processing=true;throw Object.assign(new Error(status===409?'Review changed':'Publication copy failed'),{status});}
      if(body.action==='approve'){item.meta=body.meta;item.displayName=body.meta.displayName;item.status='approved';item.publishedFileId='published-'+item.id;}else{item.status='rejected';item.feedback=body.reason;}
      item.version++;item.reviewedAt='2026-10-14T11:00:00Z';return {item:structuredClone(item)};
    };
    window.remount=(language='en')=>{window.dispose?.();document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';window.dispose=module.mountTeachers({root:document.querySelector('#view'),request:window.request,language,notice:message=>window.notices.push(message),memory:window.memory,catalog:[{...meta,subjectId:'y1_asd',subjectName:'Algorithms'}]});};
    window.remount();return true;
  });
  assert.equal(mounted,true,'Teachers review workspace must mount');
  await page.locator('[data-teacher-action="review"]').first().waitFor();
  await page.locator('#teacherInviteForm [name="name"]').fill('Teacher Two');
  await page.locator('#teacherInviteForm [name="email"]').fill('two@example.test');
  await page.locator('#teacherInviteForm [name="university"]').fill('University of Tunis');
  await page.locator('#teacherInviteForm [name="institution"]').fill('Tunis Faculty');
  await page.locator('[data-teacher-action="create"]').click();
  await page.locator('#teacherInvitationLink').waitFor();
  assert.match(await page.locator('#teacherInvitationLink').inputValue(),/#invite=TEST-SECRET$/);
  await page.locator('[data-teacher-action="copy"]').click();
  assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/#invite=TEST-SECRET$/);
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage).includes('TEST-SECRET')),false);
  await page.evaluate(()=>window.remount());
  assert.equal(await page.locator('#teacherInvitationLink').count(),0,'Invite credentials disappear when leaving the view');
  await page.locator('[data-teacher-action="review"]').first().click();
  await page.locator('#teacherReviewForm [name="displayName"]').fill('Corrected course');
  await page.locator('[data-teacher-action="approve"]').click();
  assert.match(await page.locator('[data-teacher-error]').innerText(),/subject/i,'Proposed subjects require final catalog IDs');
  await page.locator('#teacherReviewForm [name="subjectId"]').fill('new_subject');
  await page.locator('#teacherReviewForm [name="subjectName"]').fill('New subject');
  await page.evaluate(()=>window.remount('ar'));
  await page.locator('#teacherReviewForm [name="displayName"]').waitFor();
  assert.equal(await page.locator('#teacherReviewForm [name="displayName"]').inputValue(),'Corrected course');
  await page.evaluate(()=>{document.documentElement.dataset.theme='dark';window.dispose();document.querySelector('#view').innerHTML='Another admin tab';window.remount();});
  await page.locator('#teacherReviewForm [name="subjectId"]').waitFor();
  assert.equal(await page.locator('#teacherReviewForm [name="subjectId"]').inputValue(),'new_subject');
  page.on('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>window.fixtures.fail=503);
  await page.locator('[data-teacher-action="approve"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-teacher-error]')?.textContent.includes('retry'));
  assert.equal(await page.locator('#teacherReviewForm [name="displayName"]').inputValue(),'Corrected course');
  assert.equal(await page.locator('#teacherReviewForm [name="displayName"]').isDisabled(),true,'A claimed publication must retry its original metadata');
  await page.locator('[data-teacher-action="approve"]').click();
  await page.waitForFunction(()=>window.fixtures.items[0].status==='approved');
  assert.equal(await page.evaluate(()=>window.fixtures.items[0].meta.subjectId),'new_subject');
  await page.locator('[data-teacher-action="review"][data-id="s2"]').click();
  await page.locator('[data-teacher-action="reject"]').click();
  assert.match(await page.locator('[data-teacher-error]').innerText(),/reason/i);
  await page.locator('#teacherReviewForm [name="reason"]').fill('Please attach the complete chapter.');
  await page.evaluate(()=>window.fixtures.fail=409);
  await page.locator('[data-teacher-action="reject"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-teacher-error]')?.textContent.includes('changed'));
  assert.equal(await page.locator('#teacherReviewForm [name="reason"]').inputValue(),'Please attach the complete chapter.');
  assert.equal(await page.locator('[data-teacher-action="reject"]').isDisabled(),true,'Conflicting version needs explicit reload');
  await page.locator('[data-teacher-action="reload-review"]').click();
  await page.locator('#teacherReviewForm [name="reason"]').fill('Please attach the complete chapter.');
  await page.locator('[data-teacher-action="reject"]').click();
  await page.waitForFunction(()=>window.fixtures.items[1].status==='rejected');
  assert.equal(await page.evaluate(()=>window.fixtures.items[1].feedback),'Please attach the complete chapter.');
  await page.locator('[data-teacher-action="revoke"][data-id="t1"]').click();
  await page.waitForFunction(()=>window.fixtures.teachers[0].status==='revoked');
  await page.locator('[data-teacher-action="rotate"][data-id="t2"]').click();
  await page.locator('#teacherInvitationLink').waitFor();
  assert.match(await page.locator('#teacherInvitationLink').inputValue(),/#invite=ROTATED-SECRET$/);
  await page.evaluate(()=>{const f=window.fixtures;f.items=[{...f.items[0],id:'s3',displayName:'Slow teacher course',status:'pending',version:1,processing:false},{...f.items[0],id:'s4',teacherId:'t2',displayName:'Current teacher course',status:'pending',version:1,processing:false,meta:{...f.items[0].meta,subjectId:'__program__'}}];window.memory.selected=null;window.remount();});
  await page.locator('[data-teacher-action="review"][data-id="s3"]').waitFor();
  await page.evaluate(()=>window.fixtures.delay=220);
  await page.locator('.teacher-filters [name="teacherId"]').selectOption('t1');
  await page.evaluate(()=>window.fixtures.delay=0);
  await page.locator('.teacher-filters [name="teacherId"]').selectOption('t2');
  await page.locator('[data-teacher-action="review"][data-id="s4"]').waitFor();
  await page.waitForTimeout(280);
  assert.equal(await page.locator('[data-teacher-action="review"][data-id="s3"]').count(),0,'Old teacher filter response cannot replace current teacher');
  await page.locator('.teacher-filters [name="teacherId"]').selectOption('');
  await page.locator('[data-teacher-action="review"][data-id="s3"]').waitFor();
  await page.evaluate(()=>window.fixtures.detailDelay={s3:220});
  await page.locator('[data-teacher-action="review"][data-id="s3"]').click();
  await page.locator('[data-teacher-action="review"][data-id="s4"]').click();
  await page.locator('#teacherReviewForm').waitFor();await page.waitForTimeout(280);
  assert.equal(await page.locator('#teacherReviewForm [name="displayName"]').inputValue(),'Current teacher course','Old detail response cannot replace selected review');
  assert.equal(await page.locator('#teacherReviewForm [name="subjectId"]').evaluate(input=>input.checkValidity()),true,'Existing catalog IDs including __program__ remain valid');
  await page.evaluate(()=>{window.fixtures.mutationDelay=240;const button=document.querySelector('[data-teacher-action="approve"]');button.click();button.click();});
  await page.evaluate(()=>window.remount('ar'));
  await page.waitForFunction(()=>window.fixtures.items[1].status==='approved');
  await page.waitForFunction(()=>!document.querySelector('[data-teacher-action="approve"]'));
  assert.equal(await page.evaluate(()=>window.fixtures.calls.filter(x=>x.method==='PATCH'&&x.path.endsWith('/s4')).length),1,'Double clicks and remounts cannot repeat approval');
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.remount('ar'));
  await page.locator('#teacherInviteForm').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Arabic phone review has no horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log('PASS: private one-time invitations, copy, rotate/revoke, metadata correction, review validation, draft remounts, publication retry, stale decisions, rejection feedback, filter/detail races, duplicate approval, Arabic mobile');
  if(process.argv.includes('--local'))await localIntegration();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
