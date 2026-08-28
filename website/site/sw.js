const SHELL_CACHE='qrayti-shell-v40';
const DATA_CACHE='qrayti-data-v40';
const SHELL=[
  './','./index.html','./assets/styles.css?v=40','./assets/platform.js?v=39','./assets/catalog-layer.js?v=29','./assets/student-tools.js?v=29',
  './assets/performance.js?v=29','./assets/app.js?v=40','./assets/v30.css?v=30','./assets/v30-student.js?v=31','./manifest.webmanifest','./assets/icons/qrayti-centered-v39.png','./assets/icons/qrayti-centered-v39-512.png'
];
const DATA_RE=/\/assets\/(?:data(?:-[^/]+)?\.js)$/;

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll(SHELL)).catch(()=>{}));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>![SHELL_CACHE,DATA_CACHE].includes(k)).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;

  // Never cache admin/API traffic or course binaries in the service worker.
  // Admin responses are private and course files can be large.
  if(url.pathname.startsWith('/admin/') || url.pathname.startsWith('/api/') || url.pathname.includes('/content/') || url.pathname.startsWith('/downloads/')){
    event.respondWith(fetch(req));
    return;
  }

  // Cloud/Drive maps should never be pinned to an old service-worker version.
  if(url.pathname.includes('/remote/')){
    event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
    return;
  }

  // Semester datasets are cached only after the student actually opens them.
  // This keeps first visit light while preserving fast repeat/offline access.
  if(DATA_RE.test(url.pathname)){
    event.respondWith(
      caches.open(DATA_CACHE).then(async cache=>{
        const hit=await cache.match(req);
        if(hit)return hit;
        const resp=await fetch(req);
        if(resp.ok)cache.put(req,resp.clone());
        return resp;
      }).catch(()=>caches.match(req))
    );
    return;
  }

  // Navigation: network first, cached shell fallback. Static assets: cache first.
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(resp=>{
      const copy=resp.clone();caches.open(SHELL_CACHE).then(c=>c.put('./index.html',copy));return resp;
    }).catch(()=>caches.match('./index.html')));
    return;
  }

  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(resp=>{
    if(resp.ok){const copy=resp.clone();caches.open(SHELL_CACHE).then(c=>c.put(req,copy))}
    return resp;
  })));
});
