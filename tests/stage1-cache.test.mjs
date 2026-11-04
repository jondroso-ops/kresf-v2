import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync('sw.js','utf8');
const existing=new Set([
  'kresf-shell-v1',
  'kresf-v3-shell-2',
  'kresf-v3-deps-2',
  'another-app-cache'
]);
const removed=[];
const callbacks={};
const sandbox={
  self:{addEventListener:(type,callback)=>{callbacks[type]=callback;},skipWaiting:()=>Promise.resolve(),clients:{claim:()=>Promise.resolve()}},
  caches:{
    keys:async()=>Array.from(existing),
    delete:async name=>{removed.push(name);existing.delete(name);return true;}
  },
  URL,Response,fetch:async()=>{throw Error('No network in this test')}
};
vm.runInNewContext(src,sandbox);
assert.equal(typeof callbacks.activate,'function');
let active=null;
callbacks.activate({waitUntil:p=>{active=p;}});
await active;
assert.deepEqual(removed,['kresf-shell-v1']);
assert.ok(existing.has('kresf-v3-shell-2'));
assert.ok(existing.has('kresf-v3-deps-2'));
assert.ok(existing.has('another-app-cache'));
console.log('PASS legacy root worker leaves the newer PWA and unrelated caches intact');
