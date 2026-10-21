(() => {
  'use strict';
  const preview=new URLSearchParams(location.search).has('admin-preview')&&window.parent!==window;
  let config={},selecting=false,frame=0,selected=null,sequence=0,lastFields='',lastInventory='';
  const textFields={'home.badge':'.landing-screen .welcome-badge','home.title':'.landing-title-main','home.accent':'.landing-title-accent','home.description':'.landing-copy>p','home.cta':'.welcome-actions .primary-cta','home.install':'.install-cta b','brand.name':'.brand-name'};
  const originals=new WeakMap(),images=new WeakMap(),attrs=new WeakMap(),copyAttrs=new WeakMap();
  const isTeacher=location.pathname.startsWith('/teachers');
  const page=()=>isTeacher?'/teachers/#/'+(document.documentElement.lang==='en'?'en':'fr'):location.pathname+(location.hash||'#/welcome');
  const blocked='script,style,noscript,textarea,svg,[data-no-edit],#identity,#queue,#submissionList,#notice,#loginError,#uploadError,#fileError,#usage';
  // Query order must not make the same subject a different editable page.
  const routeKey=route=>{const index=route.indexOf('?');if(index<0)return route;const query=new URLSearchParams(route.slice(index+1));query.sort();return route.slice(0,index)+'?'+query.toString();};
  const samePage=route=>routeKey(route)===routeKey(page());
  const attributeBlocked=blocked.replace(',textarea','');
  const copyAttributes=['placeholder','title','aria-label'];
  const allowedImage=s=>typeof s==='string'&&/^\/(assets|api\/media)\//.test(s)&&!s.includes('..');
  const tell=(type,data={})=>{if(preview)parent.postMessage({source:'qrayti-site',type,...data},location.origin);};
  const remember=node=>{if(!originals.has(node))originals.set(node,node.nodeValue);return originals.get(node);};
  function textWalker(){return document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>!n.parentElement?.closest(blocked)&&(n.nodeValue.trim()||originals.has(n))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});}
  function attributeSource(el,key){
    const current=el.getAttribute(key)||'';let map=copyAttrs.get(el);if(!map){map={};copyAttrs.set(el,map);}
    if(!map[key]||current!==map[key].last)map[key]={original:current,last:current};return map[key];
  }
  function reportInventory(){
    if(!preview)return;
    const items=[],seen=new Set();
    const add=item=>{const key=[item.kind,item.attribute||'',item.original].join('|');if(item.original.trim()&&!seen.has(key)&&items.length<1200){seen.add(key);items.push({...item,route:page()});}};
    const walker=textWalker();let node;while(node=walker.nextNode())add({kind:'text',original:(originals.get(node)??node.nodeValue).trim(),value:node.nodeValue.trim()});
    document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el=>{if(el.closest(attributeBlocked))return;for(const attribute of copyAttributes){if(el.hasAttribute(attribute))add({kind:'attribute',attribute,original:attributeSource(el,attribute).original,value:el.getAttribute(attribute)});}});
    const signature=JSON.stringify({route:page(),items});if(signature!==lastInventory){lastInventory=signature;tell('inventory',{items,route:page()});}
  }
  function setText(el,value){if(!el)return;const node=[...el.childNodes].find(n=>n.nodeType===3&&(n.nodeValue.trim()||originals.has(n)));if(!node)return;const original=remember(node),next=value||original;if(node.nodeValue!==next)node.nodeValue=next;}
  function setAttr(el,key,value){if(!el)return;let a=attrs.get(el);if(!a){a={};attrs.set(el,a);}if(!(key in a))a[key]=el.getAttribute(key);const next=value||a[key];if(next==null)el.removeAttribute(key);else if(el.getAttribute(key)!==next)el.setAttribute(key,next);}
  function reportFields(){
    if(!preview)return;
    const fields={};
    for(const [path,selector] of Object.entries(textFields)){
      const el=document.querySelector(selector),node=el&&[...el.childNodes].find(n=>n.nodeType===3&&(n.nodeValue.trim()||originals.has(n)));
      if(node)fields[path]={value:node.nodeValue.trim(),original:remember(node).trim(),route:page()};
    }
    const email=document.querySelector('a[href^="mailto:"]'),instagram=document.querySelector('a[href*="instagram.com/"]');
    if(email)fields['contact.email']={value:email.getAttribute('href').slice(7).split('?')[0]};
    if(instagram)fields['contact.instagram']={value:instagram.getAttribute('href')};
    const payload={sequence,fields},signature=JSON.stringify(payload);
    if(signature!==lastFields){lastFields=signature;tell('fields',payload);}
  }
  function apply(){
    observer.disconnect();
    const home=config.home||{},brand=config.brand||{};
    const fields={'.landing-screen .welcome-badge':home.badge,'.landing-title-main':home.title,'.landing-title-accent':home.accent,'.landing-copy>p':home.description,'.welcome-actions .primary-cta':home.cta,'.install-cta b':home.install,'.brand-name':brand.name};
    for(const [selector,value] of Object.entries(fields))setText(document.querySelector(selector),value);
    const brandMark=document.querySelector('.brand-mark');
    if(brandMark){if(!brandMark.dataset.originalMarkup)brandMark.dataset.originalMarkup=brandMark.innerHTML;let img=brandMark.querySelector('.qrayti-managed-logo');if(brand.logo&&allowedImage(brand.logo)){if(!img){brandMark.textContent='';img=document.createElement('img');img.className='qrayti-managed-logo';img.alt='';brandMark.append(img);}setAttr(img,'src',brand.logo);}else if(img)brandMark.innerHTML=brandMark.dataset.originalMarkup;}
    const campus=document.querySelector('.campus-marquee-wrap');if(campus)campus.hidden=home.showCampuses===false;
    const copy=document.querySelector('.landing-copy');let photo=document.querySelector('.qrayti-home-photo');
    if(copy&&home.image&&allowedImage(home.image)){if(!photo){photo=document.createElement('figure');photo.className='qrayti-home-photo';photo.append(document.createElement('img'));copy.append(photo);}setAttr(photo.firstChild,'src',home.image);setAttr(photo.firstChild,'alt',home.imageAlt||'');}else photo?.remove();
    for(const [k,v] of Object.entries({primary:'--accent',secondary:'--accent-2'})){if(/^#[0-9a-f]{6}$/i.test(config.colors?.[k]||''))document.documentElement.style.setProperty(v,config.colors[k]);else document.documentElement.style.removeProperty(v);}
    document.querySelectorAll('a[href^="mailto:"]').forEach(el=>{if(config.contact?.email)setAttr(el,'href','mailto:'+config.contact.email);else setAttr(el,'href','');});
    document.querySelectorAll('a[href*="instagram.com/"]').forEach(el=>setAttr(el,'href',config.contact?.instagram));
    const relevant=[...(config.texts||[]).filter(x=>x.route==='*'),...(config.texts||[]).filter(x=>samePage(x.route))];
    const edits=new Map(relevant.filter(x=>!x.attribute).map(x=>[x.original,x.value]));
    const walker=textWalker();
    let n;while(n=walker.nextNode()){
      const original=originals.get(n)??n.nodeValue,key=original.trim();
      if(edits.has(key)){remember(n);const value=edits.get(key);if(n.nodeValue!==value)n.nodeValue=value;}
      else if(originals.has(n)&&!Object.keys(fields).some(sel=>n.parentElement.matches(sel))&&n.nodeValue!==original)n.nodeValue=original;
    }
    document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el=>{
      if(el.closest(attributeBlocked))return;
      for(const key of copyAttributes){if(!el.hasAttribute(key))continue;const source=attributeSource(el,key);const edit=relevant.findLast(x=>x.attribute===key&&x.original===source.original);const next=edit?edit.value:source.original;if(el.getAttribute(key)!==next)el.setAttribute(key,next);source.last=next;}
    });
    document.querySelectorAll('img:not(.qrayti-managed-logo)').forEach(img=>{
      const saved=images.get(img),source=saved?.src||img.getAttribute('src');
      const edits=config.images||[];
      const edit=edits.findLast(x=>samePage(x.route)&&x.original===source)||edits.findLast(x=>x.route==='*'&&x.original===source);
      if(edit&&allowedImage(edit.src)){if(!saved)images.set(img,{src:source,alt:img.getAttribute('alt')||''});if(img.getAttribute('src')!==edit.src)img.setAttribute('src',edit.src);if(img.alt!==edit.alt)img.alt=edit.alt;}
      else if(saved){img.setAttribute('src',saved.src);img.alt=saved.alt;images.delete(img);}
    });
    const motion=home.motion===true||config.template==='classic-motion';let sheet=document.getElementById('cmsMotionCSS');
    if(motion&&!sheet){sheet=document.createElement('link');sheet.id='cmsMotionCSS';sheet.rel='stylesheet';sheet.href='/assets/home-motion.css?v=1';document.head.append(sheet);}if(sheet)sheet.disabled=!motion;
    reportFields();reportInventory();
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  function queue(){cancelAnimationFrame(frame);frame=requestAnimationFrame(apply);}
  const observer=new MutationObserver(queue);
  document.addEventListener('qrayti:screen-rendered',()=>{queue();tell('route',{route:page()});});
  addEventListener('hashchange',()=>{queue();tell('route',{route:page()});});
  document.addEventListener('qrayti:language-changed',()=>{queue();tell('route',{route:page()});});
  if(preview){
    if(isTeacher)document.querySelector('a.brand[href="/"]')?.setAttribute('href','/?admin-preview=1#/welcome');
    addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.source!=='qrayti-admin')return;if(e.data.type==='preview'){config=e.data.content||{};sequence=e.data.sequence;queue();}if(e.data.type==='open-panel'){const trigger={about:'#aboutBtn',faq:'#faqTopBtn',install:'#installBtn',search:'#searchBtn'}[e.data.panel];if(trigger){selecting=false;document.documentElement.classList.remove('qrayti-edit-select');document.querySelector(trigger)?.click();}}if(e.data.type==='select'){selecting=e.data.enabled===true;document.documentElement.classList.toggle('qrayti-edit-select',selecting);selected?.classList.remove('qrayti-edit-selected');} });
    document.addEventListener('click',e=>{
      if(!selecting||e.target.closest(attributeBlocked))return;e.preventDefault();e.stopImmediatePropagation();selected?.classList.remove('qrayti-edit-selected');
      const hint=e.target.closest('input[placeholder],textarea[placeholder]');if(hint){const source=attributeSource(hint,'placeholder');tell('picked',{kind:'attribute',attribute:'placeholder',route:page(),original:source.original,value:hint.getAttribute('placeholder')});return;}
      if(e.target.closest('input,textarea'))return;
      const image=e.target.closest('img');
      if(image){selected=image;selected.classList.add('qrayti-edit-selected');const original=images.get(image);tell('picked',{kind:'image',route:page(),original:original?.src||image.getAttribute('src'),value:image.getAttribute('src'),alt:image.alt});return;}
      let node=document.caretRangeFromPoint?.(e.clientX,e.clientY)?.startContainer;
      if(!node||node.nodeType!==3||!e.target.contains(node)){const walk=document.createTreeWalker(e.target,NodeFilter.SHOW_TEXT);node=walk.nextNode();}
      if(!node||!node.nodeValue.trim()||node.parentElement.closest(blocked))return;
      selected=node.parentElement;selected.classList.add('qrayti-edit-selected');tell('picked',{kind:'text',route:page(),original:remember(node).trim(),value:node.nodeValue.trim()});
    },true);
    tell('ready',{route:page()});
  }
  fetch('/api/site-content',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(!preview)config=d.content||{};queue();}).catch(queue);
  queue();
})();
