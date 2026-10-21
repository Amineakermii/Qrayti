// Read-only deployed smoke test: authenticates, reads data, never saves/publishes.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QRAYTI_VERIFY_BASE;if(!base||!/^https:\/\/(?:[a-z0-9-]+\.)?qrayti\.(?:tn|pages\.dev)$/.test(base))throw Error('Supply a Qrayti HTTPS URL');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.env.CHROMIUM_PATH || undefined)});
const context=await browser.newContext({viewport:{width:1500,height:1000},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
  const response=await page.goto(base+'/admin/');assert.equal(response.status(),200);
  await page.locator('[data-lang="en"]').click();assert.match(await page.locator('#loginForm h1').innerText(),/Qrayti/);
  assert.equal(await page.locator('[data-theme-toggle]').count(),1);
  const initialTheme=await page.locator('html').getAttribute('data-theme');
  await page.locator('[data-theme-toggle]').click();
  assert.notEqual(await page.locator('html').getAttribute('data-theme'),initialTheme);
  await page.reload();
  assert.notEqual(await page.locator('html').getAttribute('data-theme'),initialTheme,'Theme persists on deployed site');
  if(process.env.QRAYTI_SMOKE_PASSWORD){
    await page.locator('[name=password]').fill(process.env.QRAYTI_SMOKE_PASSWORD);await page.locator('#loginForm button[type=submit]').click();
    await page.locator('#workspace:not([hidden])').waitFor({timeout:20000}).catch(async e=>{console.error('Login feedback:',await page.locator('#loginError').innerText(),await page.locator('#notice').innerText());throw e;});
    const readings=await page.evaluate(async()=>{const paths=['site-content','media','export','static-items','faq','mascot'];return await Promise.all(paths.map(async p=>{const r=await fetch('/api/admin/'+p);const d=await r.json();return {path:p,status:r.status,count:d.items?.length??d.config?.items?.length??d.config?.scenarios?.length,revision:d.revision};}));});
    for(const r of readings)assert.equal(r.status,200,r.path);console.log(readings);
    await mkdir(new URL('../test-results/',import.meta.url),{recursive:true});
    await page.screenshot({path:fileURLToPath(new URL('../test-results/admin-deployed-en.png',import.meta.url)),fullPage:true});
    await page.locator('#sidebar [data-nav="editor"]').click();await page.frameLocator('#sitePreview').locator('.landing-title-main').waitFor({timeout:20000});
    await page.waitForFunction(()=>{const el=document.querySelector('#sitePreview')?.contentDocument?.querySelector('.landing-title-main');return el&&document.querySelector('[data-bind="home.title"]')?.value===el.textContent.trim();},{},{timeout:20000});
    assert.equal(await page.locator('#saveState.draft').count(),0,'Reading current text must not dirty the draft');
    for(const tab of ['courses','faq','mascot','history']){await page.locator('#sidebar [data-nav="'+tab+'"]').click();await page.waitForTimeout(500);assert.equal(await page.locator('#notice.bad:visible').count(),0,tab);}
    await page.locator('[data-lang="ar"]').click();await page.locator('#sidebar [data-nav="overview"]').click();await page.waitForTimeout(300);
    await page.screenshot({path:fileURLToPath(new URL('../test-results/admin-deployed-ar.png',import.meta.url)),fullPage:true});
    assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
  }
  assert.deepEqual(errors,[]);console.log('PASS deployed read-only smoke test: '+base);
}finally{await browser.close();}
