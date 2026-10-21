(()=>{
  const root=document.documentElement;
  const app=document.getElementById('app');
  const mobileQuery=matchMedia('(max-width: 820px), (pointer: coarse)');
  const syncMobileClass=()=>root.classList.toggle('qrayti-mobile',mobileQuery.matches);
  syncMobileClass();
  mobileQuery.addEventListener?.('change',syncMobileClass);

  // Keep a stable viewport measurement on Android browsers while the address bar opens/closes.
  const syncViewport=()=>{
    const h=(window.visualViewport?.height||window.innerHeight||0);
    if(h)root.style.setProperty('--qrayti-vh',`${h}px`);
  };
  syncViewport();
  window.visualViewport?.addEventListener('resize',syncViewport,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(syncViewport,80),{passive:true});

  // Only pause decorative animation while it is genuinely off-screen. Nothing visible is removed.
  let observer=null;
  if('IntersectionObserver' in window){
    observer=new IntersectionObserver(entries=>{
      for(const e of entries)e.target.classList.toggle('qrayti-offscreen',!e.isIntersecting);
    },{rootMargin:'180px 0px 180px 0px',threshold:0});
  }
  const watchAnimations=()=>{
    if(!observer)return;
    observer.disconnect();
    document.querySelectorAll('.campus-marquee-track,.licence-motion,.language-orb').forEach(el=>observer.observe(el));
  };

  // Android/RTL can preserve a stale horizontal offset after a large transformed element disappears.
  // v20 clips horizontal overflow, and this normalizes the logical position after every route render.
  const normalizeScroll=()=>{
    requestAnimationFrame(()=>{
      const se=document.scrollingElement;
      if(se&&se.scrollLeft!==0)se.scrollLeft=0;
      syncViewport();
      watchAnimations();
    });
  };
  app?.addEventListener('qrayti:screen-rendered',normalizeScroll);

  document.addEventListener('visibilitychange',()=>{
    root.classList.toggle('qrayti-page-hidden',document.hidden);
  });

  // On a phone the FAQ mascot should not sit on top of what the student is actively
  // scrolling or typing. It slips away briefly, then comes back by itself.
  let scrollIdle=0;
  addEventListener('scroll',()=>{
    if(!root.classList.contains('qrayti-mobile'))return;
    root.classList.add('qrayti-scrolling');
    clearTimeout(scrollIdle);
    scrollIdle=setTimeout(()=>root.classList.remove('qrayti-scrolling'),700);
  },{passive:true});
  const isFormControl=el=>el?.matches?.('input,select,textarea,[contenteditable="true"]');
  document.addEventListener('focus',e=>{if(isFormControl(e.target))root.classList.add('qrayti-form-focus')},true);
  document.addEventListener('blur',()=>setTimeout(()=>{
    if(!isFormControl(document.activeElement))root.classList.remove('qrayti-form-focus');
  },0),true);

  // Enable visual transitions only after the first stable paint, preventing theme-flash repaints at startup.
  requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('qrayti-ready')));
  addEventListener('load',watchAnimations,{once:true});
})();
