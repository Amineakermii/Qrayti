const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function previewURL(route){
  if(/^\/teachers\/#\/(fr|en)$/.test(route))return '/teachers/?admin-preview=1&preview-language='+route.split('/').at(-1);
  if(/^\/#\/[a-zA-Z0-9_/?=&%.-]*$/.test(route))return '/?admin-preview=1'+route.slice(1);
  return '/?admin-preview=1#/welcome';
}
export function mountEditorTools({container,frame,t,catalog,onPick,onNavigate,onPanel,route}){
  const pages=[['/#/welcome',t('الرئيسية','Homepage')],['/#/licence',t('الإجازات','Licences')],['/#/average',t('احسب معدلي','Grade calculator')],['/#/language-check',t('اختبار اللغات','Language check')],['/teachers/#/fr','Enseignants · Français'],['/teachers/#/en','Teachers · English']];
  const seen=new Set();
  for(const file of catalog){
    const query=new URLSearchParams({licence:file.licence||'info',year:String(file.year||1),track:file.track||'common',semester:String(file.semester||1)});
    const semester='/#/subjects?'+query;if(!seen.has(semester)){seen.add(semester);pages.push([semester,`${file.licence} · Y${file.year} / S${file.semester} · ${file.track||'common'}`]);}
    const subjectQuery=new URLSearchParams({licence:file.licence||'info',id:file.subjectId,year:String(file.year||1),track:file.track||'common',semester:String(file.semester||1)});const subject='/#/subject?'+subjectQuery;
    if(file.subjectId&&!seen.has(subject)){seen.add(subject);pages.push([subject,'↳ '+(file.subjectName||file.subjectId)]);}
  }
  const panel=document.createElement('section');panel.className='card editor-page-tools';
  panel.innerHTML=`<h2>${t('كل صفحات قرايتي','All Qrayti pages')}</h2><label>${t('اختار الصفحة','Choose a page')}<select id="editorPagePicker">${pages.map(([value,label])=>`<option value="${escape(value)}">${escape(label)}</option>`).join('')}</select></label><label>${t('مسار الصفحة الحالية','Current page path')}<input id="editorRoute" dir="ltr" value="${escape(route)}"></label><button type="button" id="editorGo">${t('افتح في المعاينة','Open preview')}</button><p class="hint">${t('تنجم تتصفح المواد والملفات داخل المعاينة. اختار عنصر لتعديل النص أو الصورة.','Browse subjects and files inside the preview. Use Select element to change text or images.')}</p><div class="editor-popup-actions">${[['about',t('شكون إحنا / تواصل','About / contact')],['faq','Badis'],['install',t('تحميل التطبيق','App download')],['search',t('البحث','Search')]].map(([id,label])=>`<button type="button" data-editor-panel="${id}">${label}</button>`).join('')}</div><h3>${t('كلمات الصفحة','Words on this page')}</h3><label>${t('لوّج على كلمة، زر أو تلميح','Find a word, button or hint')}<input id="editorTextSearch" type="search" autocomplete="off"></label><p class="hint">${t('يشمل النوافذ المخفية وتلميحات الإدخال. كلمات السر والبيانات الخاصة لا تظهر هنا.','Includes hidden popups and input hints. Passwords and private data are excluded.')}</p><div class="editor-inventory" aria-live="polite"></div>`;
  container.prepend(panel);let items=[];
  const picker=panel.querySelector('#editorPagePicker'),address=panel.querySelector('#editorRoute'),search=panel.querySelector('#editorTextSearch'),list=panel.querySelector('.editor-inventory');
  function render(){const q=search.value.trim().toLocaleLowerCase();const matches=items.map((item,i)=>({item,i})).filter(({item})=>(item.value+' '+item.original).toLocaleLowerCase().includes(q));list.innerHTML=matches.slice(0,100).map(({item,i})=>`<button type="button" data-inventory-item="${i}"><small>${item.attribute?escape(item.attribute):t('نص','Text')}</small><span>${escape(item.value||item.original)}</span></button>`).join('')||`<p class="hint">${t('ما فماش نتيجة في الصفحة هذه.','No matching text on this page.')}</p>`;}
  function navigate(value){if(!/^\/#\/[a-zA-Z0-9_/?=&%.-]*$/.test(value)&&!/^\/teachers\/#\/(fr|en)$/.test(value)){address.setCustomValidity(t('استعمل مسار صفحة قرايتي، أو اختار من القائمة.','Use a Qrayti page path, or choose from the list.'));address.reportValidity();return;}address.setCustomValidity('');items=[];search.value='';render();onNavigate(value);frame.src=previewURL(value);}
  picker.addEventListener('change',()=>navigate(picker.value));panel.querySelector('#editorGo').addEventListener('click',()=>navigate(address.value.trim()));
  address.addEventListener('input',()=>address.setCustomValidity(''));search.addEventListener('input',render);
  panel.addEventListener('click',e=>{const picked=e.target.closest('[data-inventory-item]');if(picked){onPick({...items[Number(picked.dataset.inventoryItem)]});return;}const popup=e.target.closest('[data-editor-panel]');if(popup){onPanel();frame.contentWindow.postMessage({source:'qrayti-admin',type:'open-panel',panel:popup.dataset.editorPanel},location.origin);}});
  function update(data){if(data.route){address.value=data.route;picker.value=data.route;}if(data.items){items=data.items;render();}}
  update({route});render();return {update};
}
