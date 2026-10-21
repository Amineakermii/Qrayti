(()=>{
  const EMPTY_DATA={subjects:[],files:[],program:[]};
  let D=EMPTY_DATA;
  let ACTIVE_LICENCE=sessionStorage.getItem('qraytiLicence')||'info';
  const DATASET_META={
    'info-1-1':{src:'assets/data-y1s1.js?v=24',global:'SITE_DATA_Y1S1'},
    'info-1-2':{src:'assets/data-y1s2.js?v=24',global:'SITE_DATA_Y1S2'},
    'info-2-1':{src:'assets/data.js?v=24',global:'SITE_DATA'},
    'info-2-2':{src:'assets/data-s2.js?v=24',global:'SITE_DATA_S2'},
    'lt-1-1':{src:'assets/data-lt-s1.js?v=24',global:'SITE_DATA_LT_S1'},
    'lt-1-2':{src:'assets/data-lt-s2.js?v=24',global:'SITE_DATA_LT_S2'},
    'lce-1-1':{src:'assets/data-lce-s1.js?v=24',global:'SITE_DATA_LCE_S1'},
    'lce-1-2':{src:'assets/data-lce-s2.js?v=24',global:'SITE_DATA_LCE_S2'}
  };
  const datasetPromises=new Map();
  const licenceNo=q=>{const x=String((q&&q.licence)||ACTIVE_LICENCE||'info');ACTIVE_LICENCE=x;sessionStorage.setItem('qraytiLicence',x);return x};
  const yearNo=q=>String((q&&q.year)||1);
  const semNo=q=>String((q&&q.semester)||1);
  const datasetKey=q=>`${licenceNo(q)}-${yearNo(q)}-${semNo(q)}`;
  function loadDataset(key){
    const meta=DATASET_META[key]||DATASET_META['info-1-1'];
    if(window[meta.global])return Promise.resolve(window[meta.global]);
    if(datasetPromises.has(key))return datasetPromises.get(key);
    const promise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=meta.src;script.async=true;script.dataset.qraytiDataset=key;
      script.onload=()=>window[meta.global]?resolve(window[meta.global]):reject(new Error(`Dataset ${key} loaded without data`));
      script.onerror=()=>reject(new Error(`Could not load ${meta.src}`));
      document.head.appendChild(script);
    }).catch(err=>{datasetPromises.delete(key);throw err});
    datasetPromises.set(key,promise);
    return promise;
  }
  const datasetFor=async q=>{const base=await loadDataset(datasetKey(q));return window.QraytiCatalogLayer?.withRemote?window.QraytiCatalogLayer.withRemote(base,q):base};
  const app=document.getElementById('app');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kindLabel={pdf:'PDF',image:'IMG',text:'TXT',doc:'DOC',packet:'PKT',archive:'ZIP',audio:'AUDIO',other:'FILE'};
  function fileExtFrom(f){
    const raw=String(f?.name||f?.originalName||f?.path||'').split(/[?#]/)[0];
    const m=raw.toLowerCase().match(/\.([a-z0-9]{1,10})$/);return m?m[1]:'';
  }
  function officeMeta(f){
    const ext=fileExtFrom(f);
    if(['doc','docx'].includes(ext))return {family:'word',label:'WORD',title:'Microsoft Word'};
    if(['ppt','pptx','pps','ppsx'].includes(ext))return {family:'powerpoint',label:'PPT',title:'Microsoft PowerPoint'};
    if(['xls','xlsx'].includes(ext))return {family:'excel',label:'XLS',title:'Microsoft Excel'};
    return null;
  }
  const fileTypeLabel=f=>officeMeta(f)?.label||kindLabel[f?.kind]||'FILE';
  const isOfficePreviewable=f=>f?.kind==='doc'&&!!officeMeta(f);
  const isReadableFile=f=>['pdf','image','text','audio'].includes(f?.kind)||isOfficePreviewable(f);
  const categoryMeaning={cours:'الدروس',td:'الأعمال الموجّهة',tp:'الأعمال التطبيقية',qcm:'أسئلة اختيار متعدد',resume:'الملخّصات',exam:'الاختبارات التطبيقية',extra:'ملفات إضافية'};
  const byId=id=>D.files.find(f=>f.id===id)||D.program.find(f=>f.id===id);
  const natural=s=>String(s).replace(/\d+/g,m=>m.padStart(5,'0')).toLowerCase();
  const SUPPORT_EMAIL='9rayti.learn@gmail.com';
  const STUDENT_TOOLS=window.QraytiStudentTools||{gradeFormulas:{},languageBanks:{},languageAdvice:{}};
  const fileCount=n=>{n=Number(n)||0;return n===1?'ملف واحد':n===2?'زوز ملفات':`${n} ملفات`};
  const tpCountLabel=n=>{n=Number(n)||0;return n===1?'TP واحد':n===2?'زوز TP':`${n} TP`};

  const trackMeta={
    genie:{label:'Génie Logiciel',ar:'هندسة البرمجيات'},
    multimedia:{label:'Multimédia',ar:'الملتيميديا'},
    common:{label:'Tronc commun',ar:'جذع مشترك'}
  };

  // Approved subject illustrations, shared with the Android SubjectArtMap.
  // Only these explicit catalog IDs can become asset paths; remote IDs use a
  // category illustration rather than an untrusted or missing image URL.
  const subjectArtwork=Object.freeze({
    __program__:'subject___program__.webp',
    adminbdd2:'subject_adminbdd2.webp',
    anglais:'subject_anglais.webp',
    automates:'subject_automates.webp',
    bdd:'subject_bdd.webp',
    compilation2:'subject_compilation2.webp',
    conception:'subject_conception.webp',
    cpp:'subject_cpp.webp',
    entrepots2:'subject_entrepots2.webp',
    entrepreneuriat2:'subject_entrepreneuriat2.webp',
    framework:'subject_framework.webp',
    gestion:'subject_gestion.webp',
    graphes:'subject_graphes.webp',
    ia2:'subject_ia2.webp',
    indexation2:'subject_indexation2.webp',
    java:'subject_java.webp',
    java2:'subject_java2.webp',
    lce_algebre1:'subject_lce_algebre1.webp',
    lce_algebre2:'subject_lce_algebre2.webp',
    lce_analyse1:'subject_lce_analyse1.webp',
    lce_analyse2:'subject_lce_analyse2.webp',
    lce_arch2:'subject_lce_arch2.webp',
    lce_asd1:'subject_lce_asd1.webp',
    lce_asd2:'subject_lce_asd2.webp',
    lce_comm1:'subject_lce_comm1.webp',
    lce_comm2:'subject_lce_comm2.webp',
    lce_elec1:'subject_lce_elec1.webp',
    lce_english2:'subject_lce_english2.webp',
    lce_fe2:'subject_lce_fe2.webp',
    lce_logic1:'subject_lce_logic1.webp',
    lce_os1:'subject_lce_os1.webp',
    lce_os2:'subject_lce_os2.webp',
    lce_prog1:'subject_lce_prog1.webp',
    lce_prog2:'subject_lce_prog2.webp',
    lce_prop1:'subject_lce_prop1.webp',
    lce_signal2:'subject_lce_signal2.webp',
    lce_trans2:'subject_lce_trans2.webp',
    lt_algebre1:'subject_lt_algebre1.webp',
    lt_algebre2:'subject_lt_algebre2.webp',
    lt_algo1:'subject_lt_algo1.webp',
    lt_analyse1:'subject_lt_analyse1.webp',
    lt_analyse2:'subject_lt_analyse2.webp',
    lt_bdd2:'subject_lt_bdd2.webp',
    lt_circuit1:'subject_lt_circuit1.webp',
    lt_comm1:'subject_lt_comm1.webp',
    lt_comm2:'subject_lt_comm2.webp',
    lt_docs2:'subject_lt_docs2.webp',
    lt_electnum1:'subject_lt_electnum1.webp',
    lt_electroanalog2:'subject_lt_electroanalog2.webp',
    lt_electrostat1:'subject_lt_electrostat1.webp',
    lt_em2:'subject_lt_em2.webp',
    lt_english1:'subject_lt_english1.webp',
    lt_english2:'subject_lt_english2.webp',
    lt_fen2:'subject_lt_fen2.webp',
    lt_meca1:'subject_lt_meca1.webp',
    lt_os1:'subject_lt_os1.webp',
    lt_progadv2:'subject_lt_progadv2.webp',
    lt_thermo2:'subject_lt_thermo2.webp',
    probabilite:'subject_probabilite.webp',
    reseau:'subject_reseau.webp',
    systemes2:'subject_systemes2.webp',
    tests2:'subject_tests2.webp',
    webdesign:'subject_webdesign.webp',
    y1_algebre:'subject_y1_algebre.webp',
    y1_algebre2:'subject_y1_algebre2.webp',
    y1_analyse:'subject_y1_analyse.webp',
    y1_analyse2:'subject_y1_analyse2.webp',
    y1_arch:'subject_y1_arch.webp',
    y1_asd:'subject_y1_asd.webp',
    y1_asd2:'subject_y1_asd2.webp',
    y1_bdd2:'subject_y1_bdd2.webp',
    y1_c:'subject_y1_c.webp',
    y1_c2:'subject_y1_c2.webp',
    y1_comm:'subject_y1_comm.webp',
    y1_comm2:'subject_y1_comm2.webp',
    y1_cpp2_gabes:'subject_y1_cpp2_gabes.webp',
    y1_cpp_gabes:'subject_y1_cpp_gabes.webp',
    y1_francais2_gabes:'subject_y1_francais2_gabes.webp',
    y1_logique:'subject_y1_logique.webp',
    y1_multimedia:'subject_y1_multimedia.webp',
    y1_os:'subject_y1_os.webp',
    y1_os2:'subject_y1_os2.webp',
    y1_python2:'subject_y1_python2.webp',
    y1_reseau2:'subject_y1_reseau2.webp',
    web2:'subject_webdesign.webp'
  });
  function subjectArtworkFor(s){
    if(Object.hasOwn(subjectArtwork,s.id))return subjectArtwork[s.id];
    const key=`${s.id||''} ${s.name||''} ${s.ar||''}`.toLowerCase();
    if(/algebra|algèbre|algebre|analyse|math|probab|statist|graph|جبر|رياض|تحليل/.test(key))return 'subject_art_math.webp';
    if(/database|base.*donn|bdd|sql|قواعد.*بيانات/.test(key))return 'subject_art_database.webp';
    if(/network|réseau|reseau|transmission|شبك/.test(key))return 'subject_art_networks.webp';
    if(/english|anglais|français|francais|communication|لغة|تواصل|إنجليز|فرنس/.test(key))return 'subject_art_languages.webp';
    if(/web|design|multim|ويب|تصميم/.test(key))return 'subject_art_web_design.webp';
    if(/circuit|electr|électr|signal|physi|meca|thermo|إلكتر|كهرب/.test(key))return 'subject_art_electronics.webp';
    if(/program|algorithm|algo|python|java|compil|برمج|خوارزم/.test(key))return 'subject_art_programming.webp';
    return 'subject_art_general.webp';
  }

  const campusLogos=[
    {src:'assets/logos/gafsa.png',alt:'كلية العلوم بقفصة',label:'علوم قفصة',url:'https://fsgf.rnu.tn/'},
    {src:'assets/logos/gabes.png',alt:'كلية العلوم بقابس',label:'علوم قابس',url:'https://fsg.rnu.tn/'},
    {src:'assets/logos/monastir.png',alt:'كلية العلوم بالمنستير',label:'علوم المنستير',url:'https://fsm.rnu.tn/'},
    {src:'assets/logos/isim-mahdia.png',alt:'المعهد العالي للإعلامية بالمهدية',label:'ISIM المهدية',url:'https://isima.rnu.tn/'},
    {src:'assets/logos/isamm.png',alt:'المعهد العالي لفنون الملتيميديا بمنوبة',label:'ISAMM منوبة',url:'https://isa2m.rnu.tn/'},
    {src:'assets/logos/isi.png',alt:'المعهد العالي للإعلامية',label:'ISI',url:'https://www.isi.tn/'},
    {src:'assets/logos/fst.png',alt:'كلية العلوم بتونس',label:'علوم تونس',url:'https://fst.rnu.tn/'},
    {src:'assets/logos/issat-sousse.png',alt:'المعهد العالي للعلوم التطبيقية والتكنولوجيا بسوسة',label:'ISSAT سوسة',url:'https://issatso.rnu.tn/'},
    {src:'assets/logos/sfax.png',alt:'كلية العلوم بصفاقس',label:'علوم صفاقس',url:'https://fss.rnu.tn/'},
    {src:'assets/logos/isitcom.svg',alt:'المعهد العالي للإعلامية وتكنولوجيات الاتصال بحمام سوسة',label:'ISITCom سوسة',url:'https://isitcom.edupage.org/'}
  ];

  // Tâche-lik lives in its own subject section. It is intentionally NOT attached to chapters.
  // The player opens inside Qrayti using the official YouTube embed player.
  const subjectVideoMap={
    java:[
      {title:'Structures conditionnelles en Java',url:'https://www.youtube.com/watch?v=uaK_uTJOzmM',source:'Tâche-lik',type:'فيديو'},
      {title:'Introduction à la programmation orientée objet',url:'https://www.youtube.com/watch?v=a9r3nH_IYNA',source:'Tâche-lik',type:'فيديو'}
    ],
    automates:[
      {title:'Langages réguliers & expressions régulières',url:'https://www.youtube.com/playlist?list=PL2DLtWEjSX8txjnmbsq5FW_UM_kQ1cBtO',source:'Tâche-lik',type:'Playlist'},
      {title:'TD — Langages réguliers & expressions régulières',url:'https://www.youtube.com/playlist?list=PL2DLtWEjSX8usiQbzrBN8sEwbNFufjXfi',source:'Tâche-lik',type:'Playlist'},
      {title:'Minimisation d’un AFD',url:'https://www.youtube.com/watch?v=X4AZaXaquag',source:'Tâche-lik',type:'فيديو'}
    ],
    y1_c:[{title:'C Programming — دورة عربية مرتّبة',url:'https://www.youtube.com/playlist?list=PLfgCIULRQavzxY-IO2sO5Vj5x7C_tjW3R',source:'YouTube • مجاني',type:'Playlist'}],
    y1_c2:[{title:'C Programming — دورة عربية مرتّبة',url:'https://www.youtube.com/playlist?list=PLfgCIULRQavzxY-IO2sO5Vj5x7C_tjW3R',source:'YouTube • مجاني',type:'Playlist'}],
    y1_python2:[{title:'Python Programming — Beginner Playlist',url:'https://www.youtube.com/playlist?list=PLEiEAq2VkUUKoW1o-A-VEmkoGKSC26i_I',source:'YouTube • Simplilearn',type:'Playlist'}],
    y1_bdd2:[
      {title:'Fundamentals of Database Systems — بالعربي',url:'https://www.youtube.com/playlist?list=PL37D52B7714788190',source:'YouTube • مجاني',type:'Playlist'},
      {title:'Learn SQL In Arabic',url:'https://www.youtube.com/playlist?list=PL85D9FC9DFD6B9484',source:'YouTube • مجاني',type:'Playlist'}
    ],
    y1_reseau2:[{title:'Computer Networks — كورس أكاديمي بالعربي',url:'https://www.youtube.com/playlist?list=PLHKTPL-jkzUqRPIzSeayjdxqXotMXK2T9',source:'YouTube • مجاني',type:'Playlist'}],
    y1_os:[{title:'Linux Crash Course',url:'https://www.youtube.com/playlist?list=PLT98CRl2KxKHKd_tH3ssq0HPrThx2hESW',source:'YouTube • Learn Linux TV',type:'Playlist'}],
    y1_os2:[{title:'Linux Crash Course',url:'https://www.youtube.com/playlist?list=PLT98CRl2KxKHKd_tH3ssq0HPrThx2hESW',source:'YouTube • Learn Linux TV',type:'Playlist'}],
    lt_algo1:[{title:'C Programming — دورة عربية',url:'https://www.youtube.com/playlist?list=PLfgCIULRQavzxY-IO2sO5Vj5x7C_tjW3R',source:'YouTube • مجاني',type:'Playlist'}],
    lt_bdd2:[{title:'Fundamentals of Database Systems — بالعربي',url:'https://www.youtube.com/playlist?list=PL37D52B7714788190',source:'YouTube • مجاني',type:'Playlist'}],
    lt_os1:[{title:'Linux Crash Course',url:'https://www.youtube.com/playlist?list=PLT98CRl2KxKHKd_tH3ssq0HPrThx2hESW',source:'YouTube • Learn Linux TV',type:'Playlist'}],
    lce_prog1:[{title:'C Programming — دورة عربية مرتّبة',url:'https://www.youtube.com/playlist?list=PLfgCIULRQavzxY-IO2sO5Vj5x7C_tjW3R',source:'YouTube • مجاني',type:'Playlist'}],
    lce_prog2:[{title:'C Programming — مراجعة وتطبيق',url:'https://www.youtube.com/playlist?list=PLfgCIULRQavzxY-IO2sO5Vj5x7C_tjW3R',source:'YouTube • مجاني',type:'Playlist'}],
    lce_os1:[{title:'Linux Crash Course',url:'https://www.youtube.com/playlist?list=PLT98CRl2KxKHKd_tH3ssq0HPrThx2hESW',source:'YouTube • Learn Linux TV',type:'Playlist'}]
  };


  function go(path){location.hash=path}
  function parseRoute(){
    const raw=(location.hash||'#/welcome').slice(1);
    const [pathPart,queryPart='']=raw.split('?');
    return {path:pathPart||'/welcome',q:Object.fromEntries(new URLSearchParams(queryPart))};
  }
  function screen(content,cls=''){
    app.innerHTML=`<section class="screen ${cls}">${content}</section>`;
    window.scrollTo({top:0,left:0,behavior:'auto'});
    // Enhance only the freshly rendered screen on Android/mobile.
    app.dispatchEvent(new CustomEvent('qrayti:screen-rendered',{bubbles:true}));
  }
  function flowHead(back,step){
    return `<div class="flow-head"><button class="back-btn" data-go="${esc(back)}">→ رجوع</button><span class="step-count">${esc(step)}</span></div>`;
  }
  function disabledCard(icon,title,sub='المحتوى موش متوفّر توا.',support='عندك كور؟ ابعثلنا على 9rayti.learn@gmail.com ونزيدوه لقرايتي 🤝'){
    return `<button class="choice-card disabled support-disabled" disabled><span class="soon-pill">موش متوفّر توا</span><span class="choice-icon">${esc(icon)}</span><h2>${esc(title)}</h2><p>${esc(sub)}</p><span class="contribute-note">${esc(support)}</span></button>`;
  }
  function trackInfo(key){return trackMeta[key]||trackMeta.genie}
  function licenceInfo(q){
    const l=licenceNo(q);
    if(l==='lt')return {key:'lt',label:'Technologies de l’Information et de la Communication (LT)',ar:'تكنولوجيات المعلومات والاتصال'};
    if(l==='lce')return {key:'lce',label:'Computer Engineering (LCE)',ar:'هندسة نظم الإعلامية'};
    return {key:'info',label:'Sciences de l’Informatique',ar:'علوم الإعلامية'}
  }
  function qp(q){return `licence=${encodeURIComponent(licenceNo(q))}`}
  function logosStrip(){
    return `<div class="campus-strip">${campusLogos.map(l=>`<a class="campus-logo" href="${l.url}" target="_blank" rel="noopener" title="${esc(l.alt)} — الموقع الرسمي"><img src="${l.src}" alt="${esc(l.alt)}" loading="lazy" decoding="async" width="58" height="58"><small>${esc(l.label)}</small></a>`).join('')}</div>`;
  }
  function groupMeta(subjectId,name,items=[]){
    const title=(items.find(f=>f.groupTitle)||{}).groupTitle||'';
    if(title&&title.includes(' — ')){
      const parts=title.split(' — ');
      return {chapter:parts.shift(),topic:parts.join(' — '),full:title};
    }
    return {chapter:name,topic:'',full:name};
  }
  function isGenericCourseGroup(name){
    return /^(cours|course|courses)$/i.test(String(name||'').trim());
  }
  function inlineCourseFile(f){
    const src=sourceText(f),label=fileLabel(f),readable=isReadableFile(f);
    return `<article class="inline-course-card"><div class="inline-course-top"><span class="chapter-number inline-course-badge">كور فرعي</span><span class="file-size">${esc(f.sizeText||'')}</span></div><div class="inline-course-main"><div><h3 title="${esc(label)}">${esc(label)}</h3>${src?`<p class="file-source ${f.sourceBasis==='series'?'series':f.sourceUniversity?'known':'unknown'}">${esc(src)}</p>`:''}</div></div><div class="inline-course-actions"><button class="open-btn" data-file="${esc(f.id)}">${readable?(f.kind==='audio'?'اسمع':'إقرا'):'افتح'}</button><button class="download-btn" data-download-file="${esc(f.id)}">صبّو ↓</button></div></article>`;
  }
  function subjectVideos(subjectId){return subjectVideoMap[subjectId]||[]}
  function fileLabel(f){return f.displayName||f.name}

  function subjectThumb(s){
    return `<div class="subject-thumb subject-art" aria-hidden="true"><img class="subject-art-image" src="assets/subject-art/${subjectArtworkFor(s)}" alt="" loading="lazy" decoding="async" width="720" height="480"><small>${esc(s.abbr||s.name||'')}</small></div>`;
  }
  function sourceText(f){
    const academic=[f.sourceUniversity,f.sourceInstitution].filter(Boolean).join(' — ');
    return [academic||'المصدر موش مذكور',f.sourceInstructor?`الأستاذ: ${f.sourceInstructor}`:''].filter(Boolean).join(' • ');
  }
  function sourcePlain(f){
    if(!f) return '';
    const academic=[f.sourceUniversity,f.sourceInstitution].filter(Boolean).join(' — ');
    return [academic||'المصدر موش مذكور',f.sourceInstructor?`الأستاذ: ${f.sourceInstructor}`:''].filter(Boolean).join(' • ');
  }

  function contextQuery(q={}){
    const lic=licenceNo(q),year=yearNo(q),sem=semNo(q),track=q.track||'common';
    return `licence=${encodeURIComponent(lic)}&year=${encodeURIComponent(year)}&track=${encodeURIComponent(track)}&semester=${encodeURIComponent(sem)}`;
  }
  function averagePath(q={}){return `/average?${contextQuery(q)}`}
  function languageType(s){
    const key=`${s?.id||''} ${s?.name||''} ${s?.ar||''}`.toLowerCase();
    if(/english|anglais|الإنجليزية|الانجليزية/.test(key))return 'en';
    if(/français|francais|french|الفرنسية/.test(key))return 'fr';
    return '';
  }
  function shuffleCopy(items){
    const a=[...items];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }
  function makeLanguageQuiz(lang){
    const bank=STUDENT_TOOLS.languageBanks?.[lang]||[];
    const levels=['A1','A2','B1','B2','C1'];
    return levels.flatMap(level=>shuffleCopy(bank.filter(q=>q.level===level)).slice(0,2));
  }
  function gradeLevel(correct,total){
    const pct=total?Math.round((correct/total)*100):0;
    if(pct>=90)return {level:'C1',pct};
    if(pct>=70)return {level:'B2',pct};
    if(pct>=50)return {level:'B1',pct};
    if(pct>=30)return {level:'A2',pct};
    return {level:'A1',pct};
  }

  function welcome(){
    document.title='قرايتي انفورماتيك | كور جامعية في تونس';
    const campusCards=campusLogos.map(l=>`<a class="campus-chip" href="${l.url}" target="_blank" rel="noopener" title="افتح الموقع الرسمي لـ${esc(l.alt)}"><img src="${l.src}" alt="" loading="lazy" decoding="async" width="62" height="62"><div><b>${esc(l.label)}</b><small>${esc(l.alt)}</small></div><span class="campus-external">↗</span></a>`).join('');
    screen(`<div class="landing-screen">
      <div class="landing-copy">
        <div class="hero-symbols" aria-hidden="true"><span class="hero-symbol symbol-code">{ }</span><span class="hero-symbol symbol-pi">π</span><span class="hero-symbol symbol-db">SQL</span></div>
        <span class="welcome-badge">قرايتي • للطلبة في تونس</span>
        <h1 class="landing-title"><span class="landing-title-main">دروس جامعتك،</span><span class="landing-title-accent">متضيّعش معنا.</span></h1>
        <p>نلمّولك الكور والـTD والـTP في بلاصة وحدة، ونرتّبوهم باش تلقى اللي يلزمك من غير ما تدوّخ بين الملفات. قرايتي فيها أكثر من إجازة، وبرشة مواد تتعاود بين جامعات مختلفة في تونس.</p>
        <div class="welcome-actions">
          <button class="primary-cta" data-go="/licence">ورّيني قرايتي <span>←</span></button>
          <button class="install-cta install-coming" id="installBtn"><span>🦊</span><b>تطبيق قرايتي <em>(v1.6)</em></b><small>Android + iPhone • تنزيل الكور مُصلّح</small></button>
        </div>
      </div>
      <div class="campus-marquee-wrap" aria-label="بعض الكليات والمعاهد اللي ينجم يفيدهم المحتوى">
        <div class="campus-marquee-title"><b>ينجم يفيد طلبة من:</b><span>أمثلة فقط — والقائمة تكبر مع الوقت</span></div>
        <div class="campus-marquee"><div class="campus-marquee-track"><div class="campus-marquee-group">${campusCards}</div><div class="campus-marquee-group" aria-hidden="true">${campusCards}</div></div></div>
      </div>
    </div>`,'landing');
  }

  function licence(){
    document.title='اختار الإجازة - قرايتي';
    screen(`<div class="screen-centered licence-screen">${flowHead('/welcome','البداية')}
      <div class="choice-intro licence-intro"><span class="mini-label">شنوّة تقرا؟</span><h1>اختار الإجازة متاعك</h1><p>اختار اللي تقرا فيها، وبعدها قرايتي تهزّك للسنة والسداسي والمواد متاعك.</p></div>
      <div class="choice-grid licence-grid">
        <button class="choice-card licence-choice featured-choice info-choice" data-go="/year?licence=info">
          <span class="available-pill">سنة 1 + سنة 2</span>
          <h2>Sciences de l’Informatique</h2>
          <strong class="licence-arabic">علوم الإعلامية</strong>
          <div class="licence-motion licence-motion-code" aria-hidden="true"><span class="motion-ring ring-a"></span><span class="motion-ring ring-b"></span><span class="motion-core">&lt;/&gt;</span><i class="motion-dot dot-a"></i><i class="motion-dot dot-b"></i><i class="motion-dot dot-c"></i></div>
          <p class="licence-description">تقرا فيها البرمجة، الخوارزميات، قواعد البيانات، الأنظمة والشبكات. باهية للي يحب يفهم كيفاش البرامج والسيستامات يخدمو من الداخل.</p>
          <span class="choice-action">اختارها ←</span>
        </button>
        <button class="choice-card licence-choice featured-choice lt-choice" data-go="/year?licence=lt">
          <span class="available-pill">السنة الأولى كاملة</span>
          <h2>Technologies de l’Information et de la Communication</h2>
          <strong class="licence-arabic">تكنولوجيات المعلومات والاتصال</strong>
          <div class="licence-motion licence-motion-signal" aria-hidden="true"><span class="signal-core"></span><span class="signal-wave wave-a"></span><span class="signal-wave wave-b"></span><span class="signal-wave wave-c"></span><i class="signal-packet packet-a"></i><i class="signal-packet packet-b"></i></div>
          <p class="licence-description">تخلّط بين الإعلامية والاتصالات والإلكترونيك: برمجة، شبكات، إرسال معطيات، أنظمة ومواد تقنية مرتبطة بالتليكوم.</p>
          <span class="choice-action">اختارها ←</span>
        </button>
        <button class="choice-card licence-choice featured-choice lce-choice" data-go="/year?licence=lce">
          <span class="available-pill">السنة الأولى كاملة</span>
          <h2>Computer Engineering (LCE)</h2>
          <strong class="licence-arabic">هندسة الإعلامية</strong>
          <div class="licence-motion licence-motion-lce" aria-hidden="true"><span class="circuit-ring"></span><span class="circuit-core">⚙</span><i class="circuit-node node-a"></i><i class="circuit-node node-b"></i><i class="circuit-node node-c"></i><i class="circuit-line line-a"></i><i class="circuit-line line-b"></i></div>
          <p class="licence-description">تجمع البرمجة مع معمارية الحاسوب، الأنظمة، الشبكات والإلكترونيك. السنة الأولى جذع مشترك وبعدها تبدأ التخصّصات.</p>
          <span class="choice-action">اختارها ←</span>
        </button>
      </div>
      <div class="licence-note">موش لاقي إجازتك؟ عندك برنامج، Cours، TD، TP ولا Examens وتنجم تعاون؟ ابعثلنا على <a href="mailto:9rayti.learn@gmail.com">9rayti.learn@gmail.com</a> 🤝</div>
    </div>`);
  }

  function year(q={}){
    const lic=licenceNo(q), li=licenceInfo(q);
    document.title='اختار السنة - قرايتي';
    let cards='', intro='';
    if(lic==='lt'){
      cards=`<button class="choice-card featured-choice" data-go="/semester?licence=lt&year=1&track=common"><span class="available-pill">S1 + S2</span><span class="choice-icon">1</span><h2>السنة الأولى</h2><p>السداسي الأول والثاني موجودين من ملفات 1LT ومترتّبين.</p><span class="choice-action">كمّل ←</span></button>
      ${disabledCard('2','السنة الثانية','المحتوى متاع LT سنة ثانية مازال ناقص.','عندك كور سنة ثانية LT؟ ابعثلنا على 9rayti.learn@gmail.com ونزيدوه لقرايتي 🤝')}
      ${disabledCard('3','السنة الثالثة','المحتوى متاعها مازال ناقص.','إذا عندك كور سنة ثالثة LT، ابعثلنا على 9rayti.learn@gmail.com ونزيدوها 🤝')}`;
      intro='السنة الأولى موجودة بالسداسيين. الباقي نزيدوه كي تتوفّر عندنا كور كفاية.';
    }else if(lic==='lce'){
      cards=`<button class="choice-card featured-choice" data-go="/semester?licence=lce&year=1&track=common"><span class="available-pill">S1 + S2</span><span class="choice-icon">1</span><h2>السنة الأولى</h2><p>جذع مشترك LCE — السداسي الأول والثاني متوفرين ومترتّبين.</p><span class="choice-action">كمّل ←</span></button>
      ${disabledCard('2','السنة الثانية','من هنا تبدأ شعب LCE، والمحتوى متاعها موش متوفّر توا.','عندك كور IRS ولا Systèmes Embarqués & IoT؟ ابعثلنا على 9rayti.learn@gmail.com ونزيدوه 🤝')}
      ${disabledCard('3','السنة الثالثة','محتوى LCE سنة ثالثة مازال ناقص.','عندك كور؟ ابعثلنا على 9rayti.learn@gmail.com ونزيدوه 🤝')}`;
      intro='السنة الأولى جذع مشترك. من بعد تبدأ التخصّصات في الشبكات والأنظمة ولا الأنظمة المضمّنة وIoT.';
    }else{
      cards=`<button class="choice-card featured-choice" data-go="/semester?licence=info&year=1&track=common"><span class="available-pill">S1 + S2</span><span class="choice-icon">1</span><h2>السنة الأولى</h2><p>السداسي الأول والثاني موجودين ومترتّبين.</p><span class="choice-action">كمّل ←</span></button>
      <button class="choice-card featured-choice" data-go="/track?licence=info&year=2"><span class="available-pill">متوفّرة</span><span class="choice-icon">2</span><h2>السنة الثانية</h2><p>عندنا محتوى للسداسي الأول والثاني في Génie Logiciel.</p><span class="choice-action">كمّل ←</span></button>
      ${disabledCard('3','السنة الثالثة','المحتوى متاعها مازال ناقص.','إذا عندك كور سنة ثالثة، ابعثلنا على 9rayti.learn@gmail.com ونزيدوها 🤝')}`;
      intro='اختار السنة اللي تقرا فيها. في السنة الأولى تمشي للسداسي مباشرة، ومن السنة الثانية تختار الشعبة وبعدها المواد.';
    }
    screen(`<div class="screen-centered year-screen">${flowHead('/licence','المرحلة 2')}
      <div class="welcome year-choice-head"><span class="welcome-badge">${esc(li.label)}</span><h1>شنية السنة اللي<br><span>تقرا فيها؟</span></h1><p>${intro}</p></div>
      <div class="choice-grid three welcome-years">${cards}</div>
    </div>`);
  }

  function track(q){
    const lic=licenceNo(q);
    if(lic!=='info'||String(q.year||1)==='1'){go(`/semester?licence=${lic}&year=1&track=common`);return}
    document.title='اختار الشعبة - قرايتي';
    screen(`<div class="screen-centered">${flowHead(`/year?licence=${lic}`,'المرحلة 3')}
      <div class="choice-intro"><span class="mini-label">السنة الثانية</span><h1>شنوة الشعبة متاعك؟</h1><p><b>Génie Logiciel وMultimédia عندهم نفس مواد السداسي الأول.</b> السداسي الثاني متوفّر توا لـGénie Logiciel، ومحتوى Multimédia مازال يستحق مساهمات.</p></div>
      <div class="choice-grid">
        <button class="choice-card" data-go="/semester?licence=info&year=2&track=genie"><span class="available-pill">S1 + S2</span><span class="choice-icon">GL</span><h2>Génie Logiciel</h2><p>هندسة البرمجيات — السداسيين متوفرين.</p><span class="choice-action">كمّل ←</span></button>
        <button class="choice-card partial-choice" data-go="/semester?licence=info&year=2&track=multimedia"><span class="partial-pill">جزئيًا</span><span class="choice-icon">MM</span><h2>Multimédia</h2><p>السداسي الأول متوفّر. S2 مازال ناقص.</p><span class="contribute-note">عندك كور Multimédia؟ ابعثهولنا على 9rayti.learn@gmail.com 🤝</span><span class="choice-action">شوف المتوفّر ←</span></button>
      </div>
    </div>`);
  }

  function curriculumSemesterNote(){
    return `<div class="curriculum-semester-note"><span aria-hidden="true">💡</span><p><b>ملاحظة صغيرة:</b> ترتيب البرنامج ينجم يختلف من جامعة لجامعة. إذا ما لقيتش درس في السداسي متاعك، شوف السداسي الآخر — ينجم تلقاه غادي.</p></div>`;
  }

  function semester(q){
    const lic=licenceNo(q), year=yearNo(q), li=licenceInfo(q);
    document.title='اختار السداسي - قرايتي';
    if(year==='1'){
      const lt=lic==='lt', lce=lic==='lce';
      const intro=lt?'السداسي الأول والثاني موجودين ومقسّمين حسب المواد والكور والتمارين.':lce?'LCE سنة أولى جذع مشترك، وS1 وS2 متقسمين حسب المواد والنوع.':'السداسي الأول والثاني موجودين، وكل واحد مترتّب حسب المادة والنوع والشابتر.';
      const s1=lt?'Algo، رياضيات، ميكانيك، إلكترونيك، OS وغيرهم.':lce?'ASD، C، Analyse، Algèbre، Systèmes Logiques، Propagation وغيرهم.':'الكور، TD، TP، فروض وملفات السنة الأولى.';
      const s2=lt?'Java، BDD، إلكترومغناطيسية، ترموديناميك وغيرهم.':lce?'ASD2، C2، Architecture، Signal، Transmission de données وغيرهم.':'Python، قواعد البيانات، الشبكات، أنظمة التشغيل، الرياضيات وغيرهم.';
      screen(`<div class="screen-centered">${flowHead(`/year?licence=${lic}`,'المرحلة 3')}
        <div class="choice-intro"><span class="mini-label">السنة الأولى • ${esc(li.label)}</span><h1>اختار السداسي</h1><p>${intro}</p></div>
        <div class="choice-grid">
          <button class="choice-card featured-choice" data-go="/subjects?licence=${lic}&year=1&track=common&semester=1"><span class="available-pill">متوفّر</span><span class="choice-icon">S1</span><h2>السداسي الأول</h2><p>${s1}</p><span class="choice-action">شوف المواد ←</span></button>
          <button class="choice-card featured-choice semester-two" data-go="/subjects?licence=${lic}&year=1&track=common&semester=2"><span class="available-pill">متوفّر</span><span class="choice-icon">S2</span><h2>السداسي الثاني</h2><p>${s2}</p><span class="choice-action">شوف المواد ←</span></button>
        </div>
        ${curriculumSemesterNote()}
      </div>`);return;
    }
    const t=trackInfo(q.track), isGenie=(q.track||'genie')==='genie';
    const second=isGenie?`<button class="choice-card featured-choice semester-two" data-go="/subjects?licence=info&year=2&track=genie&semester=2"><span class="available-pill">متوفّر</span><span class="choice-icon">S2</span><h2>السداسي الثاني</h2><p>الكور، TD، TP والملفات الجديدة.</p><span class="choice-action">شوف المواد ←</span></button>`:disabledCard('S2','السداسي الثاني','محتوى Multimédia الخاص بالسداسي الثاني موش كامل توا.','عندك كور S2 Multimédia؟ ابعثهولنا على 9rayti.learn@gmail.com باش نكمّلو الشعبة 🤝');
    screen(`<div class="screen-centered">${flowHead('/track?licence=info&year=2','المرحلة 4')}
      <div class="choice-intro"><span class="mini-label">${esc(t.label)}</span><h1>اختار السداسي</h1><p>${isGenie?'السداسي الأول والثاني متوفرين في Génie Logiciel.':'السداسي الأول مشترك مع Génie Logiciel، أمّا S2 متاع Multimédia مازال ناقص.'}</p></div>
      <div class="choice-grid"><button class="choice-card" data-go="/subjects?licence=info&year=2&track=${encodeURIComponent(q.track||'genie')}&semester=1"><span class="available-pill">متوفّر</span><span class="choice-icon">S1</span><h2>السداسي الأول</h2><p>الدروس، TD، TP والملفات.</p><span class="choice-action">شوف المواد ←</span></button>${second}</div>
      ${curriculumSemesterNote()}
    </div>`);
  }

  function subjects(q){
    const lic=licenceNo(q), year=yearNo(q), t=trackInfo(q.track), sem=semNo(q), li=licenceInfo(q), semLabel=sem==='2'?'السداسي الثاني':'السداسي الأول';
    document.title='المواد - قرايتي';
    const renderCards=list=>list.length?list.map(s=>`<button class="subject-card" data-go="/subject?licence=${lic}&id=${encodeURIComponent(s.id)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}">${subjectThumb(s)}<span class="subject-count">${fileCount(s.count)}</span><div class="subject-copy"><h3>${esc(s.name)}</h3><p>${esc(s.ar)}</p></div><span class="subject-open">افتح المادة ←</span></button>`).join(''):'<div class="empty">ما لقيناش مادة بالاسم هذا.</div>';
    const descr=lic==='lt'?'جامعة سوسة • ISITCom حمّام سوسة • 1LT':lic==='lce'?'LCE سنة أولى • جذع مشترك • مصادر من ISIM المهدية وملفات مشتركة من كلية العلوم بتونس':year==='1'?'جذع مشترك — علوم الإعلامية.':esc(t.label)+' — '+(sem==='1'?'S1 مشترك بين الشعبتين.':'محتوى S2 الموجود حاليًا خاص بـGénie Logiciel.');
    screen(`${flowHead(`/semester?licence=${lic}&year=${year}&track=${encodeURIComponent(q.track||'common')}`,'المواد')}
      <div class="subjects-top"><div><span class="mini-label">${esc(li.ar)} • السنة ${year==='1'?'الأولى':'الثانية'} • ${semLabel}</span><h1>اختار المادة</h1><p>${descr}</p></div><div class="subjects-tools"><button class="semester-average-cta" data-go="${averagePath(q)}"><span>🧮</span><b>احسب نتيجة السداسي</b><small>المواد الكل في بلاصة وحدة</small></button><label class="inline-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.4-3.4"></path></svg><input id="subjectFilter" placeholder="لوّج على مادة..."></label></div></div>
      <div id="subjectGrid" class="subject-grid">${renderCards(D.subjects)}</div>`,'subjects-screen');
    const input=document.getElementById('subjectFilter');let filterTimer=0;
    const searchable=D.subjects.map(s=>({s,key:(s.name+' '+s.ar+' '+s.abbr).toLowerCase()}));
    input.addEventListener('input',()=>{clearTimeout(filterTimer);filterTimer=setTimeout(()=>{const val=input.value.trim().toLowerCase();const list=val?searchable.filter(x=>x.key.includes(val)).map(x=>x.s):D.subjects;document.getElementById('subjectGrid').innerHTML=renderCards(list)},110)});
  }

  function subject(q){
    const lic=licenceNo(q), year=yearNo(q), sem=semNo(q), s=D.subjects.find(x=>x.id===q.id);if(!s)return subjects(q);
    const t=trackInfo(q.track), li=licenceInfo(q);document.title=`${s.name} - قرايتي`;
    const cats=s.categories.map(c=>`<button class="category-card" data-go="/groups?licence=${lic}&subject=${encodeURIComponent(s.id)}&category=${encodeURIComponent(c.id)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}"><div class="cat-row"><h3>${esc(c.name)}</h3><span class="cat-count">${fileCount(c.count)}</span></div><p>${esc(c.ar||categoryMeaning[c.id]||'')}</p><span class="card-arrow">افتح ←</span></button>`).join('');
    const vids=subjectVideos(s.id);const allTache=vids.length&&vids.every(v=>v.source==='Tâche-lik');
    const videoCard=vids.length?`<button class="category-card tachelik-category" data-go="/videos?licence=${lic}&subject=${encodeURIComponent(s.id)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}"><div class="cat-row"><h3>${allTache?'فيديوهات Tâche-lik':'فيديوهات وPlaylists مجانية'}</h3><span class="cat-count">${vids.length} ${vids.length===1?'مورد':'موارد'}</span></div><p>شروحات فيديو في قسم وحدو، بعيد على ترتيب الشابترات.</p><span class="card-arrow">شوف الفيديوهات ←</span></button>`:'';
    const lang=languageType(s);
    const languageCard=lang?`<button class="category-card language-check-card" data-go="/language-check?licence=${lic}&subject=${encodeURIComponent(s.id)}&lang=${lang}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}"><div class="language-check-icon">${lang==='fr'?'FR':'EN'}</div><div class="cat-row"><h3>حاس روحك ضعيف شوية؟</h3><span class="cat-count">10 أسئلة</span></div><p>اختبار صغير يعطيك نسبة وتقدير تقريبي لمستواك، وبعدها نصائح على قدّك.</p><span class="card-arrow">جرّب مستواك ←</span></button>`:'';
    const level=lic==='lt'?'LT • السنة الأولى':year==='1'?'علوم الإعلامية • السنة الأولى':esc(t.label)+' • السنة الثانية';
    screen(`${flowHead(`/subjects?licence=${lic}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}`,'المادة')}<div class="context-head">${subjectThumb(s)}<span class="context-kicker">${esc(s.ar)}</span><h1>${esc(s.name)}</h1><p>${fileCount(s.count)} • ${level} • ${sem==='2'?'السداسي الثاني':'السداسي الأول'}. اختار النوع اللي تحب عليه.</p></div><div class="category-grid">${languageCard}${cats}${videoCard}</div>`);
  }


  function gradeFormulaOptions(selected=''){
    const formulas=STUDENT_TOOLS.gradeFormulas||{};
    const groups=[['core','Core'],['prepa','Prépa'],['other','أخرى']];
    return `<option value="">اختار طريقة الحساب</option>`+groups.map(([group,label])=>{
      const opts=Object.entries(formulas).filter(([,f])=>f.group===group).map(([id,f])=>`<option value="${esc(id)}" ${selected===id?'selected':''}>${esc(f.label)}</option>`).join('');
      return opts?`<optgroup label="${label}">${opts}</optgroup>`:'';
    }).join('');
  }
  function averageStorageKey(q){return `qrayti-average-v21:${licenceNo(q)}:${yearNo(q)}:${semNo(q)}:${q.track||'common'}`}
  function loadAverageState(q){
    let saved={};try{saved=JSON.parse(localStorage.getItem(averageStorageKey(q))||'{}')||{}}catch{}
    const rows={...(saved.rows||{})};
    for(const s of D.subjects){
      rows[s.id]={name:s.name,coef:rows[s.id]?.coef??1,formula:rows[s.id]?.formula||'',tp:rows[s.id]?.tp??'',ds:rows[s.id]?.ds??'',exam:rows[s.id]?.exam??'',hidden:rows[s.id]?.hidden===true};
    }
    return {rows};
  }
  function saveAverageState(q,state){localStorage.setItem(averageStorageKey(q),JSON.stringify(state))}
  function validMark(v){
    if(v===''||v===null||v===undefined)return null;
    const n=Number(v);return Number.isFinite(n)&&n>=0&&n<=20?n:null;
  }
  function moduleAverage(row){
    const f=STUDENT_TOOLS.gradeFormulas?.[row.formula];if(!f)return null;
    let total=0;
    for(const key of ['tp','ds','exam']){
      const w=Number(f.weights?.[key]||0);if(!w)continue;
      const mark=validMark(row[key]);if(mark===null)return null;
      total+=mark*w;
    }
    return total;
  }
  function averageRowHtml(subject,row){
    const excluded=row.hidden===true;
    return `<article class="average-row${excluded?' average-row-excluded':''}" data-average-row="${esc(subject.id)}">
      <div class="average-subject"><div class="average-thumb-wrap">${subjectThumb(subject)}</div><div><b>${esc(subject.name)}</b><small>${esc(subject.ar||'')}</small></div><button type="button" class="average-hide-subject${excluded?' is-excluded':''}" data-average-hide="${esc(subject.id)}" title="${excluded?'رجّع المادة للحساب':'استبعد المادة من الحساب'}" aria-label="${excluded?'رجّع '+esc(subject.name)+' للحساب':'استبعد '+esc(subject.name)+' من الحساب'}" aria-pressed="${excluded?'true':'false'}"><span aria-hidden="true">✕</span></button></div>
      <label class="average-field average-coef-field"><span>المعامل</span><input class="average-coef" data-field="coef" type="number" min="0.1" max="20" step="0.1" inputmode="decimal" value="${esc(row.coef)}"></label>
      <label class="average-field average-formula-field"><span>طريقة الحساب</span><select class="average-formula" data-field="formula">${gradeFormulaOptions(row.formula)}</select></label>
      <div class="average-marks">
        <label class="average-field"><span>TP</span><input data-field="tp" type="number" min="0" max="20" step="0.01" inputmode="decimal" placeholder="—" value="${esc(row.tp)}"></label>
        <label class="average-field"><span>DS</span><input data-field="ds" type="number" min="0" max="20" step="0.01" inputmode="decimal" placeholder="—" value="${esc(row.ds)}"></label>
        <label class="average-field"><span>Examen</span><input data-field="exam" type="number" min="0" max="20" step="0.01" inputmode="decimal" placeholder="—" value="${esc(row.exam)}"></label>
      </div>
      <div class="average-module-result"><small>معدل المادة</small><b>—</b><span>/20</span></div>
    </article>`;
  }

  function average(q){
    const lic=licenceNo(q),year=yearNo(q),sem=semNo(q),li=licenceInfo(q),semLabel=sem==='2'?'السداسي الثاني':'السداسي الأول';
    document.title='احسب معدلك - قرايتي';
    const state=loadAverageState(q);
    screen(`${flowHead(`/subjects?${contextQuery(q)}`,'حساب المعدّل')}
      <div class="average-hero"><div><span class="mini-label">${esc(li.ar)} • السنة ${year==='1'?'الأولى':'الثانية'} • ${semLabel}</span><h1>احسب نتيجة السداسي 🧮</h1><p>دخل نقاطك للمواد اللي تقراهم فعلًا. مادة موش في برنامج جامعتك؟ اضغط ✕: تبقى قدّامك، أما تتسكر خاناتها وما تدخلش في المعدّل.</p></div><div class="average-total-card"><small>معدّلك توا</small><strong id="semesterAverage">—</strong><span>/20</span><p id="averageCoverage">استنّاو نقاط المواد</p></div></div>
      <div class="average-toolbar"><label><span>نفس طريقة الحساب للمواد اللي داخلة في الحساب</span><select id="averageApplyAll">${gradeFormulaOptions('')}</select></label><button class="average-reset" id="averageReset">فرّغ الحساب</button></div>
      <div class="average-note"><span>👁️</span><p>الجامعات موش الكل تقرا نفس المواد. اضغط علامة ✕ لاستبعاد مادة. المادة ما تختفيش، وخاناتها تتعطّل. اضغط ✕ مرة أخرى باش ترجعها للحساب.</p></div>
      <div id="averageRows" class="average-rows"></div>`,'average-screen');
    initAverageCalculator(q,state);
  }
  function initAverageCalculator(q,state){
    const root=document.getElementById('averageRows');if(!root)return;
    const syncRow=(el)=>{
      const id=el.dataset.averageRow,row=state.rows[id];if(!row)return;
      const excluded=row.hidden===true,formula=STUDENT_TOOLS.gradeFormulas?.[row.formula];
      el.classList.toggle('average-row-excluded',excluded);
      const toggle=el.querySelector('[data-average-hide]');
      if(toggle){toggle.classList.toggle('is-excluded',excluded);toggle.setAttribute('aria-pressed',excluded?'true':'false');toggle.title=excluded?'رجّع المادة للحساب':'استبعد المادة من الحساب'}
      const coef=el.querySelector('[data-field="coef"]'),formulaSelect=el.querySelector('[data-field="formula"]');
      if(coef)coef.disabled=excluded;if(formulaSelect)formulaSelect.disabled=excluded;
      for(const key of ['tp','ds','exam']){
        const input=el.querySelector(`[data-field="${key}"]`);if(!input)continue;
        const used=!!Number(formula?.weights?.[key]||0),unused=!!formula&&!used;
        input.disabled=excluded||unused;input.closest('.average-field')?.classList.toggle('field-unused',unused&&!excluded);
      }
      const result=excluded?null:moduleAverage(row),out=el.querySelector('.average-module-result b');if(out)out.textContent=result===null?'—':result.toFixed(2);
    };
    const refreshTotal=()=>{
      let weighted=0,coefTotal=0,done=0,active=0,hidden=0;
      for(const s of D.subjects){
        const row=state.rows[s.id];if(row?.hidden){hidden++;continue}active++;
        const avg=moduleAverage(row),coef=Number(row?.coef);
        if(avg===null||!Number.isFinite(coef)||coef<=0)continue;
        weighted+=avg*coef;coefTotal+=coef;done++;
      }
      const total=coefTotal?weighted/coefTotal:null;
      const out=document.getElementById('semesterAverage'),coverage=document.getElementById('averageCoverage');
      if(out)out.textContent=total===null?'—':total.toFixed(2);
      if(coverage){
        const suffix=hidden?` • مخبّيين ${hidden}`:'';
        if(!active)coverage.textContent='ما خليت حتى مادة في الحساب';
        else if(!done)coverage.textContent=`استنّاو نقاط المواد${suffix}`;
        else if(done===active)coverage.textContent=`تحسبت المواد الظاهرة الكل: ${done}/${active}${suffix}`;
        else coverage.textContent=`معدّل مؤقّت • تحسبت ${done} من ${active} مواد${suffix}`;
      }
      document.querySelector('.average-total-card')?.classList.toggle('average-ready',total!==null);
    };
    const render=()=>{
      root.innerHTML=D.subjects.map(s=>averageRowHtml(s,state.rows[s.id])).join('');
      root.querySelectorAll('[data-average-row]').forEach(syncRow);refreshTotal();
    };
    render();
    root.addEventListener('input',e=>{
      const input=e.target.closest('[data-field]');if(!input)return;
      const rowEl=input.closest('[data-average-row]'),id=rowEl?.dataset.averageRow;if(!id||!state.rows[id])return;
      state.rows[id][input.dataset.field]=input.value;saveAverageState(q,state);syncRow(rowEl);refreshTotal();
    });
    root.addEventListener('change',e=>{
      const input=e.target.closest('[data-field]');if(!input)return;
      const rowEl=input.closest('[data-average-row]'),id=rowEl?.dataset.averageRow;if(!id||!state.rows[id])return;
      state.rows[id][input.dataset.field]=input.value;saveAverageState(q,state);syncRow(rowEl);refreshTotal();
    });
    root.addEventListener('click',e=>{const btn=e.target.closest('[data-average-hide]');if(!btn)return;const id=btn.dataset.averageHide;if(!state.rows[id])return;state.rows[id].hidden=!state.rows[id].hidden;saveAverageState(q,state);syncRow(btn.closest('[data-average-row]'));refreshTotal()});
    const apply=document.getElementById('averageApplyAll');
    apply?.addEventListener('change',()=>{
      if(!apply.value)return;
      root.querySelectorAll('[data-average-row]').forEach(el=>{const id=el.dataset.averageRow;if(state.rows[id]?.hidden)return;state.rows[id].formula=apply.value;const sel=el.querySelector('.average-formula');if(sel)sel.value=apply.value;syncRow(el)});
      saveAverageState(q,state);refreshTotal();
    });
    document.getElementById('averageReset')?.addEventListener('click',()=>{
      if(!confirm('نفرّغ النقاط وطرق الحساب ونرجّع المواد المستبعدة للسداسي هذا؟'))return;
      localStorage.removeItem(averageStorageKey(q));average(q);
    });
  }

  let languageQuizState=null;
  function languageCheck(q){
    const lic=licenceNo(q),year=yearNo(q),sem=semNo(q),s=D.subjects.find(x=>x.id===q.subject);if(!s)return subjects(q);
    const lang=q.lang||languageType(s)||'en',questions=makeLanguageQuiz(lang);
    languageQuizState={lang,questions,index:0,correct:0,answers:[],q:{...q,licence:lic,year,semester:sem},subject:s};
    document.title=`اختبر مستواك - ${s.name} - قرايتي`;
    screen(`${flowHead(`/subject?licence=${lic}&id=${encodeURIComponent(s.id)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}`,'اختبار اللغة')}
      <div class="language-test-head"><div class="language-orb">${lang==='fr'?'FR':'EN'}</div><div><span class="mini-label">اختبار صغير • موش امتحان رسمي</span><h1>نشوفو مستواك وين وصل؟</h1><p>10 أسئلة خفاف من الساهل للأصعب. في الآخر نعطيوك نسبة، مستوى تقريبي، وشوية نصائح تنجم تبدأ بيهم من توا.</p></div></div>
      <div id="languageQuizBody" class="language-quiz-body"></div>`,'language-test-screen');
    renderLanguageQuizStep();
  }
  function renderLanguageQuizStep(){
    const st=languageQuizState,box=document.getElementById('languageQuizBody');if(!st||!box)return;
    if(st.index>=st.questions.length){renderLanguageResult();return}
    const q=st.questions[st.index],n=st.index+1,total=st.questions.length;
    box.innerHTML=`<div class="language-progress"><div><span style="width:${Math.round((st.index/total)*100)}%"></span></div><b>سؤال ${n} من ${total}</b></div>
      <article class="language-question"><span class="question-level">${esc(q.level)}</span><h2 dir="ltr">${esc(q.q)}</h2><div class="language-options">${q.options.map((o,i)=>`<button data-lang-answer="${i}" dir="${/[\u0600-\u06FF]/.test(o)?'rtl':'ltr'}">${esc(o)}</button>`).join('')}</div><small>جاوب على اللي تعرفو، وما تخافش من الغلطة.</small></article>`;
  }
  function answerLanguageQuestion(index){
    const st=languageQuizState;if(!st||st.index>=st.questions.length)return;
    const q=st.questions[st.index],choice=Number(index);if(!Number.isInteger(choice))return;
    if(choice===q.answer)st.correct++;
    st.answers.push({level:q.level,correct:choice===q.answer});st.index++;
    renderLanguageQuizStep();
  }
  function renderLanguageResult(){
    const st=languageQuizState,box=document.getElementById('languageQuizBody');if(!st||!box)return;
    const result=gradeLevel(st.correct,st.questions.length),advice=STUDENT_TOOLS.languageAdvice?.[st.lang]?.[result.level]||{title:'كمّل تخدم على روحك 💪',text:'النتيجة تقريبية، والمهم تعرف منين تبدأ.',tips:[]};
    const langName=st.lang==='fr'?'الفرنسية':'الإنجليزية';
    try{localStorage.setItem(`qrayti-lang-result:${st.lang}`,JSON.stringify({level:result.level,pct:result.pct,date:Date.now()}))}catch{}
    box.innerHTML=`<article class="language-result"><div class="language-score-ring" style="--score:${result.pct}"><strong>${result.pct}%</strong><span>إجابات صحيحة</span></div><div class="language-result-copy"><span class="mini-label">تقدير تقريبي في ${langName}</span><h2>${esc(result.level)} — ${esc(advice.title)}</h2><p>${esc(advice.text)}</p><div class="language-tips">${(advice.tips||[]).map(t=>`<div><span>✓</span><p>${esc(t)}</p></div>`).join('')}</div><div class="language-result-actions"><button id="langRetryBtn" class="primary-cta">عاود الاختبار</button><button class="soft-cta" data-go="/subject?licence=${encodeURIComponent(st.q.licence)}&id=${encodeURIComponent(st.subject.id)}&year=${encodeURIComponent(st.q.year)}&track=${encodeURIComponent(st.q.track||'common')}&semester=${encodeURIComponent(st.q.semester)}">ارجع للمادة</button></div><small class="language-disclaimer">هذا تقدير سريع باش يوجّهك، موش شهادة مستوى رسمية.</small></div></article>`;
  }
  function restartLanguageQuiz(){
    const st=languageQuizState;if(!st)return;
    st.questions=makeLanguageQuiz(st.lang);st.index=0;st.correct=0;st.answers=[];renderLanguageQuizStep();
  }

  function groups(q){
    const lic=licenceNo(q),year=yearNo(q),sem=semNo(q),s=D.subjects.find(x=>x.id===q.subject);if(!s)return subjects(q);const cat=s.categories.find(c=>c.id===q.category);if(!cat)return subject({id:s.id,licence:lic,year,track:q.track,semester:sem});
    const files=D.files.filter(f=>f.subject===s.id&&f.category===cat.id);const grouped={};files.forEach(f=>(grouped[f.group]??=[]).push(f));const names=Object.keys(grouped).sort((a,b)=>natural(a).localeCompare(natural(b)));document.title=`${cat.name} - ${s.name} - قرايتي`;
    if(s.id==='java'&&cat.id==='tp'){
      const teachers={};names.forEach(name=>{const parts=name.split('•').map(x=>x.trim());const teacher=parts[0]||'TP';(teachers[teacher]??=[]).push(name)});const teacherNames=Object.keys(teachers).sort((a,b)=>natural(a).localeCompare(natural(b)));
      const cards=teacherNames.map(teacher=>{const count=teachers[teacher].reduce((n,g)=>n+grouped[g].length,0);const tpCount=teachers[teacher].filter(g=>/TP\s*\d/i.test(g)).length;return `<button class="group-card teacher-card" data-go="/tp-teacher?licence=${lic}&subject=java&category=tp&teacher=${encodeURIComponent(teacher)}&year=${year}&track=${encodeURIComponent(q.track||'genie')}&semester=${sem}"><div class="teacher-avatar">👨‍🏫</div><div class="group-row"><h3>TPs متاع ${esc(teacher)}</h3><span class="group-count">${fileCount(count)}</span></div><p>${tpCount?`${tpCountLabel(tpCount)} مرتّبين داخل المجموعة`:'ملفات وتمارين الأستاذ'}</p><span class="card-arrow">اختار الـTP ←</span></button>`}).join('');
      screen(`${flowHead(`/subject?licence=${lic}&id=${encodeURIComponent(s.id)}&year=${year}&track=${encodeURIComponent(q.track||'genie')}&semester=${sem}`,'المحتوى')}<div class="context-head">${subjectThumb(s)}<span class="context-kicker">الأعمال التطبيقية</span><h1>${esc(s.name)}</h1><p>أول حاجة اختار الأستاذ، وبعدها تلقى TP 1، TP 2، TP 3… مرتّبين وحدهم.</p></div><div class="group-grid teacher-grid">${cards}</div>`);return;
    }
    const genericCourseFiles=cat.id==='cours'?names.filter(isGenericCourseGroup).flatMap(name=>grouped[name]).sort((a,b)=>natural(fileLabel(a)).localeCompare(natural(fileLabel(b)))):[];
    const regularNames=cat.id==='cours'?names.filter(name=>!isGenericCourseGroup(name)):names;
    const cards=regularNames.map(name=>{const meta=groupMeta(s.id,name,grouped[name]);if(cat.id==='cours'&&meta.topic)return `<button class="group-card chapter-card" data-go="/files?licence=${lic}&subject=${encodeURIComponent(s.id)}&category=${encodeURIComponent(cat.id)}&group=${encodeURIComponent(name)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}"><div class="chapter-card-top"><span class="chapter-number">${esc(meta.chapter)}</span><span class="group-count">${fileCount(grouped[name].length)}</span></div><h3>${esc(meta.topic)}</h3><p>إقرا محتوى الجزء والملفات المرتبطة بيه.</p><span class="card-arrow">ادخل ←</span></button>`;return `<button class="group-card" data-go="/files?licence=${lic}&subject=${encodeURIComponent(s.id)}&category=${encodeURIComponent(cat.id)}&group=${encodeURIComponent(name)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}"><div class="group-row"><h3>${esc(name)}</h3><span class="group-count">${fileCount(grouped[name].length)}</span></div><p>شوف الملفات الموجودة في المجموعة هاذي.</p><span class="card-arrow">افتح ←</span></button>`}).join('');
    const directCourses=genericCourseFiles.length?`<section class="inline-course-section"><div class="inline-course-heading"><div><span class="chapter-number inline-course-badge">كور فرعي</span><h2>كور إضافية من غير شابتر محدّد</h2></div><small>${fileCount(genericCourseFiles.length)}</small></div><div class="inline-course-grid">${genericCourseFiles.map(inlineCourseFile).join('')}</div></section>`:'';
    screen(`${flowHead(`/subject?licence=${lic}&id=${encodeURIComponent(s.id)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}`,'المحتوى')}<div class="context-head">${subjectThumb(s)}<span class="context-kicker">${esc(cat.ar||categoryMeaning[cat.id]||cat.name)}</span><h1>${esc(s.name)}</h1><p>${cat.id==='cours'?'الشابترات مرتّبة وحدها، والكور اللي ما عندهاش شابتر واضح تظهر مباشرة كـ«كور فرعي».':'اختار المجموعة اللي تحب عليها.'}</p></div><div class="group-grid ${cat.id==='cours'?'chapter-grid':''}">${cards}</div>${directCourses}`);
  }

  function tpTeacher(q){
    const lic=licenceNo(q),year=yearNo(q),sem=semNo(q),s=D.subjects.find(x=>x.id===q.subject);if(!s)return subjects(q);const cat=s.categories.find(c=>c.id===q.category);if(!cat)return subject({id:s.id,licence:lic,year,track:q.track,semester:sem});const teacher=q.teacher||'';const fs=D.files.filter(f=>f.subject===s.id&&f.category===cat.id&&String(f.group||'').split('•')[0].trim()===teacher);const grouped={};fs.forEach(f=>(grouped[f.group]??=[]).push(f));const names=Object.keys(grouped).sort((a,b)=>natural(a).localeCompare(natural(b)));
    const cards=names.map(name=>{const cl=name.includes('•')?name.split('•').slice(1).join('•').trim():name;return `<button class="group-card tp-card" data-go="/files?licence=${lic}&subject=${encodeURIComponent(s.id)}&category=${encodeURIComponent(cat.id)}&group=${encodeURIComponent(name)}&year=${year}&track=${encodeURIComponent(q.track||'genie')}&semester=${sem}"><div class="tp-number">${esc(cl||'ملفات')}</div><div class="group-row"><h3>${esc(cl||name)}</h3><span class="group-count">${fileCount(grouped[name].length)}</span></div><p>${esc(teacher)}</p><span class="card-arrow">شوف الملفات ←</span></button>`}).join('');
    screen(`${flowHead(`/groups?licence=${lic}&subject=${encodeURIComponent(s.id)}&category=${encodeURIComponent(cat.id)}&year=${year}&track=${encodeURIComponent(q.track||'genie')}&semester=${sem}`,'Java TP')}<div class="context-head">${subjectThumb(s)}<span class="context-kicker">TPs متاع الأستاذ</span><h1>${esc(teacher)}</h1><p>اختار الـTP اللي تحب عليه.</p></div><div class="group-grid tp-grid">${cards}</div>`);
  }

  function videos(q){
    const lic=licenceNo(q),year=yearNo(q),sem=semNo(q),s=D.subjects.find(x=>x.id===q.subject);if(!s)return subjects(q);const vids=subjectVideos(s.id);document.title=`فيديوهات - ${s.name} - قرايتي`;
    const cards=vids.length?vids.map((v,i)=>`<button class="standalone-video-card" data-video-subject="${esc(s.id)}" data-video-index="${i}"><span class="standalone-video-icon">▶</span><div class="standalone-video-copy"><span class="tachelik-badge">${esc(v.source||'YouTube')} • ${esc(v.type||'فيديو')}</span><h3>${esc(v.title)}</h3><p>يتحلّ ويتشاهد داخل قرايتي.</p></div><span class="watch-here">شاهد هنا ←</span></button>`).join(''):`<div class="empty">ما فماش فيديوهات للمادة هاذي توّا.</div>`;
    screen(`${flowHead(`/subject?licence=${lic}&id=${encodeURIComponent(s.id)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}`,'الفيديوهات')}<div class="context-head">${subjectThumb(s)}<span class="context-kicker">فيديوهات وPlaylists</span><h1>${esc(s.name)}</h1><p>الفيديوهات في قسم وحدهم باش ما يختلطوش بالشابترات. اسم المصدر مكتوب على كل فيديو.</p></div><div class="standalone-video-grid">${cards}</div>`,'videos-screen');
  }

  function files(q){
    const lic=licenceNo(q),year=yearNo(q),sem=semNo(q),s=D.subjects.find(x=>x.id===q.subject);if(!s)return subjects(q);const cat=s.categories.find(c=>c.id===q.category);if(!cat)return subject({id:s.id,licence:lic,year,track:q.track,semester:sem});const fs=D.files.filter(f=>f.subject===s.id&&f.category===cat.id&&f.group===q.group).sort((a,b)=>natural(fileLabel(a)).localeCompare(natural(fileLabel(b))));const meta=groupMeta(s.id,q.group,fs);document.title=`${meta.full||q.group} - ${s.name} - قرايتي`;const rows=fs.map(fileRow).join('');const teacher=(s.id==='java'&&cat.id==='tp')?String(q.group||'').split('•')[0].trim():'';const backPath=teacher?`/tp-teacher?licence=${lic}&subject=${encodeURIComponent(s.id)}&category=${encodeURIComponent(cat.id)}&teacher=${encodeURIComponent(teacher)}&year=${year}&track=${encodeURIComponent(q.track||'genie')}&semester=${sem}`:`/groups?licence=${lic}&subject=${encodeURIComponent(s.id)}&category=${encodeURIComponent(cat.id)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}`;
    const note='كان المصدر معروف، تلقاه مكتوب تحت الملف.';
    if(cat.id==='cours'&&meta.topic){const practice=s.categories.find(c=>c.id==='td')||s.categories.find(c=>c.id==='tp');const practiceLink=practice?`<a class="practice-link" href="#/groups?licence=${lic}&subject=${encodeURIComponent(s.id)}&category=${encodeURIComponent(practice.id)}&year=${year}&track=${encodeURIComponent(q.track||'common')}&semester=${sem}"><span>✍️</span><div><b>تحب تطبّق؟</b><p>امشي لـ${esc(practice.name)} متاع المادة بعد ما تكمل القراءة.</p></div><strong>شوف التمارين ←</strong></a>`:'';screen(`${flowHead(backPath,'الشابتر')}<div class="chapter-hero">${subjectThumb(s)}<div class="chapter-hero-copy"><span class="chapter-eyebrow">${esc(meta.chapter)} • ${esc(s.name)}</span><h1>${esc(meta.topic)}</h1><p>هنا تلقى الكور والملفات المرتبطة بالجزء هذا مرتّبة وحدها.</p></div></div><section class="learning-panel reading-panel chapter-reading-only"><div class="learning-head"><span class="learning-icon">📖</span><div><span>القراءة</span><h2>الكور والـPDF</h2></div><small>${fileCount(fs.length)}</small></div><div class="files-wrap chapter-files">${rows||'<div class="empty">ما فماش ملفات هنا.</div>'}</div></section>${practiceLink}<div class="source-note">${note}</div>`,'chapter-screen');return}
    screen(`${flowHead(backPath,'الملفات')}<div class="context-head">${subjectThumb(s)}<span class="context-kicker">${esc(cat.name)} • ${esc(s.name)}</span><h1>${esc(q.group)}</h1><p>${fileCount(fs.length)} موجودين هنا. اختار الملف اللي تحب تفتحو.</p></div><div class="source-note">${note}</div><div class="files-wrap">${rows||'<div class="empty">ما فماش ملفات هنا.</div>'}</div>`);
  }

  function fileRow(f){
    const src=sourceText(f), label=fileLabel(f),readable=isReadableFile(f);
    return `<div class="file-row">
      <div class="file-main"><div class="file-info"><div class="file-name" title="${esc(fileLabel(f))}">${esc(label)}</div>${f.topic?`<div class="file-topic">${esc(f.topic)}</div>`:''}${src?`<div class="file-source ${f.sourceBasis==='series'?'series':f.sourceUniversity?'known':'unknown'}">${esc(src)}</div>`:''}</div></div>
      <div class="file-side"><span class="file-size">${esc(f.sizeText)}</span><div class="file-actions"><button class="open-btn" data-file="${f.id}">${readable?(f.kind==='audio'?'اسمع':'إقرا'):'افتح'}</button><button class="download-btn" data-download-file="${f.id}" title="تحميل الملف">صبّو ↓</button></div></div>
    </div>`;
  }


  const DEFAULT_FAQ_CONFIG={"baseVersion":24,"enabled":true,"name":"بديس القراي","eyebrow":"FAQ • بديس القراي يجاوبك","title":"أسئلة ممكن تسألها فعلًا","intro":"إذا ضعت ولا تحب تعرف كيفاش تستعمل قرايتي، بديس القراي يعطيك الجواب المختصر والواضح.","items":[{"id":"faq1","enabled":true,"question":"كيفاش نلقى الكور متاع مادّتي بسرعة؟","answer":"اختار الإجازة، السنة والسداسي، وبعدها المادة. داخل المادة تلقى Cours وTD وTP والفيديوهات كل واحد في بلاصتو، والشابترات مكتوبة بالموضوع باش ما تضيعش بين أسماء الملفات."},{"id":"faq2","enabled":true,"question":"الكور هذا لازم يكون من نفس جامعتي باش ينفعني؟","answer":"موش بالضرورة. برشة مواد وبرامج يتشابهو بين الجامعات. شوف اسم المادة والشابتر والمصدر المكتوب تحت الملف، وقارنهم بالبرنامج اللي تقراه عند أستاذك."},{"id":"faq3","enabled":true,"question":"كيفاش نعرف الملف جاي من أي جامعة؟","answer":"كان الجامعة ولا المعهد واضحين داخل الملف، نكتبهم. وإذا المصدر متأكد من صاحب المجموعة أو من أرشيف جامعي واضح، نكتبوه كمصدر للمجموعة. ما ننسبوش ملف لجامعة بلا دليل."},{"id":"faq4","enabled":true,"question":"وين نلقى فيديوهات Tâche-lik وباقي فيديوهات YouTube؟","answer":"إذا المادة عندها فيديوهات، تلقى قسم «فيديوهات» مستقل داخل المادة. Tâche-lik عليها علامتها الخاصة، والمصادر الأخرى مكتوبة باسمها زادة."},{"id":"faq5","enabled":true,"question":"وقت نشاهد فيديو، يخرجني من قرايتي؟","answer":"لا. الفيديو يتفتح في Player داخل الموقع، وتبقى في نفس المادة من غير ما تمشي لصفحة YouTube."},{"id":"faq6","enabled":true,"question":"نجم نحمّل الملف ولا لازم نقراه داخل الموقع؟","answer":"إي. جنب «إقرا» تلقى زر «صبّو». PDF والصور والنصوص وملفات Word وPowerPoint المدعومة تنجم تتقرا داخل قرايتي. Packet Tracer وZIP والأنواع الخاصة يبقاو للتحميل والبرنامج المناسب."},{"id":"faq7","enabled":true,"question":"لقيت اسم شابتر ولا تصنيف غالط، شنعمل؟","answer":"يصير عادي خاطر الملفات برشة. ابعثلنا اسم المادة والملف والغلط على 9rayti.learn@gmail.com أو على Instagram @amine.akermii ونراجعوه."},{"id":"faq8","enabled":true,"question":"عندي كور ولا TD ولا TP ونحب نساهم، كيفاش؟","answer":"أكيد. ابعث الكور ولا الـTD ولا الـTP ولا الامتحان على 9rayti.learn@gmail.com أو Instagram @amine.akermii ، ومعاه اسم الإجازة والسنة والمادة إذا تنجم."},{"id":"faq9","enabled":true,"question":"وقتاش تزيد سنة، شعبة ولا إجازة ناقصة؟","answer":"ما فماش تاريخ ثابت. نزيدو المحتوى وقت تتوفّر ملفات كافية ونراجعوها ونرتّبوها. أي جزء ناقص تلقاه معلّم «موش متوفّر توا» بدل ما نوعدو بتاريخ موش مضمون."},{"id":"faq10","enabled":true,"question":"ملف ما تحلّش عندي، شنعمل؟","answer":"جرّب «افتح وحدو». بعض الملفات يلزمها برنامج خاص باش تتحل، كيما Packet Tracer ولا ملفات ZIP. وإذا بقات المشكلة ابعثلنا اسم الملف على الإيميل."}]};
  DEFAULT_FAQ_CONFIG.baseVersion=25;
  DEFAULT_FAQ_CONFIG.items.push({id:'faq11',enabled:true,question:'شنوّة وضع حقوق الكور والملفات؟',answer:'قرايتي يفهرس ملفات تعليمية كانت منشورة ومتداولة على الإنترنت، لكن هذا ما يعنيش أن عندنا ترخيصًا من كل أستاذ أو جامعة. الأفضل تسأل الأستاذ أو الجهة المالكة قبل إعادة النشر. إذا عطاوكم الإذن، افتح «تواصل» ثم «ابعث كور لقرايتي» ونذكروا الجامعة والأستاذ بوضوح. وإذا صاحب حق طلب حذف ملف، نحّيوه.'});
  DEFAULT_FAQ_CONFIG.items.find(item=>item.id==='faq7').answer='يصير عادي خاطر الملفات برشة. افتح «تواصل» واختار «تواصل مع صاحب قرايتي»، وابعثلنا اسم المادة والملف والغلط.';
  DEFAULT_FAQ_CONFIG.items.find(item=>item.id==='faq8').answer='أكيد. افتح «تواصل» واختار «ابعث كور لقرايتي»، ومع الملف اكتب اسم الإجازة والسنة والمادة إذا تنجم.';
  let faqConfig=DEFAULT_FAQ_CONFIG;
  function renderFaq(config=faqConfig){
    faqConfig=config||DEFAULT_FAQ_CONFIG;
    const btn=document.getElementById('faqBtn'),list=document.getElementById('faqList'),head=document.querySelector('.faq-head>div');
    if(btn){
      btn.hidden=faqConfig.enabled===false;
      btn.setAttribute('aria-label',`أسئلة شائعة — اسأل ${faqConfig.name||'بديس القراي'}`);
      const small=btn.querySelector('.faq-bubble small');if(small)small.textContent=`اسأل «${faqConfig.name||'بديس القراي'}»`;
    }
    if(head){
      const e=head.querySelector('.mini-label'),h=head.querySelector('h2'),p=head.querySelector('p');
      if(e)e.textContent=faqConfig.eyebrow||`FAQ • ${faqConfig.name||'بديس القراي'} يجاوبك`;
      if(h)h.textContent=faqConfig.title||'أسئلة ممكن تسألها فعلًا';
      if(p)p.textContent=faqConfig.intro||'';
    }
    if(list){
      const items=(faqConfig.items||[]).filter(x=>x?.enabled!==false&&x?.question&&x?.answer);
      list.innerHTML=items.length?items.map((x,i)=>`<details${i===0?' open':''}><summary>${esc(x.question)}</summary><p>${esc(x.answer)}</p></details>`).join(''):'<div class="empty">ما فماش أسئلة مفعّلة توا.</div>';
    }
  }
  renderFaq();
  fetch('/api/faq',{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(d=>{if(d?.config)renderFaq(d.config)}).catch(()=>{});
  function refreshAndroidRelease(){
    fetch('/api/android-update',{headers:{Accept:'application/json'},cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{
      if(!d)return;
      const meta=document.getElementById('androidReleaseMeta'),label=document.getElementById('androidDownloadLabel');
      const size=d.size?`${(d.size/1048576).toFixed(1)} MB`:'APK';
      if(meta)meta.textContent=`Qrayti ${d.versionName||''} • Android 9+ • ${size}`;
      if(label)label.textContent=`حمّل ${d.versionName||'التطبيق'} ↓`;
    }).catch(()=>{});
  }

  let deferredInstallPrompt=null;
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e});
  function installQrayti(){
    const t=document.getElementById('installHelpText');
    if(t){const ios=/iPad|iPhone|iPod/.test(navigator.userAgent);t.textContent=ios?'نسخة iPhone جاهزة: ثبّتها من Safari في ثلاث خطوات.':'اختار Android للنسخة الأصلية أو iPhone للـWeb App الجاهزة.';}
    refreshAndroidRelease();
    showModal('installModal');
  }
  function installIosQrayti(){
    const steps=document.getElementById('iosInstallSteps'),t=document.getElementById('installHelpText');
    if(!steps)return;
    if(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true){if(t)t.textContent='قرايتي مثبتة على iPhone هذا ✓';return}
    steps.hidden=false;
    if(t)t.textContent=/iPad|iPhone|iPod/.test(navigator.userAgent)?'كمّل الخطوات تحت في Safari، وبعدها تظهر قرايتي في Home Screen.':'افتح نفس الموقع على iPhone باستعمال Safari وكمّل الخطوات.';
    steps.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  let owlTimer=0;
  let owlAutoTimer=0;
  const owlStudyPaths=new Set(['/subject','/groups','/tp-teacher','/files','/videos','/language-check','/average']);
  const DEFAULT_OWL_CONFIG={
    baseVersion:24,enabled:false,name:'حما غراب',emoji:'🦉',minDelaySec:42,maxDelaySec:105,maxPerSession:3,
    scenarios:[
      {id:'life',enabled:true,weight:3,prompt:'توا هذا وضع؟ هذي حياة؟ 😭',choices:[{label:'خلّيني نقرا يا حما',reply:'إي باهي باهي… كمّل قبل ما نزيد نهبطلك المعنويات 😭'},{label:'عندك حل؟',reply:'عندي: سكّر التليفون واقرا. حلّ عبقري نعرف 😎'}]},
      {id:'kantar',enabled:true,weight:2,prompt:'نمشي نخدم كنتاري أحسن من تحضير للعوام؟ نشوف نلقى ليهم خدمة ولا لا مبعد 😭',choices:[{label:'امشي اخدم 😂',reply:'لا لا نستنى… يمكن الشابتر هذا يطلع فيه مستقبل.'},{label:'اقعد ساكت',reply:'حاضر يا أستاذ. نرجعلك بعد شوية 👀'}]},
      {id:'copy',enabled:true,weight:2,prompt:'واا بس… من غادي تحب تنقل؟ 😏',choices:[{label:'من حتى حد',reply:'هكا نحبك. اقرا وحدك يا مثقّف 😒'},{label:'ورّيني أول 😭',reply:'لا يا فالح، أنا نحرّض برك وما نعطيش techniques 😂'}]},
      {id:'d17',enabled:true,weight:1,prompt:'اسمع… عندك دينار زايد ما تعرفش وين تحطّو؟ 👀',choices:[{label:'نعطيهولك؟ 😭',reply:'ابعثو على D17 متاع حما غراب… ههه نضحك معاك، خلي دينارك واشري بيه كسكروت 😂'},{label:'لا يا متحيّلة',reply:'ياخي باهي… حتى دينار ما عطيتوني، ونقعد نحضّر في العوام 😒'}]},
      {id:'scroll',enabled:true,weight:3,prompt:'ياخي تقرا ولا تعمل في Scroll رياضي؟ 👀',choices:[{label:'نقرا والله',reply:'نصدّقك المرة هاذي. كمّل 😏'},{label:'شدّيتني 😭',reply:'إي شدّيتك. توا ارجع للشابتر.'}]}
    ]
  };
  let owlConfig=DEFAULT_OWL_CONFIG;
  fetch('/api/mascot',{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(d=>{if(d?.config){owlConfig=d.config;clearTimeout(owlTimer);owlTimer=0;syncStudyOwl(parseRoute().path)}}).catch(()=>{});
  function owlCount(){return Number(sessionStorage.getItem('qraytiOwlCount')||0)||0}
  function owlUsed(){try{return JSON.parse(sessionStorage.getItem('qraytiOwlUsed')||'[]')}catch{return[]}}
  function setOwlUsed(ids){try{sessionStorage.setItem('qraytiOwlUsed',JSON.stringify(ids.slice(-30)))}catch{}}
  function pickOwlScenario(){
    const enabled=(owlConfig.scenarios||[]).filter(x=>x?.enabled!==false&&x?.prompt);if(!enabled.length)return null;
    const used=new Set(owlUsed()),fresh=enabled.filter(x=>!used.has(x.id)),pool=fresh.length?fresh:enabled;
    const weighted=[];for(const s of pool){const w=Math.max(1,Math.min(10,Number(s.weight)||1));for(let i=0;i<w;i++)weighted.push(s)}
    const chosen=weighted[Math.floor(Math.random()*weighted.length)]||pool[0];if(chosen?.id){if(!fresh.length)setOwlUsed([chosen.id]);else setOwlUsed([...used,chosen.id])}return chosen;
  }
  function owlDelay(){const min=Math.max(10,Number(owlConfig.minDelaySec)||42),max=Math.max(min,Number(owlConfig.maxDelaySec)||105);return Math.round((min+Math.random()*(max-min))*1000)}
  function removeStudyOwl(scheduleAgain=true){
    clearTimeout(owlAutoTimer);owlAutoTimer=0;const owl=document.getElementById('studyOwl');if(!owl){if(scheduleAgain)setTimeout(()=>syncStudyOwl(parseRoute().path),800);return}
    owl.classList.add('owl-fly-away');setTimeout(()=>{owl.remove();if(scheduleAgain)syncStudyOwl(parseRoute().path)},900);
  }
  function renderOwlTalk(owl,scenario){
    const talk=owl.querySelector('.owl-talk'),choices=(scenario.choices||[]).slice(0,3);
    talk.innerHTML=`<small class="owl-name">${esc(owlConfig.name||'حما غراب')}</small><b>${esc(scenario.prompt)}</b><div class="owl-choice-row">${choices.length?choices.map((c,i)=>`<button data-owl-choice="${i}">${esc(c.label||'جاوب')}</button>`).join(''):'<button data-owl-close>برا خلّيني نقرا 😭</button>'}</div>`;
  }
  function hamaCrowArt(){
    return `<svg class="hama-crow" viewBox="0 0 100 100" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <ellipse class="crow-shadow" cx="51" cy="89" rx="29" ry="5"/>
      <path class="crow-feet" d="M40 79v9m-6 2 6-2 6 2m15-11v9m-6 2 6-2 6 2"/>
      <path class="crow-wing crow-wing-back" d="M31 46C13 38 8 44 13 59c4 10 11 15 22 16Z"/>
      <path class="crow-tail" d="m60 73 17 11-4-18Z"/>
      <path class="crow-body" d="M25 49c-1-12 5-24 18-28l-2-8 10 5 6-7 3 11c14 4 21 16 20 31-1 21-12 32-28 32-17 0-28-13-27-36Z"/>
      <path class="crow-bib" d="M33 59c11 7 27 7 38-1 1 13-7 22-19 22-11 0-18-8-19-21Z"/>
      <path class="crow-wing crow-wing-front" d="M70 48c19-15 23-8 17 8-4 10-9 15-18 18"/>
      <path class="crow-brow" d="m33 35 10 2m17 0 10-2"/>
      <g class="crow-eyes"><ellipse cx="40" cy="45" rx="8" ry="10"/><ellipse cx="62" cy="45" rx="8" ry="10"/>
      <g class="crow-pupils"><ellipse cx="43" cy="46" rx="3.5" ry="5"/><ellipse cx="65" cy="46" rx="3.5" ry="5"/>
      <circle class="crow-glint" cx="44" cy="44" r="1.2"/><circle class="crow-glint" cx="66" cy="44" r="1.2"/></g></g>
      <path class="crow-beak" d="m46 57 8-7 13 9-13 5Z"/><path class="crow-smirk" d="m54 59 9-1"/>
      <path class="crow-cheek" d="m28 56 5 2m37 0 5-2"/>
    </svg>`;
  }
  function spawnStudyOwl(){
    owlTimer=0;if(owlConfig.enabled===false||owlCount()>=Math.max(1,Number(owlConfig.maxPerSession)||3)||!owlStudyPaths.has(parseRoute().path)||document.getElementById('studyOwl'))return;
    const scenario=pickOwlScenario();if(!scenario)return;const owl=document.createElement('div'),side=Math.random()<.5?'owl-left':'owl-right',top=Math.round(25+Math.random()*42);
    sessionStorage.setItem('qraytiOwlCount',String(owlCount()+1));owl.id='studyOwl';owl.className=`study-owl ${side}`;owl.style.setProperty('--owl-top',`${top}vh`);owl.setAttribute('aria-live','polite');owl.dataset.scenario=scenario.id||'';
    owl.innerHTML=`<div class="owl-body" aria-hidden="true">${hamaCrowArt()}</div><div class="owl-talk"></div>`;document.body.appendChild(owl);renderOwlTalk(owl,scenario);requestAnimationFrame(()=>requestAnimationFrame(()=>owl.classList.add('owl-arrive')));owlAutoTimer=setTimeout(()=>removeStudyOwl(true),18000);
  }
  function syncStudyOwl(path){
    clearTimeout(owlTimer);owlTimer=0;if(owlConfig.enabled===false||owlCount()>=Math.max(1,Number(owlConfig.maxPerSession)||3))return;
    if(!owlStudyPaths.has(path)){const owl=document.getElementById('studyOwl');if(owl)owl.remove();return}if(document.getElementById('studyOwl'))return;owlTimer=setTimeout(spawnStudyOwl,owlDelay());
  }
  function answerStudyOwl(index){
    const owl=document.getElementById('studyOwl');if(!owl)return;const scenario=(owlConfig.scenarios||[]).find(x=>String(x.id||'')===String(owl.dataset.scenario||''));const choice=scenario?.choices?.[Number(index)];if(!choice)return removeStudyOwl(true);clearTimeout(owlAutoTimer);owl.classList.add('owl-answered');const talk=owl.querySelector('.owl-talk');talk.innerHTML=`<small class="owl-name">${esc(owlConfig.name||'حما غراب')}</small><b>${esc(choice.reply||'باهي 😒')}</b><button data-owl-close>سكر وخليّني نكمّل</button>`;owlAutoTimer=setTimeout(()=>removeStudyOwl(true),9500);
  }

  function showModal(id){const m=document.getElementById(id);m.classList.add('show');m.setAttribute('aria-hidden','false');document.documentElement.classList.add('qrayti-modal-open');document.body.style.overflow='hidden'}
  function hideModal(id){const m=document.getElementById(id);if(!m)return;m.classList.remove('show');m.setAttribute('aria-hidden','true');if(id==='videoModal'){const frame=document.getElementById('videoFrame');if(frame)frame.src=''}document.body.style.overflow='';if(!document.querySelector('.modal.show'))document.documentElement.classList.remove('qrayti-modal-open')}

  function triggerDownload(url,f){
    if(!url)return;
    const a=document.createElement('a');a.href=url;a.rel='noopener';a.target='_blank';a.download=f?.name||'';a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500);
  }
  async function resolveFileUrls(f){
    if(f?.assetUrl)return {provider:'qrayti-r2',previewUrl:f.assetUrl,viewUrl:f.assetUrl,downloadUrl:f.downloadUrl||`${f.assetUrl}${f.assetUrl.includes('?')?'&':'?'}download=1`};
    const preferLocal=window.QraytiRemoteConfig?.preferLocalContent===true;
    if(preferLocal&&f?.path)return {provider:'local',previewUrl:f.path,viewUrl:f.path,downloadUrl:f.path,local:true};
    for(let attempt=0;attempt<2;attempt++){
      try{const remote=await window.QraytiPlatform?.getRemote?.(f?.id);if(remote)return remote}catch{}
      if(attempt===0)await new Promise(resolve=>setTimeout(resolve,350));
    }
    return null;
  }
  async function downloadFile(id){
    const f=byId(id);if(!f)return;
    const remote=await resolveFileUrls(f);if(!remote?.downloadUrl&&!remote?.viewUrl)return;
    triggerDownload(remote.downloadUrl||remote.viewUrl,f);
  }
  function publicAbsoluteUrl(url){
    try{return new URL(String(url||''),location.href).href}catch{return ''}
  }
  function officePublicSource(f,remote){
    if(!remote)return '';
    // Admin uploads live in R2 behind an extension-less API URL. Give Office Viewer
    // a public URL that also contains the real filename/extension.
    if(remote.provider==='qrayti-r2'&&f?.id){
      const name=encodeURIComponent(f.name||f.originalName||`file.${fileExtFrom(f)||'docx'}`);
      return `${location.origin}/api/office/${encodeURIComponent(f.id)}/${name}`;
    }
    return publicAbsoluteUrl(remote.viewUrl||remote.previewUrl);
  }
  function officeEmbedUrl(f,remote){
    if(remote?.provider==='google-drive')return remote.previewUrl||'';
    const src=officePublicSource(f,remote);
    if(!src||!/^https:\/\//i.test(src))return '';
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`;
  }
  function mountFramedViewer(body,url,title,note=''){
    body.classList.remove('drive-loaded');
    body.innerHTML=`<div class="drive-viewer-shell office-viewer-shell"><div class="drive-loader"><span></span><b>نفتحلك الملف…</b></div>${note?`<div class="office-viewer-note">${esc(note)}</div>`:''}<iframe class="drive-preview-frame" src="${esc(url)}" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen" title="${esc(title)}"></iframe></div>`;
    const frame=body.querySelector('.drive-preview-frame');
    frame?.addEventListener('load',()=>body.classList.add('drive-loaded'),{once:true});
    frame?.addEventListener('error',()=>{
      const retry=new URL(url,location.href);retry.searchParams.set('_qrayti_retry',Date.now());
      frame.src=retry.href;
    },{once:true});
    setTimeout(()=>body.classList.add('drive-loaded'),6500);
  }
  function officeFallback(body,f,remote){
    body.innerHTML=`<div class="download-card office-fallback-card"><div class="big-type">📄</div><h3>افتح الملف</h3><p>العرض داخل قرايتي يحتاج إنترنت. إذا العارض ما خدمش، تنجم تفتح الملف وحدو أو تصبّو.</p><a href="${esc(remote?.downloadUrl||remote?.viewUrl||'#')}" download>صبّ الملف</a></div>`;
  }
  async function openFile(id){
    const f=byId(id); if(!f)return;
    document.getElementById('viewerTitle').textContent=fileLabel(f);
    const bits=[]; if(f.subjectName)bits.push(f.subjectName); if(f.sizeText)bits.push(f.sizeText); if(sourcePlain(f))bits.push(sourcePlain(f));
    document.getElementById('viewerMeta').textContent=bits.join(' • ');
    const link=document.getElementById('viewerOpen'),download=document.getElementById('viewerDownload');
    const body=document.getElementById('viewerBody');body.innerHTML='';body.classList.remove('drive-loaded');
    const remote=await resolveFileUrls(f);
    if(download){download.hidden=!remote?.downloadUrl;download.href=remote?.downloadUrl||'#';download.setAttribute('download',f.name||'');}
    if(remote?.local){
      link.hidden=false;link.textContent='افتح وحدو';link.href=encodeURI(remote.viewUrl);
      if(f.kind==='audio')body.innerHTML=`<div class="download-card audio-card"><div class="big-type">🎧</div><audio controls preload="metadata" src="${encodeURI(remote.previewUrl)}"></audio><a href="${encodeURI(remote.downloadUrl)}" download>صبّ الملف الصوتي</a></div>`;
      else if(f.kind==='pdf')body.innerHTML=`<iframe src="${encodeURI(remote.previewUrl)}#view=FitH" loading="eager" title="${esc(fileLabel(f))}"></iframe>`;
      else if(f.kind==='image')body.innerHTML=`<img src="${encodeURI(remote.previewUrl)}" alt="${esc(f.name)}">`;
      else if(f.kind==='text'){
        body.innerHTML='<div class="search-hint">نفتحلك الملف…</div>';
        try{const r=await fetch(remote.previewUrl);if(!r.ok)throw new Error(String(r.status));const t=await r.text();body.innerHTML=`<pre>${esc(t)}</pre>`}
        catch{body.innerHTML=`<div class="download-card"><div class="big-type">📄</div><p>ما نجّمش نعرض الملف داخل الصفحة توا.</p><a href="${encodeURI(remote.downloadUrl)}" download>صبّ الملف</a></div>`}
      }else if(isOfficePreviewable(f)){
        const officeUrl=navigator.onLine===false?'':officeEmbedUrl(f,remote);
        if(officeUrl)mountFramedViewer(body,officeUrl,fileLabel(f),`${officeMeta(f).title} • العرض داخل قرايتي عبر Microsoft Office`);
        else officeFallback(body,f,remote);
      }else{body.innerHTML=`<div class="download-card"><div class="big-type">📄</div><p>الملف هذا يتفتح بالبرنامج المناسب على جهازك.</p><a href="${encodeURI(remote.downloadUrl)}" download>صبّ / افتح الملف</a></div>`}
      showModal('viewerModal');return;
    }
    if(remote?.previewUrl){
      link.hidden=false;link.textContent='افتح وحدو';link.href=remote.viewUrl||remote.previewUrl;
      if(isOfficePreviewable(f)){
        const officeUrl=navigator.onLine===false?'':officeEmbedUrl(f,remote);
        if(officeUrl)mountFramedViewer(body,officeUrl,fileLabel(f),`${officeMeta(f).title} • العرض داخل قرايتي عبر ${remote.provider==='google-drive'?'Google Drive':'Microsoft Office'}`);
        else officeFallback(body,f,remote);
      }else if(['doc','packet','archive','other'].includes(f.kind))body.innerHTML=`<div class="download-card"><div class="big-type">📄</div><p>الملف هذا يحتاج البرنامج المناسب على جهازك.</p><a href="${encodeURI(remote.downloadUrl||remote.viewUrl)}">صبّ الملف</a></div>`;
      else {mountFramedViewer(body,remote.previewUrl,fileLabel(f));}
    }else{
      link.hidden=true;link.removeAttribute('href');if(download)download.hidden=true;
      body.innerHTML=`<div class="drive-missing-card"><div class="big-type">📄</div><h3>الملف هذا موش جاهز للفتح توا.</h3><p>جرّب بعد شوية، وإذا بقات نفس المشكلة ابعثلنا اسم الملف على <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p></div>`;
    }
    showModal('viewerModal');
  }

  function youtubeEmbed(url){
    try{
      const u=new URL(url);
      const list=u.searchParams.get('list');
      if(u.pathname==='/playlist' && list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}&rel=0`;
      let id=u.searchParams.get('v');
      if(!id && (u.hostname==='youtu.be'||u.hostname==='www.youtu.be')) id=u.pathname.replace(/^\//,'').split('/')[0];
      if(id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`;
      if(list) return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}&rel=0`;
    }catch{}
    return '';
  }

  function openVideo(subjectId,index){
    const v=(subjectVideos(subjectId)||[])[Number(index)]; if(!v)return;
    const embed=youtubeEmbed(v.url); if(!embed)return;
    document.getElementById('videoTitle').textContent=v.title;
    const badge=document.getElementById('videoSourceBadge'); if(badge)badge.textContent=v.source||'YouTube';
    const desc=document.getElementById('videoDesc'); if(desc)desc.textContent='الفيديو يتعرض من YouTube داخل قرايتي.';
    document.getElementById('videoFrame').src=embed;
    showModal('videoModal');
  }

  function globalSearch(q){
    const box=document.getElementById('searchResults'); q=q.trim().toLowerCase();
    if(!q){box.innerHTML='<div class="search-hint">اكتب اسم مادة ولا ملف.</div>';return}
    const res=[];
    for(const f of D.files){
      if(!f._qraytiSearchKey)f._qraytiSearchKey=(fileLabel(f)+' '+f.name+' '+f.subjectName+' '+f.group+' '+(f.groupTitle||'')+' '+(f.topic||'')+' '+f.sourcePath+' '+sourcePlain(f)).toLowerCase();
      if(f._qraytiSearchKey.includes(q)){res.push(f);if(res.length===60)break}
    }
    box.innerHTML=res.length?res.map(f=>`<button class="result-item" data-file="${f.id}"><span><b>${esc(fileLabel(f))}</b><small>${esc(f.subjectName)} • ${esc(f.group)}${f.sourceUniversity?' • '+esc(f.sourceUniversity):''}</small></span></button>`).join(''):'<div class="search-hint">ما لقينا حتى نتيجة.</div>';
  }

  function theme(init=false){
    const root=document.documentElement;
    let t=root.dataset.theme||localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    if(!init)t=t==='dark'?'light':'dark';
    if(!init&&root.classList.contains('qrayti-mobile')){
      root.classList.remove('qrayti-theme-settle');
      root.classList.add('qrayti-theme-changing');
    }
    root.dataset.theme=t;
    try{localStorage.setItem('theme',t)}catch{}
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=t==='dark'?'#090d17':'#f2f8ff';
    if(!init&&root.classList.contains('qrayti-mobile')){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        root.classList.remove('qrayti-theme-changing');
        root.classList.add('qrayti-theme-settle');
        setTimeout(()=>root.classList.remove('qrayti-theme-settle'),220);
      }));
    }
  }
  theme(true);

  // Subtle desktop spotlight: follows the pointer without changing layout.
  if(matchMedia('(pointer:fine)').matches){
    let raf=0, px=50, py=36;
    addEventListener('pointermove',e=>{
      px=(e.clientX/innerWidth)*100; py=(e.clientY/innerHeight)*100;
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        document.documentElement.style.setProperty('--mx',px.toFixed(2)+'%');
        document.documentElement.style.setProperty('--my',py.toFixed(2)+'%');
        raf=0;
      });
    },{passive:true});
  }

  const dataRoutes=new Set(['/subjects','/subject','/average','/language-check','/groups','/tp-teacher','/videos','/files']);
  function prefetchDatasetFromPath(path){
    if(!path)return;
    const [p,query='']=String(path).split('?');
    if(!dataRoutes.has(p))return;
    const q=Object.fromEntries(new URLSearchParams(query));
    loadDataset(datasetKey(q)).catch(()=>{});
  }
  document.addEventListener('pointerdown',e=>{
    const nav=e.target.closest?.('[data-go]');
    if(nav)prefetchDatasetFromPath(nav.dataset.go);
  },{passive:true});
  let routeRun=0;
  async function route(){
    const run=++routeRun;
    const r=parseRoute();
    const needsData=dataRoutes.has(r.path);
    document.getElementById('searchBtn').style.display=['/subjects','/subject','/groups','/tp-teacher','/files','/videos'].includes(r.path)?'grid':'none';
    document.getElementById('averageBtn').style.display=['/semester','/subjects','/subject','/groups','/tp-teacher','/files','/videos','/average'].includes(r.path)?'grid':'none';
    if(needsData){
      document.documentElement.classList.add('qrayti-data-loading');
      const loadingTimer=setTimeout(()=>{
        if(run===routeRun&&!app.firstElementChild)app.innerHTML='<section class="screen"><div class="data-loading-card"><span></span><b>نحضّرلك المواد…</b><small>لحظة ونكمّلو</small></div></section>';
      },140);
      try{
        const next=await datasetFor(r.q);
        clearTimeout(loadingTimer);
        if(run!==routeRun)return;
        D=next||EMPTY_DATA;
      }catch(err){
        clearTimeout(loadingTimer);
        if(run!==routeRun)return;
        document.documentElement.classList.remove('qrayti-data-loading');
        screen(`${flowHead('/semester?'+contextQuery(r.q),'المحتوى')}<div class="load-error-card"><span>📶</span><h2>ما نجّمتش نحمّل المواد.</h2><p>ثبت الانترنت وعاود جرّب. كان قريتهم قبل، جرّب تعاود تفتح الصفحة.</p><button class="primary-cta" id="retryDatasetBtn">عاود جرّب</button></div>`);
        return;
      }finally{if(run===routeRun)document.documentElement.classList.remove('qrayti-data-loading')}
    }
    if(r.path==='/welcome')welcome();
    else if(r.path==='/licence')licence();
    else if(r.path==='/year')year(r.q);
    else if(r.path==='/track')track(r.q);
    else if(r.path==='/semester')semester(r.q);
    else if(r.path==='/subjects')subjects(r.q);
    else if(r.path==='/subject')subject(r.q);
    else if(r.path==='/average')average(r.q);
    else if(r.path==='/language-check')languageCheck(r.q);
    else if(r.path==='/groups')groups(r.q);
    else if(r.path==='/tp-teacher')tpTeacher(r.q);
    else if(r.path==='/videos')videos(r.q);
    else if(r.path==='/files')files(r.q);
    else welcome();
    syncStudyOwl(r.path);
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#retryDatasetBtn')){datasetPromises.delete(datasetKey(parseRoute().q));route();return}
    const nav=e.target.closest('[data-go]'); if(nav){go(nav.dataset.go);return}
    const dl=e.target.closest('[data-download-file]');if(dl){downloadFile(dl.dataset.downloadFile);return}
    const f=e.target.closest('[data-file]'); if(f){openFile(f.dataset.file);return}
    const v=e.target.closest('[data-video-subject]'); if(v){openVideo(v.dataset.videoSubject,v.dataset.videoIndex);return}
    const c=e.target.closest('[data-close]'); if(c){hideModal(c.dataset.close+'Modal');return}
    if(e.target.closest('#searchBtn')){showModal('searchModal');setTimeout(()=>document.getElementById('globalSearch').focus(),50);return}
    if(e.target.closest('#averageBtn')){const r=parseRoute();go(averagePath(r.q));return}
    const langAnswer=e.target.closest('[data-lang-answer]');if(langAnswer){answerLanguageQuestion(langAnswer.dataset.langAnswer);return}
    if(e.target.closest('#langRetryBtn')){restartLanguageQuiz();return}
    const themeButton=e.target.closest('#themeBtn'); if(themeButton){theme();return}
    if(e.target.closest('#installBtn')||e.target.closest('#installConfirmBtn')){installQrayti();return}
    if(e.target.closest('#iosInstallCard')){installIosQrayti();return}
    const owlChoice=e.target.closest('[data-owl-choice]');if(owlChoice){answerStudyOwl(owlChoice.dataset.owlChoice);return}
    if(e.target.closest('[data-owl-close]')){removeStudyOwl(true);return}
    if(e.target.closest('#faqBtn')||e.target.closest('#faqTopBtn')){showModal('faqModal');return}
    if(e.target.closest('#aboutBtn')){showModal('aboutModal');return}
  });
  let globalSearchTimer=0;
  document.getElementById('globalSearch').addEventListener('input',e=>{const value=e.target.value;clearTimeout(globalSearchTimer);globalSearchTimer=setTimeout(()=>globalSearch(value),100)});
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();showModal('searchModal');document.getElementById('globalSearch').focus()}
    if(e.key==='Escape')['searchModal','viewerModal','videoModal','aboutModal','faqModal','installModal'].forEach(hideModal);
  });
  if(!window.QraytiPlatform?.isNative && 'serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
    addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
  window.addEventListener('hashchange',route);
  route();
})();
