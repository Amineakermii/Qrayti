import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blankContent,normalizeContent} from '../functions/_lib/site-content.js';
test('teacher language copy and safe input hints round trip without admitting executable attributes',()=>{
  const content=blankContent();
  content.texts=[{id:'teacher-title',route:'/teachers/#/fr',original:'Bienvenue',value:'Bonjour professeur'},
    {id:'search-hint',route:'/#/welcome',original:'Search',value:'Find a subject',attribute:'placeholder'}];
  const normalized=normalizeContent(content);
  assert.equal(normalized.texts[0].route,'/teachers/#/fr');
  assert.equal(normalized.texts[1].attribute,'placeholder');
  for(const attribute of ['onclick','src','href','value','style']){
    const invalid=structuredClone(content);invalid.texts[1].attribute=attribute;
    assert.throws(()=>normalizeContent(invalid));
  }
  for(const route of ['/admin/','/api/teachers/session','https://untrusted.test/','/teachers/../admin/#/fr']){
    const invalid=structuredClone(content);invalid.texts[0].route=route;
    assert.throws(()=>normalizeContent(invalid));
  }
});
