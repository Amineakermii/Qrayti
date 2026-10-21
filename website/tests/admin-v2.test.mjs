import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Never run mutation tests against a deployed website.
const base='http://127.0.0.1:8789';
let cookie='';
async function request(path,method='GET',body,auth=true,headers={}){
  const response=await fetch(base+path,{method,headers:{...(auth?{Cookie:cookie}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...headers},body:body instanceof FormData?body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json().catch(()=>null);return {response,data};
}
const get=async path=>(await request(path)).data;
test('local Admin v2 integration',async t=>{
  await t.test('login protects every new admin API',async()=>{
    for(const path of ['site-content','site-versions','media','export','items','faq','static-items'])assert.equal((await request('/api/admin/'+path,'GET',undefined,false)).response.status,401,path);
    assert.equal((await request('/api/admin-login','POST',{password:'wrong'},false)).response.status,401);
    const login=await request('/api/admin-login','POST',{password:'local-admin-test-only'},false);assert.equal(login.response.status,200);cookie=login.response.headers.get('set-cookie').split(';')[0];
    const rejected=await request('/api/admin/site-content','PUT',{},{}, {Origin:'https://untrusted.example'});assert.equal(rejected.response.status,403);
  });
  await t.test('draft is private; stale writers cannot overwrite; history restores only to draft',async()=>{
    const start=await get('/api/admin/site-content'),publicBefore=(await get('/api/site-content')).content;
    const draft=structuredClone(start.draft);draft.home.title='Private draft '+Date.now();draft.texts=[{id:'test-text',route:'/#/welcome',original:'test',value:'<img src=x onerror=alert(1)>'}];
    const saved=await request('/api/admin/site-content','PUT',{revision:start.revision,content:draft});assert.equal(saved.response.status,200);assert.equal(saved.data.draft.home.title,draft.home.title);
    assert.deepEqual((await get('/api/site-content')).content,publicBefore);
    assert.equal((await request('/api/admin/site-content','PUT',{revision:start.revision,content:draft})).response.status,409);
    const invalid=structuredClone(draft);invalid.brand.logo='https://untrusted.example/p.png';assert.equal((await request('/api/admin/site-content','PUT',{revision:saved.data.revision,content:invalid})).response.status,400);
    const published=await request('/api/admin/site-content','POST',{revision:saved.data.revision,action:'publish'});assert.equal(published.response.status,200);assert.equal((await get('/api/site-content')).content.home.title,draft.home.title);
    const versions=(await get('/api/admin/site-versions')).versions;assert.equal(versions[0].revision,published.data.revision);
    const second=structuredClone(draft);second.home.title='Second draft';const saved2=await request('/api/admin/site-content','PUT',{revision:published.data.revision,content:second});
    const restore=await request('/api/admin/site-content','POST',{revision:saved2.data.revision,action:'restore',id:versions[0].id});assert.equal(restore.response.status,200);assert.equal(restore.data.draft.home.title,draft.home.title);assert.equal((await get('/api/site-content')).content.home.title,draft.home.title);
    // Restore the local test baseline, not production data.
    const reset=await request('/api/admin/site-content','PUT',{revision:restore.data.revision,content:start.published});const resetPublished=await request('/api/admin/site-content','POST',{revision:reset.data.revision,action:'publish'});await request('/api/admin/site-content','PUT',{revision:resetPublished.data.revision,content:start.draft});
  });
  await t.test('image upload persists real bytes and rejects active HTML',async()=>{
    const invalid=new FormData();invalid.append('file',new Blob(['<html>bad</html>'],{type:'image/png'}),'fake.png');assert.equal((await request('/api/admin/media','POST',invalid)).response.status,400);
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=','base64');const form=new FormData();form.append('file',new Blob([png],{type:'image/png'}),'test-image.png');
    const upload=await request('/api/admin/media','POST',form);assert.equal(upload.response.status,201);const asset=await fetch(base+upload.data.item.url);assert.equal(asset.status,200);assert.equal(asset.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await asset.arrayBuffer()),png);
  });
  await t.test('uploaded courses stay private until published and preserve source attribution',async()=>{
    const meta={licence:'info',year:1,semester:1,track:'common',subjectId:'test-admin',subjectName:'Test subject',category:'cours',group:'Chapter 1',displayName:'Test course',rightsConfirmed:true,status:'draft',sourceInstructor:'Test teacher'};
    const form=new FormData();form.append('file',new Blob(['Test course file'],{type:'text/plain'}),'test.txt');form.append('meta',JSON.stringify(meta));const upload=await request('/api/admin/upload','POST',form);assert.equal(upload.response.status,201);const id=upload.data.item.id;
    assert.equal((await fetch(base+'/api/files/'+id)).status,404);
    assert.equal((await get('/api/catalog?licence=info&year=1&semester=1')).files.some(f=>f.id===id),false);
    assert.equal((await request('/api/admin/item/'+id,'PATCH',{...meta,status:'published'})).response.status,200);
    const file=(await get('/api/catalog?licence=info&year=1&semester=1')).files.find(f=>f.id===id);assert.equal(file.sourceInstructor,'Test teacher');assert.equal(await (await fetch(base+file.assetUrl)).text(),'Test course file');
    await request('/api/admin/item/'+id,'PATCH',{...meta,status:'hidden'});assert.equal((await fetch(base+'/api/files/'+id)).status,404);
  });
  await t.test('original course edits are returned in the public catalog without changing stored assets',async()=>{
    const index=JSON.parse(await readFile(new URL('../site/admin/static-index.json',import.meta.url),'utf8'));const file=index.items[0];
    const saved=await request('/api/admin/static-items','PUT',{id:file.id,meta:{...file,displayName:'Renamed original',originalGroup:file.group,group:'Renamed chapter',status:'hidden'}});assert.equal(saved.response.status,200);
    const q=new URLSearchParams({licence:file.licence,year:file.year,semester:file.semester,track:file.track||'common'});const catalog=await get('/api/catalog?'+q);const override=catalog.overrides.find(x=>x.id===file.id);assert.equal(override.displayName,'Renamed original');assert.equal(override.status,'hidden');assert.equal(override.groupTitle,'Renamed chapter');
    await request('/api/admin/static-items','PUT',{id:file.id,meta:{...file,status:'published'}});
  });
  await t.test('FAQ and Hama keep changes across reloads',async()=>{
    for(const path of ['faq','mascot']){const original=(await get('/api/admin/'+path)).config;const changed={...original,name:'Saved test name',enabled:false};const save=await request('/api/admin/'+path,'PUT',{config:changed});assert.equal(save.response.status,200);assert.equal((await get('/api/admin/'+path)).config.name,'Saved test name');await request('/api/admin/'+path,'PUT',{config:original});}
  });
});
