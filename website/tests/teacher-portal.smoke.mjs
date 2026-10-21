// Deployed checks only read data; no invitations/uploads/approvals are created.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QRAYTI_VERIFY_BASE;
if(!base||!/^https:\/\/(?:[a-z0-9-]+\.)?qrayti\.(?:tn|pages\.dev)$/.test(base))throw Error('Supply a Qrayti HTTPS URL');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.env.CHROMIUM_PATH || undefined)});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+'/teachers/');assert.equal(response.status(),200);assert.match(response.headers()['cache-control'],/no-store/);assert.equal(response.headers()['referrer-policy'],'no-referrer');
  await page.locator('#loginForm').waitFor();assert.equal(await page.locator('#workspace').isVisible(),false);
  for(const path of ['/api/teachers/session','/api/teachers/options','/api/teachers/submissions','/api/admin/teachers','/api/admin/teacher-submissions'])assert.equal((await context.request.get(base+path)).status(),401,path);
  for(const lang of ['en','fr']){
    const flag=page.locator('[data-lang="'+lang+'"]');
    assert.equal(await flag.locator('svg[aria-hidden=true]').count(),1);assert.equal(await flag.innerText(),'');
    assert.equal(await flag.getAttribute('aria-label'),lang==='fr'?'Français':'English');
    await page.locator('[data-lang="'+lang+'"]').click();assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  const toggle=page.locator('[data-theme-toggle]');assert.equal(await toggle.getAttribute('role'),'switch');assert.equal(await toggle.locator('svg').count(),3);assert.equal(await toggle.innerText(),'');
  const before=await page.locator('html').getAttribute('data-theme');await toggle.click();await page.reload();assert.notEqual(await page.locator('html').getAttribute('data-theme'),before);assert.equal(await toggle.getAttribute('aria-checked'),String(before!=='dark'));
  if(process.env.QRAYTI_SMOKE_PASSWORD){
    await page.goto(base+'/admin/');await page.locator('[data-lang="en"]').click();await page.locator('[name=password]').fill(process.env.QRAYTI_SMOKE_PASSWORD);await page.locator('#loginForm button[type=submit]').click();await page.locator('#workspace:not([hidden])').waitFor();
    const results=await page.evaluate(async()=>Promise.all(['teachers','teacher-submissions'].map(async path=>{const r=await fetch('/api/admin/'+path);const d=await r.json();return {path,status:r.status,count:d.teachers?.length??d.items?.length};})));
    for(const r of results)assert.equal(r.status,200,r.path);console.log(results);
    // Use desktop for the dashboard navigation, and verify the real mounted module.
    await page.setViewportSize({width:1440,height:1000});await page.locator('#sidebar [data-nav="teachers"]').click();
    await page.locator('#teacherInviteForm').waitFor();
    await page.waitForFunction(()=>!document.querySelector('.teacher-access-list')&&document.querySelector('.teacher-invitations')||document.querySelector('.teacher-access-list'));
    assert.equal(await page.locator('#notice.bad:visible').count(),0);
  }
  assert.deepEqual(errors,[]);console.log('PASS teacher portal deployed read-only smoke: '+base);
}finally{await browser.close();}
