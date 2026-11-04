// KRESF v3 educational prototype. Offline tiles are not stored.
// Versioned caches. External dependencies are cached only on successful fetch.
const SHELL='kresf-v3-shell-3';
const DEPS='kresf-v3-deps-3';
const CORE=['./','./index.html','./manifest.webmanifest','./vendor/qrcode.js','../icon-192.png','../icon-512.png'];
const THIRD_PARTY=[
  ['https://cdn.tailwindcss.com/','no-cors'],
  ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','cors'],
  ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','cors']
  // QR code generator is now an app-local, pre-cached, reviewed script.
];
const allowed=new Set(THIRD_PARTY.map(([url])=>new URL(url).host));
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const core=await caches.open(SHELL);
    await core.addAll(CORE); // fail closed if local shell cannot be cached
    const deps=await caches.open(DEPS);
    await Promise.allSettled(THIRD_PARTY.map(async ([url,mode])=>{
      const req=new Request(url,{mode,credentials:'omit'});
      const res=await fetch(req);
      if (res.ok||res.type==='opaque') await deps.put(req,res.clone());
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('kresf-v3-')&&!([SHELL,DEPS].includes(k))).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  const own=url.origin===self.location.origin;
  // Map tiles are online-only. Limit 3rd-party caching to vetted script/style CDNs.
  if(!own&&!allowed.has(url.host))return;
  if(!own){
    event.respondWith((async()=>{
      const cache=await caches.open(DEPS);
      const hit=await cache.match(req,{ignoreSearch:false});
      if(hit)return hit;
      try{
        const res=await fetch(req);
        if(res.ok||res.type==='opaque')event.waitUntil(cache.put(req,res.clone()));
        return res;
      }catch(error){return Response.error();}
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(SHELL);
    try{
      const fresh=await fetch(req);
      if(fresh.ok && url.pathname.startsWith(new URL('./',self.location.href).pathname)){
        event.waitUntil(cache.put(req,fresh.clone()));
      }
      return fresh;
    }catch(e){
      return await cache.match(req) || (req.mode==='navigate' ? await cache.match('./index.html') : Response.error());
    }
  })());
});
