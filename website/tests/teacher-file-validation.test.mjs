import test from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import {readValidatedFile} from '../functions/_lib/teacher-files.js';
const validate=(bytes,name)=>readValidatedFile(new Request('https://local.test',{method:'PUT',body:bytes}),{original_name:name,size:bytes.length});
const office=(main,extra={})=>zipSync({'[Content_Types].xml':strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>'),[main]:strToU8('<document>Lesson</document>'),...extra});
test('accepts bounded DOCX and PPTX containers',async()=>{
  for(const [main,name] of [['word/document.xml','lesson.docx'],['ppt/presentation.xml','lesson.pptx']]){
    const bytes=office(main),result=await validate(bytes,name);assert.equal(result.size,bytes.length);assert.match(result.sha256,/^[a-f0-9]{64}$/);
  }
});
test('rejects mislabeled, macro, traversal and truncated Office archives',async()=>{
  const good=office('word/document.xml');
  for(const [bytes,name] of [[good,'lesson.pptx'],[office('word/document.xml',{'word/vbaProject.bin':new Uint8Array([1])}),'lesson.docx'],[office('word/document.xml',{'../outside.xml':strToU8('x')}),'lesson.docx'],[good.slice(0,-2),'lesson.docx']])await assert.rejects(validate(bytes,name));
});
test('bounds actual expanded main XML size',async()=>{
  const bytes=office('word/document.xml',{'word/document.xml':strToU8('x'.repeat(4*1024*1024+1))});
  await assert.rejects(validate(bytes,'large.docx'),/oversized|too large/i);
});
