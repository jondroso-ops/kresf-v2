import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Isolated service-worker tests. No network or real browser storage is used.
const script=fs.readFileSync('app/sw.js','utf8');
async function check(fetchImpl,{mode='navigate'}={}){
  const handlers={};
  const cached={status:200,ok:true,tag:'offline cached app'};
  const cache={match:async()=>cached,put:async()=>undefined};
  const ctx={
    self:{
      location:{href:'https://example.test/app/sw.js',origin:'https://example.test'},
      addEventListener:(name,handler)=>{handlers[name]=handler;},
      skipWaiting:()=>Promise.resolve(),
      clients:{claim:()=>Promise.resolve()}
    },
    caches:{open:async()=>cache},
    fetch:fetchImpl,
    Request:class Request{},
    Response:{error:()=>({status:0})},
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    console
  };
  vm.runInNewContext(script,ctx);
  let responsePromise=null;
  handlers.fetch({
    request:{url:'https://example.test/app/index.html',method:'GET',mode},
    respondWith:(p)=>{responsePromise=p;},
    waitUntil:(p)=>Promise.resolve(p)
  });
  assert.ok(responsePromise,'worker should handle same-origin request');
  return {result:await responsePromise,cached};
}
for(const status of [500,502,503,504]){
  const {result,cached}=await check(async()=>({status,ok:false}));
  assert.equal(result,cached,'HTTP '+status+' must fall back to cached shell');
}
console.log('PASS navigation HTTP 5xx responses use cached PWA');
{
  const {result,cached}=await check(async()=>{throw Error('No connection');});
  assert.equal(result,cached);
}
console.log('PASS offline network errors use cached PWA');
{
  const live={status:200,ok:true,clone(){return this;}};
  const {result}=await check(async()=>live);
  assert.equal(result,live);
}
console.log('PASS healthy navigation uses fresh network response');
{
  const unavailable={status:503,ok:false};
  const {result}=await check(async()=>unavailable,{mode:'no-cors'});
  assert.equal(result,unavailable,'non-navigation HTTP responses must not be silently replaced');
}
console.log('PASS non-navigation server errors remain visible');
