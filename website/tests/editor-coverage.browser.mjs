import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,executablePath:(process.env.CHROMIUM_PATH || undefined)});
const context=await browser.newContext({viewport:{width:1500,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
const page=await context.newPage();page.setDefaultTimeout(7000);
const base='http://127.0.0.1:8789';let baseline;
async function until(fn){for(let i=0;i<80;i++){if(await fn())return;await new Promise(r=>setTimeout(r,100));}assert.fail('Expected editor state did not arrive');}
async function pick(search){await page.locator('#editorTextSearch').fill(search);await page.locator('.editor-inventory [data-inventory-item]').first().click();}
try{
  await page.goto(base+'/admin/');await page.locator('[data-lang=en]').click();
  await page.locator('[name=password]').fill('local-admin-test-only');await page.locator('#loginForm [type=submit]').click();
  await page.locator('#workspace:not([hidden])').waitFor();baseline=await page.evaluate(async()=>await(await fetch('/api/admin/site-content')).json());
  await page.locator('#sidebar [data-nav=editor]').click();
  await page.locator('#editorPagePicker').waitFor();
  const frame=page.frameLocator('#sitePreview');await frame.locator('.landing-title-main').waitFor();
  assert.equal(await frame.locator('.footer a[href="/learn/"]').count(),0,'Removed footer index link');
  await pick('كورك مرتّب');const original=await page.locator('#pickedValue').inputValue();assert.ok(original.includes('كورك'));
  await page.locator('#pickedValue').fill('Footer editing works');await page.locator('[data-action=applyPicked]').click();
  await until(async()=>await frame.locator('.footer').innerText().then(x=>x.includes('Footer editing works')));
  // Hidden popup input hints are discoverable without needing to click the input text.
  await pick('لوّج في كامل قرايتي');assert.ok((await page.locator('#pickedValue').inputValue()).includes('لوّج'));
  await page.locator('#pickedValue').fill('Search all your courses');await page.locator('[data-action=applyPicked]').click();
  await until(async()=>await frame.locator('#globalSearch').getAttribute('placeholder')==='Search all your courses');
  await page.locator('#editorPagePicker').selectOption('/#/average');await frame.locator('.average-screen').waitFor();
  const subjectRoute=await page.locator('#editorPagePicker option').evaluateAll(options=>options.find(x=>x.value.startsWith('/#/subject?')).value);
  await page.locator('#editorPagePicker').selectOption(subjectRoute);await frame.locator('.category-card').first().waitFor();
  const subjectName=await frame.locator('.context-head h1').innerText();
  await pick(subjectName);await page.locator('#pickedValue').fill('Subject title follows navigation');await page.locator('[data-action=applyPicked]').click();
  await until(async()=>await frame.locator('.context-head h1').innerText()==='Subject title follows navigation');
  const reordered=subjectRoute.split('?')[0]+'?'+subjectRoute.split('?')[1].split('&').reverse().join('&');
  await page.locator('#editorRoute').fill(reordered);await page.locator('#editorGo').click();
  await until(async()=>await frame.locator('.context-head h1').innerText()==='Subject title follows navigation');
  await frame.locator('[data-go^="/subjects?"]').first().click();
  const subjectId=new URLSearchParams(subjectRoute.split('?')[1]).get('id');
  await frame.locator('.subject-card').evaluateAll((cards,id)=>cards.find(card=>new URLSearchParams(card.dataset.go.split('?')[1]).get('id')===id).click(),subjectId);
  await until(async()=>await frame.locator('.context-head h1').innerText()==='Subject title follows navigation');
  await page.locator('#editorPagePicker').selectOption('/teachers/#/fr');await frame.locator('#loginTitle').waitFor();
  await until(async()=>await frame.locator('html').getAttribute('lang')==='fr');
  await pick('Bienvenue chez vous');await page.locator('#pickedValue').fill('Bonjour professeur !');await page.locator('[data-action=applyPicked]').click();
  await until(async()=>await frame.locator('#loginTitle').innerText()==='Bonjour professeur !');
  // Editing stays scoped to the chosen language and never copies input values into the text inventory.
  await frame.locator('#invitation').fill('private-token-never-in-inventory');
  await page.locator('#editorTextSearch').fill('private-token-never-in-inventory');assert.equal(await page.locator('.editor-inventory [data-inventory-item]').count(),0);
  await frame.locator('#fileError').evaluate(el=>{el.textContent='private-upload-name.pdf: File is empty';});
  await page.waitForTimeout(250);
  await page.locator('#editorTextSearch').fill('private-upload-name');assert.equal(await page.locator('.editor-inventory [data-inventory-item]').count(),0,'Private filenames in validation errors are excluded');
  await page.locator('#editorPagePicker').selectOption('/teachers/#/en');await until(async()=>await frame.locator('html').getAttribute('lang')==='en');
  assert.notEqual(await frame.locator('#loginTitle').innerText(),'Bonjour professeur !');
  await frame.locator('a.brand').click();await frame.locator('.landing-title-main').waitFor();
  await until(async()=>await page.locator('#editorRoute').inputValue()==='/#/welcome');
  await pick('كورك مرتّب');assert.equal(await page.locator('#pickedValue').inputValue(),'Footer editing works');
  await page.locator('[data-action=save]').click();await until(async()=>/Draft saved/.test(await page.locator('#saveState').innerText()));
  const saved=await page.evaluate(async()=>await(await fetch('/api/admin/site-content')).json());
  assert.ok(saved.draft.texts.some(x=>x.route==='/teachers/#/fr'&&x.value==='Bonjour professeur !'));
  assert.ok(saved.draft.texts.some(x=>x.attribute==='placeholder'&&x.value==='Search all your courses'));
  assert.deepEqual(saved.published,baseline.published,'Draft edits must not change live content');
  await page.reload();await page.locator('#workspace:not([hidden])').waitFor();await page.locator('#sidebar [data-nav=editor]').click();
  await page.locator('#editorPagePicker').selectOption('/teachers/#/fr');await until(async()=>await frame.locator('#loginTitle').innerText()==='Bonjour professeur !');
  console.log('PASS expanded Admin editor: footer, hints, calculator, teacher languages, draft persistence and private data boundary');
}finally{
  if(baseline)await page.evaluate(async original=>{const current=await(await fetch('/api/admin/site-content')).json();const r=await fetch('/api/admin/site-content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:current.revision,content:original.draft})});if(!r.ok)throw Error('Local cleanup failed');},baseline);
  await context.close();await browser.close();
}
