import assert from 'node:assert/strict';
import {test, after} from 'node:test';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=fileURLToPath(new URL('../site/',import.meta.url));
const server=createServer(async(req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path.startsWith('/api/')){res.writeHead(401,{'Content-Type':'application/json'}).end('{"error":"Unauthorized"}');return;}
  const file=resolve(root,'.'+path+(path.endsWith('/')?'index.html':''));
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  try{const bytes=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const local=`http://127.0.0.1:${server.address().port}`;
const base=process.env.QRAYTI_THEME_BASE||local;
if(base!==local&&!/^https:\/\/(?:[a-z0-9-]+\.)?qrayti\.(?:tn|pages\.dev)$/.test(base))throw Error('Only Qrayti hosts may be checked');
const browser=await chromium.launch({headless:true,executablePath:(process.env.CHROMIUM_PATH || undefined)});
after(async()=>{await browser.close();await new Promise(r=>server.close(r));});
await mkdir(new URL('../test-results/',import.meta.url),{recursive:true});

// A lost click handler, incorrect aria state, replaced orb, or reset preference must fail these checks.
for(const [name,path,selector,key] of [
  ['website','/','#themeBtn','theme'],
  ['admin','/admin/','[data-theme-toggle]','qrayti-admin-theme'],
  ['admin-alias','/admin/v2.html','[data-theme-toggle]','qrayti-admin-theme'],
  ['teachers','/teachers/','[data-theme-toggle]','qrayti-teacher-theme']
])test(`${name}: sun/moon control changes and saves the theme without replacing its animated orb`,async()=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'reduce',serviceWorkers:'block'});
  try{
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+path);
    const button=page.locator(selector);await button.waitFor();
    assert.equal(await button.getAttribute('role'),'switch');
    assert.equal(await button.getAttribute('aria-checked'),'false');
    assert.ok(await button.getAttribute('aria-label'));
    const orb=await button.locator('.theme-orb').elementHandle();assert.ok(orb);
    if(name==='admin')await page.locator('[name=password]').fill('unsent local typing');
    await button.focus();await page.keyboard.press('Space');
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    assert.equal(await button.getAttribute('aria-checked'),'true');
    assert.equal(await orb.evaluate(el=>el.isConnected),true,'Preserve the orb so its transition can play');
    assert.equal(await button.evaluate(el=>el===document.activeElement),true);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'dark');
    assert.equal(await button.locator('.theme-orb').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    if(name==='admin'){
      assert.equal(await page.locator('[name=password]').inputValue(),'unsent local typing');
      await page.locator('[data-lang=en]').click();
      assert.equal(await button.getAttribute('aria-checked'),'true');
      assert.equal(await button.getAttribute('aria-label'),'Dark mode');
    }
    await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.emulateMedia({reducedMotion:'no-preference'});
    assert.notEqual(await button.locator('.theme-orb').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [375,320]){
      await page.setViewportSize({width,height:844});
      const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44);
      assert.ok(box.x>=0&&box.x+box.width<=width,'Switch must fit on a small phone');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
      if(name==='website'){
        const brand=await page.locator('.brand').boundingBox();
        assert.ok(box.x+box.width<=brand.x||brand.x+brand.width<=box.x,'Brand and switch must not overlap');
      }
    }
    await page.setViewportSize({width:375,height:844});
    await page.screenshot({path:fileURLToPath(new URL(`../test-results/theme-${name}-dark.png`,import.meta.url))});
    await button.click();assert.equal(await button.getAttribute('aria-checked'),'false');
    await page.screenshot({path:fileURLToPath(new URL(`../test-results/theme-${name}-light.png`,import.meta.url))});
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
