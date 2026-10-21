import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,access,mkdir,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const module=await import('./cloud-content.mjs').catch(()=>null);
const entry={path:'content/hello.txt',size:5,sha256:'2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'};
test('missing course assets block release verification',async()=>{
  assert.ok(module,'Course preservation tool must exist');
  const root=await mkdtemp(join(tmpdir(),'qrayti-check-'));
  await assert.rejects(()=>module.verifyFiles(root,[entry]),/missing/i);
});
test('only exact manifest bytes are restored and verified',async()=>{
  assert.ok(module,'Course preservation tool must exist');
  const root=await mkdtemp(join(tmpdir(),'qrayti-restore-'));
  await module.restoreFile(root,entry,async()=>new Response('hello'));
  assert.equal(await readFile(join(root,entry.path),'utf8'),'hello');
  await module.verifyFiles(root,[entry]);
});
test('HTML fallbacks, corrupt bytes and oversized responses never become course files',async()=>{
  assert.ok(module,'Course preservation tool must exist');
  for(const body of ['wrong','<html>not a course</html>']){
    const root=await mkdtemp(join(tmpdir(),'qrayti-invalid-'));
    await assert.rejects(()=>module.restoreFile(root,entry,async()=>new Response(body)),/integrity|size/i);
    await assert.rejects(()=>access(join(root,entry.path)));
  }
});
test('manifest paths cannot escape the content directory',()=>{
  assert.ok(module,'Course preservation tool must exist');
  for(const path of ['../.env','content/../../.env','content\\evil','/content/x','content/a?b','content/%2e%2e/x'])assert.throws(()=>module.validateEntry({...entry,path}));
});
test('valid existing assets are reused without a network request',async()=>{
  const root=await mkdtemp(join(tmpdir(),'qrayti-reuse-'));
  await mkdir(join(root,'content'));
  await writeFile(join(root,entry.path),'hello');
  await module.restoreFile(root,entry,()=>{throw Error('Unexpected network request');});
});
test('mismatched existing assets are preserved, never replaced',async()=>{
  const root=await mkdtemp(join(tmpdir(),'qrayti-preserve-'));
  await mkdir(join(root,'content'));
  await writeFile(join(root,entry.path),'owner data');
  await assert.rejects(()=>module.restoreFile(root,entry,()=>{throw Error('Unexpected network request');}),/integrity/);
  assert.equal(await readFile(join(root,entry.path),'utf8'),'owner data');
});
test('linked content directories cannot redirect writes outside the site',async()=>{
  const root=await mkdtemp(join(tmpdir(),'qrayti-link-'));
  const outside=await mkdtemp(join(tmpdir(),'qrayti-outside-'));
  await symlink(outside,join(root,'content'),process.platform==='win32'?'junction':'dir');
  await assert.rejects(()=>module.restoreFile(root,entry,()=>{throw Error('Unexpected network request');}),/Symlink/);
  await assert.rejects(()=>access(join(outside,'hello.txt')));
});
