import assert from 'node:assert/strict';
import {test, after} from 'node:test';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,executablePath:(process.env.CHROMIUM_PATH || undefined)});
after(()=>browser.close());
await mkdir('test-results',{recursive:true});
const base='http://127.0.0.1:8789'; // Never run mutating tests against production.
async function setup(colorScheme='light') {
  const context=await browser.newContext({viewport:{width:1500,height:1000},serviceWorkers:'block',colorScheme});
  const page=await context.newPage();
  await page.goto(base+'/admin/');
  await page.locator('[data-lang="en"]').click();
  await page.locator('[name=password]').fill('local-admin-test-only');
  await page.locator('#loginForm [type=submit]').click();
  await page.locator('#workspace:not([hidden])').waitFor();
  return {context,page};
}
async function eventually(fn) {
  for(let i=0;i<70;i++){if(await fn())return;await new Promise(r=>setTimeout(r,100));}
  assert.fail('Expected UI state did not arrive');
}
test('blue light/dark themes persist and preserve in-progress inputs',async()=>{
  const {context,page}=await setup();
  try {
    assert.equal(await page.locator('[data-theme-toggle]').count(),1,'Theme switch must exist');
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    const primary=await page.locator('.welcome-card .primary').evaluate(el=>getComputedStyle(el).backgroundColor);
    const rgb=primary.match(/\d+/g).map(Number);assert.ok(rgb[2]>rgb[1]&&rgb[2]>rgb[0],'Brand primary must be blue');
    await page.screenshot({path:'test-results/admin-blue-light.png',fullPage:true});
    await page.locator('[data-theme-toggle]').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.reload();await page.locator('#workspace:not([hidden])').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark','Saved choice survives reload');
    await page.screenshot({path:'test-results/admin-blue-dark.png',fullPage:true});
    await page.locator('#sidebar [data-nav=editor]').click();
    const frame=page.frameLocator('#sitePreview');await frame.locator('.landing-title-main').waitFor();
    await page.locator('[data-action=select]').click();await frame.locator('.landing-title-main').click();
    await page.locator('#pickedValue').fill('Unapplied typing must survive');
    await page.locator('[data-theme-toggle]').click();
    assert.equal(await page.locator('#pickedValue').inputValue(),'Unapplied typing must survive');
    await page.locator('[data-theme-toggle]').click();
    await page.locator('[data-action=publish]').click();
    const bg=await page.locator('#dialog').evaluate(el=>getComputedStyle(el).backgroundColor);
    assert.ok(bg.match(/\d+/g).slice(0,3).every(n=>Number(n)<80),'Dialog must have a dark surface');
    await page.locator('#dialog [data-close-dialog]').first().click();
    await page.locator('[data-lang=ar]').click();await page.setViewportSize({width:390,height:844});
    await page.locator('[data-action=menu]').click();await page.locator('#sidebar [data-nav=overview]').click();
    await page.waitForTimeout(300);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const controls=await page.locator('#languageBar').boundingBox(),menu=await page.locator('[data-action=menu]').boundingBox();
    assert.ok(controls.x+controls.width<=menu.x||menu.x+menu.width<=controls.x,'Theme/language controls must not overlap menu');
    await page.screenshot({path:'test-results/admin-blue-dark-phone.png',fullPage:true});
  } finally {await context.close();}
  const fresh=await setup('dark');
  assert.equal(await fresh.page.locator('html').getAttribute('data-theme'),'dark','Initial mode follows system preference');
  await fresh.context.close();
});
test('editor loads actual current copy without materializing defaults or masking edits',async()=>{
  const {context,page}=await setup();let baseline;
  try {
    baseline=await page.evaluate(async()=>await(await fetch('/api/admin/site-content')).json());
    const sparse=structuredClone(baseline.draft);
    for(const path of ['home','brand','contact'])for(const key of Object.keys(sparse[path]))if(typeof sparse[path][key]==='string')sparse[path][key]='';
    sparse.texts=[];
    await page.evaluate(async data=>{const r=await fetch('/api/admin/site-content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error('Test setup failed');},{revision:baseline.revision,content:sparse});
    await page.reload();await page.locator('#workspace:not([hidden])').waitFor();
    await page.locator('#sidebar [data-nav=editor]').click();
    const frame=page.frameLocator('#sitePreview');await frame.locator('.landing-title-main').waitFor();
    const title=await frame.locator('.landing-title-main').innerText();
    await eventually(async()=>await page.locator('[data-bind="home.title"]').inputValue()===title);
    for(const [path,selector] of [['home.badge','.landing-screen .welcome-badge'],['home.accent','.landing-title-accent'],['home.description','.landing-copy>p'],['brand.name','.brand-name']]){
      assert.equal(await page.locator(`[data-bind="${path}"]`).inputValue(),await frame.locator(selector).innerText(),path);
    }
    assert.ok((await page.locator('[data-bind="contact.email"]').inputValue()).includes('@'));
    assert.match(await page.locator('#saveState').innerText(),/Draft saved/);
    assert.deepEqual((await page.evaluate(async()=>await(await fetch('/api/admin/site-content')).json())).draft,sparse,'Opening editor does not save defaults');
    await page.locator('[data-action=select]').click();await frame.locator('.landing-title-main').click();
    assert.equal(await page.locator('#pickedValue').inputValue(),title);
    assert.equal(await page.locator('#pickedValue').evaluate(el=>el===document.activeElement),true,'Selection focuses prefilled field');
    await page.locator('#pickedValue').fill('Visual heading');await page.locator('[data-action=applyPicked]').click();
    await eventually(async()=>await page.locator('[data-bind="home.title"]').inputValue()==='Visual heading');
    await frame.locator('.landing-title-main').click();assert.equal(await page.locator('#pickedValue').inputValue(),'Visual heading');
    await page.locator('[data-bind="home.title"]').fill('Structured heading');
    await eventually(async()=>await frame.locator('.landing-title-main').innerText()==='Structured heading');
    await page.locator('[data-action=save]').click();await eventually(async()=>/Draft saved/.test(await page.locator('#saveState').innerText()));
    await page.reload();await page.locator('#workspace:not([hidden])').waitFor();await page.locator('#sidebar [data-nav=editor]').click();
    await eventually(async()=>await frame.locator('.landing-title-main').innerText()==='Structured heading');
    assert.equal(await page.locator('[data-bind="home.title"]').inputValue(),'Structured heading');
    assert.equal((await page.evaluate(async()=>await(await fetch('/api/admin/site-content')).json())).draft.home.badge,'','Unchanged default remains sparse after saving');
    // Reproduce typing while the iframe's initial metadata is still loading.
    const latest=await page.evaluate(async()=>await(await fetch('/api/admin/site-content')).json());
    const delayed=structuredClone(latest.draft);delayed.home.title='';
    delayed.texts.push({id:'delayed-title',route:'/#/welcome',original:title,value:'Existing visual override'});
    await page.evaluate(async data=>{await fetch('/api/admin/site-content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});},{revision:latest.revision,content:delayed});
    await page.route('**/assets/site-content.js*',async route=>{await new Promise(r=>setTimeout(r,1500));await route.continue();});
    await page.reload();await page.locator('#workspace:not([hidden])').waitFor();await page.locator('#sidebar [data-nav=editor]').click();
    await page.locator('[data-bind="home.title"]').fill('Discard this early typing');
    page.once('dialog',dialog=>dialog.accept());await page.locator('[data-action=logout]').click();
    await page.locator('#login:not([hidden])').waitFor();
    await page.locator('[name=password]').fill('local-admin-test-only');await page.locator('#loginForm [type=submit]').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    await page.locator('#sidebar [data-nav=editor]').click();
    await eventually(async()=>await page.locator('[data-bind="home.title"]').inputValue()==='Existing visual override');
    assert.match(await page.locator('#saveState').innerText(),/Draft saved/,'Discarded early typing cannot modify a freshly loaded draft');
    await page.reload();await page.locator('#workspace:not([hidden])').waitFor();await page.locator('#sidebar [data-nav=editor]').click();
    await page.locator('[data-bind="home.title"]').fill('Typed before preview is ready');
    await page.locator('[data-action=save]').click();
    await eventually(async()=>await frame.locator('.landing-title-main').innerText()==='Typed before preview is ready');
    await eventually(async()=>/Draft saved/.test(await page.locator('#saveState').innerText()));
    const resolved=await page.evaluate(async()=>await(await fetch('/api/admin/site-content')).json());
    assert.equal(resolved.draft.home.title,'Typed before preview is ready');
    assert.equal(resolved.draft.texts.some(x=>x.id==='delayed-title'),false,'Old override cannot mask early typing');
    await page.unroute('**/assets/site-content.js*');
    await page.screenshot({path:'test-results/admin-prefilled-editor.png',fullPage:true});
  } finally {
    if(baseline)await page.evaluate(async original=>{const current=await(await fetch('/api/admin/site-content')).json();const r=await fetch('/api/admin/site-content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:current.revision,content:original.draft})});if(!r.ok)throw Error('Test cleanup failed');},baseline);
    await context.close();
  }
});
