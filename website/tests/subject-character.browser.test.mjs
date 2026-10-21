import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=fileURLToPath(new URL('../site/',import.meta.url));
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const fixture={enabled:true,name:'حما غراب',minDelaySec:10,maxDelaySec:10,maxPerSession:1,scenarios:[{id:'saved-question',enabled:true,weight:1,prompt:'السؤال المحفوظ',choices:[{label:'الاختيار المحفوظ',reply:'الجواب المحفوظ'}]}]};

test('subject art and characters keep saved behavior across phone, desktop and reduced motion',async()=>{
  const server=createServer(async(req,res)=>{
    const path=decodeURIComponent(new URL(req.url,'http://local.test').pathname);
    if(path.startsWith('/api/')){res.writeHead(200,{'Content-Type':'application/json'});res.end('{}');return;}
    const target=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(!target.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
    try{const body=await readFile(target);res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.env.CHROMIUM_PATH || undefined)});
  const origin=`http://127.0.0.1:${server.address().port}`;
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/#/subjects?licence=info&year=1&semester=1&track=common');
    await page.waitForSelector('.subject-card');
    assert.equal(await page.locator('.subject-card .subject-art-image').count(),await page.locator('.subject-card').count(),'each subject shows artwork instead of an emoji');
    // The stylesheet can be checked independently while another task integrates its HTML include.
    if(!await page.locator('link[href*="subject-character.css"]').count())await page.addStyleTag({url:origin+'/assets/subject-character.css'});
    const contexts=[['info',1,1],['info',1,2],['info',2,1],['info',2,2],['lt',1,1],['lt',1,2],['lce',1,1],['lce',1,2]];
    const seen=new Set();
    for(const [licence,year,semester] of contexts){
      await page.goto(origin+`/?context=${licence}-${year}-${semester}#/subjects?licence=${licence}&year=${year}&semester=${semester}&track=genie`);
      await page.waitForSelector('.subject-card');
      const cards=page.locator('.subject-card');
      for(let i=0;i<await cards.count();i++){
        const card=cards.nth(i),img=card.locator('.subject-art-image');
        await card.scrollIntoViewIfNeeded();
        await img.evaluate(el=>el.decode());
        const id=new URL((await card.getAttribute('data-go')),'http://local.test').searchParams.get('id');seen.add(id);
        assert.match(await img.getAttribute('src'),new RegExp(`subject_${id==='web2'?'webdesign':id}\\.webp$`),`specific artwork for ${id}`);
        assert.equal(await img.getAttribute('loading'),'lazy');
        assert.ok(Number(await img.getAttribute('width'))>0&&Number(await img.getAttribute('height'))>0);
      }
    }
    assert.ok(seen.size>=80,'all catalog contexts exercised');
    await page.route('**/api/catalog?**',route=>route.fulfill({json:{files:[{id:'future-file',subject:'future-math',subjectName:'Future algebra',subjectAr:'مادة جديدة',category:'cours',categoryName:'Cours',kind:'pdf',name:'future.pdf'}]}}));
    await page.goto(origin+'/?fresh=1#/subjects?licence=info&year=1&semester=1&track=common');
    if(!await page.locator('link[href*="subject-character.css"]').count())await page.addStyleTag({url:origin+'/assets/subject-character.css'});
    const fallback=page.locator('[data-go*="id=future-math"] .subject-art-image');
    await fallback.waitFor();await fallback.scrollIntoViewIfNeeded();await fallback.evaluate(el=>el.decode());
    assert.match(await fallback.getAttribute('src'),/subject_art_math\.webp$/,'new subjects receive a category illustration');
    for(const width of [375,820,1280]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>scrollTo(0,0));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`no horizontal overflow at ${width}`);
      if(process.env.ARTIFACT_DIR)await page.screenshot({path:resolve(process.env.ARTIFACT_DIR,`subjects-${width}.png`)});
      await page.locator('#faqBtn').click();
      assert.equal(await page.locator('#faqModal.show').count(),1);
      const rect=await page.locator('.faq-panel').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width+1);
      assert.ok(await page.evaluate(()=>!!document.elementFromPoint(innerWidth/2,innerHeight-25)?.closest('#faqModal')),'open FAQ covers fixed navigation');
      if(process.env.ARTIFACT_DIR)await page.screenshot({path:resolve(process.env.ARTIFACT_DIR,`badis-${width}.png`)});
      await page.keyboard.press('Escape');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#faqBtn').focus();
    assert.equal(await page.locator('#faqBtn .faq-character').evaluate(el=>getComputedStyle(el).animationName),'none','Badis honors reduced motion');
    assert.equal(await page.locator('#faqBtn .arm-right').evaluate(el=>getComputedStyle(el).transform),'none');
    assert.deepEqual(errors,[]);
    await page.close();

    for(const enabled of [false,true]){
      const crow=await browser.newPage({viewport:{width:375,height:812},reducedMotion:'reduce'});
      await crow.clock.install();
      await crow.route('**/api/mascot',route=>route.fulfill({json:{config:{...fixture,enabled}}}));
      await crow.goto(origin+'/#/subject?licence=info&year=1&semester=1&track=common&id=y1_c');
      if(!await crow.locator('link[href*="subject-character.css"]').count())await crow.addStyleTag({url:origin+'/assets/subject-character.css'});
      await crow.waitForSelector('.category-card');await crow.clock.fastForward(11000);
      if(!enabled){assert.equal(await crow.locator('#studyOwl').count(),0,'disabled mascot remains absent');}
      else{
        await crow.waitForSelector('#studyOwl.owl-arrive');
        assert.equal(await crow.locator('#studyOwl svg.hama-crow').count(),1,'Hama renders as a crow');
        assert.equal(await crow.locator('#studyOwl .owl-talk>b').textContent(),fixture.scenarios[0].prompt);
        if(process.env.ARTIFACT_DIR)await crow.screenshot({path:resolve(process.env.ARTIFACT_DIR,'hama-phone.png')});
        const bounds=await crow.locator('#studyOwl').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=375);
        assert.equal(await crow.locator('.hama-crow .crow-wing').first().evaluate(el=>getComputedStyle(el).animationName),'none');
        await crow.locator('[data-owl-choice="0"]').click();
        assert.equal(await crow.locator('#studyOwl .owl-talk>b').textContent(),fixture.scenarios[0].choices[0].reply);
        await crow.locator('[data-owl-close]').click();await crow.clock.fastForward(1000);
        assert.equal(await crow.locator('#studyOwl').count(),0);
      }
      await crow.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
