import test from 'node:test';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:8791';
let admin='',teacherA='',teacherB='',a,b,submission;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=','base64');
const meta={licence:'info',year:1,semester:1,track:'common',subjectId:'teacher-test',subjectName:'Teacher test',category:'cours',displayName:'A lecture',group:'Chapter one'};
async function call(path,method='GET',body,cookie='',extra={}){
  const raw=Buffer.isBuffer(body);const r=await fetch(base+path,{method,headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':raw?'application/octet-stream':'application/json'}:{}),...extra},body:body===undefined?undefined:raw?body:JSON.stringify(body)});
  const data=await r.clone().json().catch(()=>null);return {r,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};
}
async function invitation(name){const x=await call('/api/admin/teachers','POST',{name,email:'teacher@example.com',university:'Université de Tunis',institution:'Faculté des Sciences'},admin);assert.equal(x.r.status,201,JSON.stringify(x.data));return x.data;}
async function reserve(cookie=teacherA,overrides={}){return call('/api/teachers/upload','POST',{filename:'lecture.png',declaredSize:png.length,requestId:crypto.randomUUID(),rightsConfirmed:true,meta,...overrides},cookie);}
test('teacher portal authorization and moderation lifecycle',async t=>{
  await t.test('new teacher endpoints deny anonymous access',async()=>{
    assert.equal((await call('/api/teachers/submissions')).r.status,401);
    assert.equal((await call('/api/admin/teachers')).r.status,401);
  });
  const login=await call('/api/admin-login','POST',{password:'local-admin-test-only'});assert.equal(login.r.status,200);admin=login.cookie;
  await t.test('individual invitations cannot grant admin or another teacher access',async()=>{
    a=await invitation('Teacher A');b=await invitation('Teacher B');
    const signed=await call('/api/teachers/session','POST',{token:a.token});assert.equal(signed.r.status,200);teacherA=signed.cookie;
    assert.match(signed.r.headers.get('set-cookie'),/HttpOnly/);assert.match(signed.r.headers.get('set-cookie'),/Secure/);
    teacherB=(await call('/api/teachers/session','POST',{token:b.token})).cookie;
    assert.equal((await call('/api/admin/site-content','GET',undefined,teacherA)).r.status,401);
    assert.equal((await call('/api/teachers/session','POST',{token:'incorrect'})).r.status,401);
    assert.equal((await call('/api/admin/teachers','POST',{},admin,{Origin:'https://evil.example'})).r.status,403);
    const list=await call('/api/admin/teachers','GET',undefined,admin);assert.ok(!JSON.stringify(list.data).includes(a.token));
  });
  await t.test('private upload cannot be forged, published, or accessed by another teacher',async()=>{
    assert.equal((await reserve(teacherA,{rightsConfirmed:false})).r.status,400);
    assert.equal((await reserve(teacherA,{declaredSize:26214401})).r.status,413);
    const requestId=crypto.randomUUID();const reserved=await reserve(teacherA,{requestId,teacherId:b.teacher.id,status:'published'});assert.equal(reserved.r.status,201,JSON.stringify(reserved.data));submission=reserved.data.id;
    const repeat=await reserve(teacherA,{requestId});assert.equal(repeat.data.id,submission);
    assert.equal((await call('/api/teachers/upload?id='+submission,'PUT',png,teacherB)).r.status,404);
    const up=await call('/api/teachers/upload?id='+submission,'PUT',png,teacherA);assert.equal(up.r.status,201,JSON.stringify(up.data));assert.equal(up.data.item.status,'pending');
    assert.equal((await call('/api/teachers/submissions/'+submission+'/file','GET',undefined,teacherB)).r.status,404);
    assert.equal((await call('/api/teachers/submissions/'+submission+'/file')).r.status,401);
    const own=await call('/api/teachers/submissions/'+submission+'/file','GET',undefined,teacherA);assert.equal(own.r.status,200);assert.deepEqual(Buffer.from(await own.r.arrayBuffer()),png);assert.match(own.r.headers.get('cache-control'),/no-store/);
    const head=await call('/api/teachers/submissions/'+submission+'/file','HEAD',undefined,teacherA);assert.equal(head.r.status,200);assert.equal(Number(head.r.headers.get('content-length')),png.length);assert.equal((await head.r.arrayBuffer()).byteLength,0);
    const range=await call('/api/teachers/submissions/'+submission+'/file','GET',undefined,teacherA,{Range:'bytes=0-7'});assert.equal(range.r.status,206);assert.deepEqual(Buffer.from(await range.r.arrayBuffer()),png.subarray(0,8));
    assert.equal((await call('/api/files/'+submission)).r.status,404);
    const listed=await call('/api/teachers/submissions','GET',undefined,teacherA);assert.ok(!JSON.stringify(listed.data).includes('r2_key'));
  });
  await t.test('signatures and actual byte lengths are enforced and failed requests retry',async()=>{
    const bad=await reserve();assert.equal((await call('/api/teachers/upload?id='+bad.data.id,'PUT',Buffer.alloc(png.length,65),teacherA)).r.status,400);
    const length=await reserve();assert.equal((await call('/api/teachers/upload?id='+length.data.id,'PUT',Buffer.concat([png,png]),teacherA)).r.status,400);
    assert.equal((await reserve(teacherA,{filename:'script.html'})).r.status,400);
  });
  await t.test('approval is idempotent, publishes correct bytes and credits only',async()=>{
    const detail=await call('/api/admin/teacher-submissions/'+submission,'GET',undefined,admin);assert.equal(detail.r.status,200);
    const body={version:detail.data.item.version,action:'approve',meta:{...meta,displayName:'Approved lecture'}};
    const responses=await Promise.all([call('/api/admin/teacher-submissions/'+submission,'PATCH',body,admin),call('/api/admin/teacher-submissions/'+submission,'PATCH',body,admin)]);
    assert.ok(responses.some(x=>x.r.status===200),JSON.stringify(responses.map(x=>x.data)));
    const done=await call('/api/admin/teacher-submissions/'+submission,'PATCH',body,admin);assert.equal(done.r.status,200,JSON.stringify(done.data));const id=done.data.item.publishedFileId;
    const catalog=await call('/api/catalog?licence=info&year=1&semester=1');const file=catalog.data.files.find(x=>x.id===id);assert.equal(file.sourceInstructor,'Teacher A');assert.equal(file.displayName,'Approved lecture');assert.ok(!JSON.stringify(file).includes('teacher@example.com'));
    assert.deepEqual(Buffer.from(await(await fetch(base+file.assetUrl)).arrayBuffer()),png);
    assert.equal(catalog.data.files.filter(x=>x.id===id).length,1);
    assert.equal((await call('/api/admin/teacher-submissions/'+submission,'PATCH',{action:'reject',version:1,reason:'No'},admin)).r.status,409);
  });
  await t.test('rejection needs a reason and remains private',async()=>{
    const reserved=await reserve();const id=reserved.data.id;await call('/api/teachers/upload?id='+id,'PUT',png,teacherA);
    assert.equal((await call('/api/admin/teacher-submissions/'+id,'PATCH',{action:'reject',version:1,reason:''},admin)).r.status,400);
    const rejected=await call('/api/admin/teacher-submissions/'+id,'PATCH',{action:'reject',version:1,reason:'Please send the updated chapter'},admin);assert.equal(rejected.r.status,200);assert.equal(rejected.data.item.status,'rejected');
    const mine=await call('/api/teachers/submissions','GET',undefined,teacherA);assert.equal(mine.data.items.find(x=>x.id===id).feedback,'Please send the updated chapter');assert.equal((await call('/api/files/'+id)).r.status,404);
  });
  await t.test('parallel quota reservations are atomic',async()=>{
    const c=await invitation('Quota teacher');const cookie=(await call('/api/teachers/session','POST',{token:c.token})).cookie;
    const many=await Promise.all(Array.from({length:23},()=>reserve(cookie)));assert.equal(many.filter(x=>x.r.status===201).length,20);assert.equal(many.filter(x=>x.r.status===429).length,3);
  });
  await t.test('failed uploads cannot bypass the hourly attempt ceiling',async()=>{
    const c=await invitation('Attempt limit teacher'),cookie=(await call('/api/teachers/session','POST',{token:c.token})).cookie;
    for(let i=0;i<60;i++){
      const r=await reserve(cookie);assert.equal(r.r.status,201);
      assert.equal((await call('/api/teachers/upload?id='+r.data.id,'PUT',Buffer.alloc(png.length,65),cookie)).r.status,400);
    }
    const limited=await reserve(cookie);assert.equal(limited.r.status,429);assert.ok(limited.data.retryAt);
  });
  await t.test('rotate and revoke invalidate old sessions and pending uploads',async()=>{
    const rotated=await call('/api/admin/teachers/'+a.teacher.id,'PATCH',{action:'rotate'},admin);assert.equal(rotated.r.status,200);
    assert.equal((await call('/api/teachers/submissions','GET',undefined,teacherA)).r.status,401);
    assert.equal((await call('/api/teachers/session','POST',{token:a.token})).r.status,401);
    const again=await call('/api/teachers/session','POST',{token:rotated.data.token});assert.equal(again.r.status,200);
    await call('/api/admin/teachers/'+a.teacher.id,'PATCH',{action:'revoke'},admin);
    assert.equal((await call('/api/teachers/submissions','GET',undefined,again.cookie)).r.status,401);
  });
});
