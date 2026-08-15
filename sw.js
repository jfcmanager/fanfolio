const CACHE_NAME='fanfolio-v0.26.3';
const APP_SHELL=[
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys.filter(key=>key.startsWith('fanfolio-') && key!==CACHE_NAME)
            .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const request=event.request;
  const isNavigation=request.mode==='navigate' || request.destination==='document';

  if(isNavigation){
    event.respondWith(
      fetch(request,{cache:'no-store'})
        .then(response=>{
          if(!response || !response.ok) throw new Error('navigation fetch failed');
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>{
            cache.put(request,copy.clone()).catch(()=>{});
            cache.put('./index.html',copy).catch(()=>{});
          });
          return response;
        })
        .catch(async()=>{
          const exact=await caches.match(request);
          if(exact) return exact;
          const fallback=await caches.match('./index.html');
          if(fallback) return fallback;
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>FanFolio</title><body>FanFolioを読み込めませんでした。オンライン接続後に再読み込みしてください。</body>',
            {headers:{'Content-Type':'text/html; charset=utf-8'}}
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>{
      if(cached) return cached;
      return fetch(request).then(response=>{
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(request,copy).catch(()=>{}));
        }
        return response;
      });
    })
  );
});
