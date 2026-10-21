import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest} from '../functions/api/teachers/upload.js';

const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=','base64');
for(const mode of ['committed','uncertain','failed'])test('upload cleanup preserves accepted or uncertain bytes: '+mode,async()=>{
  let stored=false,status='reserved';
  const row=()=>({id:'s',teacher_id:'t',generation:1,status,original_name:'x.png',size:bytes.length,r2_key:'submissions/s'});
  const db={prepare(sql){return {bind(){return this;},async first(){
    if(sql.includes('JOIN teachers'))return {id:'t',generation:1};
    if(sql.startsWith('SELECT *'))return row();
    if(sql.includes("SET status='receiving'")){status='receiving';return row();}
    if(sql.includes("SET status='pending'")){if(mode==='committed')status='pending';throw Error('Lost database response');}
    if(sql.includes("SET status='failed'")){if(mode==='uncertain')throw Error('Database unavailable');if(status!=='receiving')return null;status='failed';return {id:'s'};}
    throw Error('Unexpected query '+sql);
  },async run(){if(sql.includes("SET status='failed'")&&status==='receiving')status='failed';return {meta:{changes:1}};}};}};
  const response=await onRequest({request:new Request('https://local.test/api/teachers/upload?id=s',{method:'PUT',headers:{Origin:'https://local.test',Cookie:'qrayti_teacher='+'a'.repeat(64)},body:bytes}),env:{CATALOG_DB:db,TEACHER_UPLOADS:{async put(){stored=true;},async delete(){stored=false;}}}});
  assert.equal(response.status,503);
  assert.equal(stored,mode!=='failed');
  if(mode==='committed')assert.equal(status,'pending');
});
