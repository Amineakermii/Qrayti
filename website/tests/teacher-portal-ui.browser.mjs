// UI contract tests: real portal DOM with stubbed HTTP APIs, not backend integration.
import assert from 'node:assert/strict';
import {test, after} from 'node:test';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!/^\/teachers\/(index.html|portal.js|portal.css|theme.js|mascot.png)?$/.test(path)){res.writeHead(404).end();return;}
  try {const bytes=await readFile(new URL('../site'+(path.endsWith('/')?path+'index.html':path),import.meta.url));res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.png')?'image/png':'text/html');res.end(bytes);}
  catch {res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:(process.env.CHROMIUM_PATH || undefined)});
after(async()=>{await browser.close();await new Promise(resolve=>server.close(resolve));});
const pdf={name:'lecture.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nlocal UI fixture')};
async function setup(){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',colorScheme:'light'});
  const page=await context.newPage();page.setDefaultTimeout(4000);
  const state={loggedIn:false,posts:[],items:[],putError:0,preflightError:0,optionsError:0};
  await page.route('**/api/teachers/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname;
    let code=200,data={};
    if(path.endsWith('/session')){
      if(req.method()==='POST'){state.loggedIn=true;state.posts.push(req.postDataJSON());}
      if(req.method()==='DELETE')state.loggedIn=false;
      code=state.loggedIn?200:401;
      data={teacher:{id:'teacher-1',name:'Dr. Amira',email:'private@example.test',university:'University of Tunis',institution:'Faculty of Sciences',expiresAt:'2027-01-01T00:00:00Z'},limits:{fileBytes:26214400,dailyFiles:20,dailyBytes:262144000,outstandingBytes:524288000}};
    } else if(!state.loggedIn){code=401;data={error:'Session expired'};}
    else if(path.endsWith('/options')){code=state.optionsError||200;data={subjects:[{licence:'LINFO',year:1,semester:1,track:'common',subjectId:'algorithms',subjectName:'Algorithms',subjectAr:'الخوارزميات',subjectAbbr:'ALG'}],institutions:[{university:'University of Tunis',institution:'Faculty of Sciences'}]};}
    else if(path.endsWith('/submissions'))data={items:state.items,usage:{dailyFiles:state.items.length,dailyBytes:24,outstandingBytes:24}};
    else if(path.endsWith('/upload')&&req.method()==='POST'){
      state.posts.push(req.postDataJSON());code=state.preflightError||200;
      data=code===200?{id:'submission-1',status:'reserved'}:{error:'Quota reached',retryAt:'2026-10-15T00:00:00Z'};
    } else if(path.endsWith('/upload')&&req.method()==='PUT'){
      code=state.putError||200;state.putError=0;
      if(code===200){const meta=state.posts.findLast(x=>x.meta).meta;const item={id:'submission-1',displayName:meta.displayName,originalName:'lecture.pdf',mime:'application/pdf',size:24,meta,status:'pending',version:1,createdAt:'2026-10-14T12:00:00Z',reviewedAt:null,feedback:'',publishedFileId:null};state.items=[item];data={item};}
      else data={error:code===401?'Session expired':'Temporary upload failure'};
    }
    await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(data)});
  });
  const response=await page.goto(base+'/teachers/#invite=local-test-invite');
  assert.equal(response.status(),200,'Teacher portal must exist at /teachers/');
  await page.locator('[data-lang=en]').click();
  return {page,context,state};
}
async function login(page){await page.locator('#loginForm button[type=submit]').click();await page.locator('#workspace:not([hidden])').waitFor();await page.locator('#subjectId option[value=algorithms]').waitFor({state:'attached'});}
async function fillUpload(page){await page.locator('#displayName').fill('Week one');await page.locator('#files').setInputFiles(pdf);await page.locator('#rightsConfirmed').check();}
async function until(fn){for(let i=0;i<60;i++){if(await fn())return;await new Promise(resolve=>setTimeout(resolve,50));}assert.fail('Expected portal state did not arrive');}

test('invitation requires explicit exchange, clears secret and shows immutable identity',async()=>{
  const {page,context,state}=await setup();try{
    assert.equal(state.posts.length,0);await login(page);assert.equal(new URL(page.url()).hash,'');
    assert.equal(state.posts[0].token,'local-test-invite');assert.match(await page.locator('#identity').innerText(),/Dr. Amira/);
    assert.equal(await page.locator('#identity input').count(),0);
    assert.equal(await page.evaluate(()=>Object.values(localStorage).some(value=>value.includes('local-test-invite'))),false);
    assert.equal(await page.locator('meta[name=referrer]').getAttribute('content'),'no-referrer');
  }finally{await context.close();}
});
test('rights gate and retry preserve request identity; successful upload is pending',async()=>{
  const {page,context,state}=await setup();try{
    await login(page);await fillUpload(page);await page.locator('#rightsConfirmed').uncheck();await page.locator('#submitUpload').click();
    assert.equal(state.posts.filter(x=>x.meta).length,0);
    await page.locator('#rightsConfirmed').check();state.putError=503;await page.locator('#submitUpload').click();
    await page.locator('[data-retry]').waitFor();assert.doesNotMatch(await page.locator('#queue').innerText(),/Pending review/);
    await page.locator('[data-retry]').click();await until(async()=>/Pending review/.test(await page.locator('#queue').innerText()));
    const requests=state.posts.filter(x=>x.meta);assert.equal(requests[0].requestId,requests[1].requestId);
    assert.equal(requests[0].rightsConfirmed,true);assert.equal(requests[0].meta.subjectId,'algorithms');
    await page.locator('[data-view=submissions]').click();await page.locator('#submissionList a[download]').waitFor();assert.match(await page.locator('#submissionList').innerText(),/Pending review/);
  }finally{await context.close();}
});
test('session expiry preserves queue and metadata, accepts a replacement invitation',async()=>{
  const {page,context,state}=await setup();try{
    await login(page);await fillUpload(page);state.putError=401;await page.locator('#submitUpload').click();await page.locator('#login:not([hidden])').waitFor();
    assert.equal(await page.locator('#displayName').inputValue(),'Week one');
    await page.locator('#invitation').fill('replacement-invitation');await login(page);
    assert.equal(await page.locator('#files').evaluate(el=>el.files.length),1);
    await page.locator('[data-retry]').click();await until(async()=>/Pending review/.test(await page.locator('#queue').innerText()));
  }finally{await context.close();}
});
test('French and English retain fields and files, phone stays within viewport',async()=>{
  const {page,context}=await setup();try{
    await login(page);await fillUpload(page);await page.locator('[data-theme-toggle]').click();await page.locator('[data-lang=fr]').click();
    assert.equal(await page.locator('#displayName').inputValue(),'Week one');assert.equal(await page.locator('#files').evaluate(el=>el.files.length),1);
    assert.equal(await page.locator('html').getAttribute('dir'),'ltr');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.match(await page.locator('#submitUpload').innerText(),/Envoyer/);
    await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await mkdir(fileURLToPath(new URL('../test-results/',import.meta.url)),{recursive:true});
    await page.screenshot({path:fileURLToPath(new URL('../test-results/teacher-portal-fr-dark-phone.png',import.meta.url)),fullPage:true});
    await page.locator('[data-lang=en]').click();await page.locator('[data-theme-toggle]').click();await page.setViewportSize({width:1440,height:1000});
    await page.screenshot({path:fileURLToPath(new URL('../test-results/teacher-portal-en-light.png',import.meta.url)),fullPage:true});
    await page.locator('#displayName').focus();assert.notEqual(await page.locator('#displayName').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
  }finally{await context.close();}
});
test('unsupported, empty and oversized files are blocked with clear errors',async()=>{
  const {page,context,state}=await setup();try{
    await login(page);await page.locator('#files').setInputFiles({name:'unsafe.html',mimeType:'text/html',buffer:Buffer.from('unsafe')});
    assert.match(await page.locator('#fileError').innerText(),/format/i);
    await page.locator('#files').setInputFiles({name:'empty.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(0)});assert.match(await page.locator('#fileError').innerText(),/empty/i);
    await page.locator('#files').setInputFiles({name:'large.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(26214401)},{timeout:15000});assert.match(await page.locator('#fileError').innerText(),/25/);
    assert.equal(state.posts.filter(x=>x.meta).length,0);
  }finally{await context.close();}
});
test('quota failure never reports success and preserves the proposed subject',async()=>{
  const {page,context,state}=await setup();try{
    await login(page);await fillUpload(page);await page.locator('#subjectId').selectOption('__proposed');await page.locator('#subjectName').fill('New subject');
    state.preflightError=429;await page.locator('#submitUpload').click();await page.locator('[data-retry]').waitFor();
    assert.match(await page.locator('#queue').innerText(),/Quota reached/);assert.match(await page.locator('#queue').innerText(),/2026|2026\/|15/);
    assert.equal(await page.locator('#subjectName').inputValue(),'New subject');assert.doesNotMatch(await page.locator('#queue').innerText(),/Pending review/);
  }finally{await context.close();}
});
test('exam category uses the existing catalog API value',async()=>{
  const {page,context,state}=await setup();try{
    await login(page);await fillUpload(page);await page.locator('#category').selectOption({label:'Exams'});
    await page.locator('#submitUpload').click();await until(()=>state.posts.some(x=>x.meta));
    assert.equal(state.posts.find(x=>x.meta).meta.category,'exam');
  }finally{await context.close();}
});
test('review feedback is text, own download is scoped, and logout clears private results',async()=>{
  const {page,context,state}=await setup();try{
    state.items=[{id:'own-file',displayName:'Reviewed lesson',originalName:'lesson.pdf',mime:'application/pdf',size:200,meta:{subjectName:'Algorithms'},status:'rejected',version:2,createdAt:'2026-10-14T12:00:00Z',reviewedAt:'2026-10-14T13:00:00Z',feedback:'Please correct chapter 2 <img src=x onerror=alert(1)>',publishedFileId:null}];
    await login(page);await page.locator('[data-view=submissions]').click();
    assert.match(await page.locator('#submissionList').innerText(),/Rejected/);assert.match(await page.locator('#submissionList .feedback').innerText(),/Please correct chapter 2/);
    assert.equal(await page.locator('#submissionList img').count(),0);
    assert.equal(await page.locator('#submissionList a').getAttribute('href'),'/api/teachers/submissions/own-file/file');
    await page.locator('#logout').click();await page.locator('#login:not([hidden])').waitFor();
    assert.equal(await page.locator('#identity').innerText(),'');assert.doesNotMatch(await page.locator('#submissionList').innerText(),/Reviewed lesson|chapter 2/);
  }finally{await context.close();}
});
test('preferences survive reload without persisting invitation or file data',async()=>{
  const {page,context}=await setup();try{
    await login(page);await page.locator('[data-theme-toggle]').click();await page.locator('[data-lang=fr]').click();await page.reload();
    await page.locator('#workspace:not([hidden])').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('html').getAttribute('lang'),'fr');
    assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).sort()),['qrayti-teacher-language','qrayti-teacher-theme']);
    assert.equal(await page.evaluate(()=>sessionStorage.length),0);
  }finally{await context.close();}
});

test('language flags have accessible names, touch targets and saved keyboard selection',async()=>{
  const {page,context}=await setup();try{
    for(const [code,name] of [['fr','Français'],['en','English']]){
      const button=page.getByRole('button',{name,exact:true});
      assert.equal(await button.getAttribute('data-lang'),code);
      assert.equal(await button.getAttribute('title'),name);
      assert.equal(await button.innerText(),'');
      assert.equal(await button.locator('svg[aria-hidden=true]').count(),1);
      const size=await button.boundingBox();assert.ok(size.width>=44&&size.height>=44);
    }
    const french=page.getByRole('button',{name:'Français',exact:true});
    await french.focus();await page.keyboard.press('Enter');
    assert.equal(await french.getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('[data-lang=en]').getAttribute('aria-pressed'),'false');
    await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'fr');
    await page.setViewportSize({width:375,height:812});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const size=await french.boundingBox();assert.ok(size.width>=44&&size.height>=44);
  }finally{await context.close();}
});
test('sun and moon switch is labelled, keyboard operable, persistent and motion-safe',async()=>{
  const {page,context}=await setup();try{
    const toggle=page.locator('[data-theme-toggle]');
    assert.equal(await toggle.getAttribute('role'),'switch');
    assert.equal(await toggle.getAttribute('aria-label'),'Dark mode');
    assert.equal(await toggle.getAttribute('aria-checked'),'false');
    assert.equal(await toggle.innerText(),'','Visual theme control must not show a text button');
    assert.equal(await toggle.locator('svg').count(),3);
    await toggle.focus();await page.keyboard.press('Space');
    assert.equal(await toggle.getAttribute('aria-checked'),'true');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.locator('[data-lang=fr]').click();assert.equal(await toggle.getAttribute('aria-label'),'Mode nuit');
    assert.equal(await toggle.locator('svg').count(),3,'Language changes must not replace the drawing');
    await page.reload();assert.equal(await toggle.getAttribute('aria-checked'),'true');
    await toggle.focus();await page.keyboard.press('Enter');assert.equal(await toggle.getAttribute('aria-checked'),'false');
    await page.emulateMedia({reducedMotion:'no-preference'});
    assert.notEqual(await toggle.locator('.theme-orb').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await toggle.locator('.theme-orb').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    await page.setViewportSize({width:375,height:812});const box=await toggle.boundingBox();
    assert.ok(box.width>=44&&box.height>=44);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('.preferences').screenshot({path:fileURLToPath(new URL('../test-results/teacher-theme-day.png',import.meta.url))});
    await toggle.click();await page.locator('.preferences').screenshot({path:fileURLToPath(new URL('../test-results/teacher-theme-night.png',import.meta.url))});
  }finally{await context.close();}
});

test('legacy Arabic preference becomes French; motion respects accessibility',async()=>{
  const {page,context}=await setup();try{
    await page.evaluate(()=>localStorage.setItem('qrayti-teacher-language','ar'));await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'),'fr');
    assert.equal(await page.locator('[data-lang=ar]').count(),0);
    assert.match(await page.locator('#loginTitle').innerText(),/Bienvenue/);
    assert.doesNotMatch(await page.locator('body').innerText(),/[\u0600-\u06ff]/);
    await page.emulateMedia({reducedMotion:'no-preference'});
    assert.notEqual(await page.locator('.mascot-scene').evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.mascot-scene').evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.setViewportSize({width:375,height:812});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:fileURLToPath(new URL('../test-results/teacher-friendly-login-phone.png',import.meta.url)),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:fileURLToPath(new URL('../test-results/teacher-friendly-login.png',import.meta.url)),fullPage:true});
  }finally{await context.close();}
});
test('real local backend: invitation, upload, own download and owner approval', {skip:process.env.TEACHER_UI_REAL!=='1'}, async()=>{
  // Explicit opt-in; never accept a configurable remote or production origin.
  const origin='http://127.0.0.1:8791';
  const admin=await fetch(origin+'/api/admin-login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({password:'local-admin-test-only'})});
  assert.equal(admin.status,200);const cookie=admin.headers.get('set-cookie').split(';')[0];
  const response=await fetch(origin+'/api/admin/teachers',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({name:'UI local verification '+Date.now(),email:'ui-check@example.test',university:'Université de Tunis',institution:'Faculté des Sciences'})});
  assert.equal(response.status,201);const invitation=await response.json();
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  try{
    const page=await context.newPage();page.setDefaultTimeout(15000);
    await page.goto(origin+'/teachers/#invite='+invitation.token);await page.locator('[data-lang=en]').click();
    await page.locator('#loginForm button[type=submit]').click();await page.locator('#workspace:not([hidden])').waitFor();
    await until(async()=>await page.locator('#subjectId option').count()>1);
    await page.locator('#displayName').fill('Local browser verification');
    const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=','base64');
    await page.locator('#files').setInputFiles({name:'local-ui-check.png',mimeType:'image/png',buffer:bytes});
    await page.locator('#rightsConfirmed').check();await page.locator('#submitUpload').click();
    await until(async()=>/Pending review/.test(await page.locator('#queue').innerText()));
    assert.equal(new URL(page.url()).hash,'');
    await page.locator('[data-view=submissions]').click();await page.locator('#submissionList a').waitFor();
    const downloading=page.waitForEvent('download');await page.locator('#submissionList a').click();
    const download=await downloading;assert.equal(await download.failure(),null);assert.deepEqual(await readFile(await download.path()),bytes);
    assert.match(await page.locator('#submissionList').innerText(),/Pending review/);
    const own=await page.evaluate(async()=>await(await fetch('/api/teachers/submissions')).json());
    const item=own.items.find(entry=>entry.originalName==='local-ui-check.png');assert.ok(item);
    const approved=await fetch(origin+'/api/admin/teacher-submissions/'+item.id,{method:'PATCH',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({action:'approve',version:item.version,meta:item.meta})});
    assert.equal(approved.status,200);const decision=await approved.json();assert.equal(decision.item.status,'approved');
    await page.locator('#refresh').click();await until(async()=>/Approved/.test(await page.locator('#submissionList').innerText()));
    const catalog=await(await fetch(origin+`/api/catalog?licence=${encodeURIComponent(item.meta.licence)}&year=${item.meta.year}&semester=${item.meta.semester}`)).json();
    assert.ok(catalog.files.some(entry=>entry.id===decision.item.publishedFileId));
    await mkdir(fileURLToPath(new URL('../test-results/',import.meta.url)),{recursive:true});
    await page.screenshot({path:fileURLToPath(new URL('../test-results/teacher-portal-real-approved.png',import.meta.url)),fullPage:true});
  }finally{await context.close();}
});
