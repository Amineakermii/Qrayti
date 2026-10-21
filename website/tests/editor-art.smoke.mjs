// Read-only deployed verification. Never saves drafts, publishes, or uploads.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const base=process.env.QRAYTI_VERIFY_BASE;
if(!/^https:\/\/(?:[a-z0-9-]+\.)?qrayti\.(?:tn|pages\.dev)$/.test(base||''))throw Error('Supply a Qrayti HTTPS URL');
let password='';
if(process.argv.includes('--password-stdin')){
  if(!process.stdin.isTTY)throw Error('Password entry requires an interactive terminal');
  process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');process.stdin.resume();
  console.log('Waiting for password on stdin (echo disabled).');
  password=await new Promise(resolve=>{let input='';const read=value=>{input+=value;if(/[\r\n]/.test(input)){process.stdin.off('data',read);process.stdin.setRawMode(false);process.stdin.pause();resolve(input.trim());}};process.stdin.on('data',read);});
}
const browser=await chromium.launch({headless:true,executablePath:(process.env.CHROMIUM_PATH || undefined)});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  async function snapshot(){const result={};for(const endpoint of ['site-content','faq','mascot']){const r=await context.request.get(base+'/api/'+endpoint);assert.equal(r.status(),200,endpoint);result[endpoint]=createHash('sha256').update(JSON.stringify(await r.json())).digest('hex');}return result;}
  const before=await snapshot();
  await page.goto(base+'/#/welcome');await page.locator('.landing-title-main').waitFor();
  assert.equal(await page.locator('.footer a[href="/learn/"]').count(),0);
  await page.goto(base+'/#/subjects?licence=info&year=1&track=common&semester=1');
  await page.locator('.subject-art-image').first().waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.subject-art-image')].slice(0,2).every(img=>img.complete&&img.naturalWidth>0));
  assert.equal(await page.locator('.subject-card .subject-emoji').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('#faqTopBtn').click();await page.locator('#faqModal.show').waitFor();
  assert.equal(await page.locator('#faqModal').evaluate(el=>getComputedStyle(el).zIndex),'1300');
  const teacher=await page.goto(base+'/teachers/');assert.equal(teacher.headers()['x-frame-options'],'SAMEORIGIN');
  await page.locator('#loginForm').waitFor();assert.equal(await page.locator('#workspace').isVisible(),false);
  assert.equal((await context.request.get(base+'/api/admin/site-content')).status(),401);
  assert.equal((await context.request.get(base+'/api/teachers/submissions')).status(),401);
  if(password){
    await page.setViewportSize({width:1500,height:1000});await page.goto(base+'/admin/');
    await page.locator('[data-lang=en]').click();await page.locator('[name=password]').fill(password);password='';
    await page.locator('#loginForm [type=submit]').click();await page.locator('#workspace:not([hidden])').waitFor();
    const adminBefore=await(await context.request.get(base+'/api/admin/site-content')).json();
    await page.locator('#sidebar [data-nav=editor]').click();await page.locator('#editorPagePicker').waitFor();
    const frame=page.frameLocator('#sitePreview');await frame.locator('.landing-title-main').waitFor();
    await page.locator('#editorTextSearch').fill('قرايتي');await page.locator('.editor-inventory button').first().waitFor();
    await page.locator('#editorPagePicker').selectOption('/teachers/#/fr');await frame.locator('html[lang=fr] #loginTitle').waitFor();
    assert.equal(await frame.locator('html').getAttribute('lang'),'fr');
    await page.locator('#editorPagePicker').selectOption('/teachers/#/en');await frame.locator('html[lang=en] #loginTitle').waitFor();
    assert.equal(await frame.locator('html').getAttribute('lang'),'en');
    assert.equal((await(await context.request.get(base+'/api/admin/site-content')).json()).revision,adminBefore.revision);
    console.log('PASS authenticated page picker, teacher previews and searchable copy; no CMS writes');
  }
  assert.deepEqual(await snapshot(),before,'Public content and character configuration unchanged during smoke');
  assert.deepEqual(errors,[]);console.log('PASS deployed editor/art read-only checks: '+base);console.log('Public content fingerprints: '+JSON.stringify(before));
}finally{await browser.close();}
