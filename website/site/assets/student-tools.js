(()=>{
  const gradeFormulas={
    mixte:{group:'core',label:'Mixte — TP 10% + DS 20% + Examen 70%',weights:{tp:.10,ds:.20,exam:.70}},
    controle_continue:{group:'core',label:'Contrôle continu — TP 20% + DS 40% + Examen 40%',weights:{tp:.20,ds:.40,exam:.40}},
    tp30_ds70:{group:'core',label:'TP 30% + DS 70%',weights:{tp:.30,ds:.70,exam:0}},
    quarter_exam2:{group:'core',label:'(TP + DS + Examen × 2) ÷ 4',weights:{tp:.25,ds:.25,exam:.50}},
    tp_ds_half:{group:'core',label:'(TP + DS) ÷ 2',weights:{tp:.50,ds:.50,exam:0}},
    prep_35_65:{group:'prepa',label:'TP 35% + DS 65%',weights:{tp:.35,ds:.65,exam:0}},
    prep_15_25_60:{group:'prepa',label:'TP 15% + DS 25% + Examen 60%',weights:{tp:.15,ds:.25,exam:.60}},
    prep_15_35_50:{group:'prepa',label:'TP 15% + DS 35% + Examen 50%',weights:{tp:.15,ds:.35,exam:.50}},
    prep_35_25_40:{group:'prepa',label:'TP 35% + DS 25% + Examen 40%',weights:{tp:.35,ds:.25,exam:.40}},
    other_10_10_80:{group:'other',label:'TP 10% + DS 10% + Examen 80%',weights:{tp:.10,ds:.10,exam:.80}}
  };

  const languageBanks={
    en:[
      {level:'A1',q:'I ___ a university student.',options:['am','is','are','be'],answer:0},
      {level:'A1',q:'She ___ from Tunisia.',options:['am','are','is','be'],answer:2},
      {level:'A1',q:'What does “library” mean?',options:['مخبر','مكتبة','مطعم','مدرّج'],answer:1},
      {level:'A2',q:'Yesterday, I ___ to university early.',options:['go','went','gone','going'],answer:1},
      {level:'A2',q:'How often ___ you study English?',options:['are','do','does','did'],answer:1},
      {level:'A2',q:'I have lived here ___ 2024.',options:['for','since','from','during'],answer:1},
      {level:'B1',q:'If I ___ more time, I would read more.',options:['have','had','will have','having'],answer:1},
      {level:'B1',q:'I’m used to ___ early for class.',options:['wake','waking','woke','to wake'],answer:1},
      {level:'B1',q:'He told me that he ___ tired.',options:['is','was','has','be'],answer:1},
      {level:'B2',q:'Despite ___ tired, she finished the project.',options:['be','being','was','to be'],answer:1},
      {level:'B2',q:'If I had studied more, I ___ the exam.',options:['pass','would pass','would have passed','passed'],answer:2},
      {level:'B2',q:'The report ___ before the meeting started.',options:['completed','had been completed','has completing','was complete it'],answer:1},
      {level:'C1',q:'No sooner ___ than the presentation began.',options:['we arrived','had we arrived','we had arrive','did we arrived'],answer:1},
      {level:'C1',q:'Had I known about the change, I ___ earlier.',options:['would come','came','would have come','had come'],answer:2},
      {level:'C1',q:'Choose the closest meaning of “nevertheless”.',options:['because','however','therefore','meanwhile'],answer:1}
    ],
    fr:[
      {level:'A1',q:'Je ___ étudiant à l’université.',options:['suis','es','est','sommes'],answer:0},
      {level:'A1',q:'Nous ___ en Tunisie.',options:['habite','habitez','habitons','habites'],answer:2},
      {level:'A1',q:'Que veut dire « bibliothèque » ?',options:['مكتبة','مخبر','مطعم','إدارة'],answer:0},
      {level:'A2',q:'Hier, je ___ à la fac tôt.',options:['vais','suis allé','aller','irai'],answer:1},
      {level:'A2',q:'Je vais à l’université ___ bus.',options:['à','en','de','sur'],answer:1},
      {level:'A2',q:'J’apprends le français ___ deux ans.',options:['depuis','pendant','dans','à'],answer:0},
      {level:'B1',q:'Si j’___ plus de temps, je lirais davantage.',options:['ai','avais','aurai','avoir'],answer:1},
      {level:'B1',q:'Quand je suis arrivé, le cours ___ déjà commencé.',options:['a','avait','est','sera'],answer:1},
      {level:'B1',q:'Il m’a dit qu’il ___ fatigué.',options:['est','était','sera','soit'],answer:1},
      {level:'B2',q:'Bien qu’il ___ fatigué, il a continué.',options:['est','était','soit','sera'],answer:2},
      {level:'B2',q:'Si j’avais mieux révisé, j’___ réussi.',options:['aurais','aurais eu','aurais réussi','réussirai'],answer:2},
      {level:'B2',q:'C’est le livre ___ je t’ai parlé.',options:['que','qui','dont','où'],answer:2},
      {level:'C1',q:'À peine ___ arrivé que le cours a commencé.',options:['il était','était-il','il est','sera-t-il'],answer:1},
      {level:'C1',q:'Quoi qu’il en ___, on terminera le travail.',options:['est','soit','sera','était'],answer:1},
      {level:'C1',q:'« Néanmoins » veut dire presque la même chose que…',options:['pourtant','donc','parce que','ensuite'],answer:0}
    ]
  };

  const languageAdvice={
    en:{
      A1:{title:'البداية موجودة، يلزمها شوية خدمة 💪',text:'ركّز على الجمل اليومية والكلمات الأساسية. 15 دقيقة كل نهار خير من ساعة مرّة في الأسبوع.',tips:['احفظ 8–10 كلمات في النهار واستعمل كل كلمة في جملة.','اسمع فيديو قصير بالإنجليزي مع Subtitle إنجليزي.','احكي بصوت عالي حتى كان وحدك: عرّف بروحك، نهارك، وقرايتك.']},
      A2:{title:'عندك قاعدة باهية، توا نوسّعوها 👌',text:'تفهم الأساسيات، أما يلزمك تزيد Vocabulary وتولي أسرع في تكوين الجمل.',tips:['اكتب 5 جمل على نهارك كل يوم.','راجع Past / Present / Future واستعملهم في أمثلة من حياتك.','شوف محتوى ساهل وحاول تفهم المعنى قبل الترجمة.']},
      B1:{title:'مستواك يخليك تتصرّف، يلزمك تثبيت أكثر 🚀',text:'تنجم تفهم وتحكي في برشة مواقف. أكبر نقلة توا تجي من القراءة والسماع المنتظم.',tips:['اقرا مقالات قصيرة في مجال تحبّه ودوّن الكلمات المتكرّرة.','اسمع 10–15 دقيقة من غير ترجمة، وبعدها عاود مع Subtitle.','مرّتين في الأسبوع اكتب فقرة 100 كلمة وراجع أخطاءك.']},
      B2:{title:'مستوى قوي للدراسة، نلمّعو التفاصيل 🔥',text:'غالبًا تنجم تتبع كور ومحتوى تقني بالإنجليزي. خدم أكثر على الدقّة والتعبير الطبيعي.',tips:['بدّل جزء كبير من مصادر قرايتك للإنجليزي.','ركّز على collocations والتعابير موش كلمات منفصلة برك.','سجّل روحك دقيقتين تفسّر موضوع تقني وعاود اسمع أخطاءك.']},
      C1:{title:'ممتاز، الإنجليزي موش هو اللي باش يوقفك 👏',text:'عندك مستوى متقدّم تقريبًا. توا الهدف هو السرعة، الدقّة، والأسلوب الأكاديمي.',tips:['اقرا Documentation ومقالات طويلة من غير ترجمة.','درّب روحك على presentations وكتابة تقارير أكاديمية.','ركّز على nuances والتعابير الطبيعية باش كلامك يولي أخف.']}
    },
    fr:{
      A1:{title:'ما تقلقش، البداية تتبنى حبة حبة 💪',text:'ركّز على الجمل اللي تستعملهم في القراية والحياة اليومية قبل القواعد الثقيلة.',tips:['احفظ 8–10 كلمات فرنسية في النهار مع جملة لكل كلمة.','راجع être / avoir / aller والأفعال الأكثر استعمال.','اسمع دقيقة ولا دقيقتين وعاود الجمل بصوت عالي.']},
      A2:{title:'عندك الأساس، يلزمنا نخلّيوه يتحرّك 👌',text:'تفهم جمل بسيطة، أما يلزمك أكثر ممارسة باش ما تبقاش تترجم كل كلمة في مخّك.',tips:['اكتب 5 جمل على نهارك بالفرنسية كل يوم.','راجع passé composé وfutur proche مع أمثلة من حياتك.','شوف فيديوهات قصيرة بSous-titres فرنسية موش عربية.']},
      B1:{title:'باهي برشة، توا نركّزو على الطلاقة 🚀',text:'تنجم تتصرّف في برشة مواقف وتفهم جزء كبير من الدروس. يلزمك تزيد قراءة وسماع.',tips:['اقرا نصوص جامعية قصيرة ودوّن الكلمات اللي تتعاود.','حاول تلخّص درس في 5 جمل بالفرنسية.','اسمع 10 دقايق يوميًا وحاول ما توقفش على كل كلمة.']},
      B2:{title:'مستوى مريح للدراسة، باقي الصقل 🔥',text:'تنجم غالبًا تتبع درس وتكتب بشكل واضح. خدم على الدقّة والتعابير الأكاديمية.',tips:['استعمل الفرنسية في ملخّصاتك وملاحظاتك الدراسية.','ركّز على connecteurs: pourtant, cependant, en revanche…','سجّل روحك تفسّر موضوع دقيقتين وراجع النطق والتردّد.']},
      C1:{title:'قوي برشة، توا التفاصيل هي الفرق 👏',text:'مستواك متقدّم تقريبًا. ركّز على الأسلوب الأكاديمي، المفردات الدقيقة والسرعة.',tips:['اقرا مقالات وتقارير كاملة بالفرنسية.','درّب على rédaction وprésentation أكاديمية.','بدّل بين أساليب رسمية وعادية باش تولّي مرن في التعبير.']}
    }
  };

  window.QraytiStudentTools={gradeFormulas,languageBanks,languageAdvice};
})();
