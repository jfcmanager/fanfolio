const VERSION='0.20.2';
const CACHE_NAME=`fanfolio-v${VERSION}`;
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon-32.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>Promise.all(APP_SHELL.map(url=>cache.add(new Request(url,{cache:'reload'}))))));
});
self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data&&event.data.type==='GET_VERSION'){const reply={type:'FANFOLIO_VERSION',version:VERSION};if(event.ports&&event.ports[0])event.ports[0].postMessage(reply);else if(event.source)event.source.postMessage(reply);}
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('fanfolio-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.searchParams.has('__fanfolio_version')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});
