import fs from 'node:fs';
import assert from 'node:assert/strict';

const site=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app/index.html','utf8');
const worker=fs.readFileSync('app/sw.js','utf8');
const workflow=fs.readFileSync('.github/workflows/kresf-smoke.yml','utf8');
const manifest=JSON.parse(fs.readFileSync('app/manifest.webmanifest','utf8'));
const pass=(name,fn)=>{fn();console.log('PASS '+name);};

pass('static app does not submit or transmit observation data',()=>{
  assert.doesNotMatch(app,/<form\b[^>]*action\s*=/i);
  assert.doesNotMatch(app,/\b(?:XMLHttpRequest|sendBeacon|WebSocket)\s*\(/);
  assert.match(app,/localStorage/);
  assert.match(app,/Classroom demo — no location/);
});
pass('no obvious embedded credentials or code evaluation',()=>{
  for(const content of [site,app,worker]){
    assert.doesNotMatch(content,/\b(?:eval|new Function)\s*\(/);
    assert.doesNotMatch(content,/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/);
  }
});
pass('app service worker never caches map tile traffic',()=>{
  assert.match(worker,/if\(!own&&!allowed\.has\(url\.host\)\)return/);
  assert.doesNotMatch(worker,/tile\.openstreetmap\.org.*THIRD_PARTY/);
});
pass('GitHub actions operate with read-only repository token',()=>{
  assert.match(workflow,/permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(workflow,/pull_request_target|workflow_run:/);
});
pass('PWA cannot take over companion URL path',()=>{
  assert.equal(manifest.scope,'./');
  assert.match(app,/navigator\.serviceWorker\.register\('sw\.js'\)/);
});
pass('known external script origins are explicit',()=>{
  const allowed=new Set(['cdn.tailwindcss.com','unpkg.com','cdn.jsdelivr.net']);
  for(const html of [site,app]){
    for(const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)){
      const url=new URL(m[1], 'https://example.test');
      assert.ok(url.origin==='https://example.test'||(url.protocol==='https:'&&allowed.has(url.hostname)),url.href);
    }
  }
});
console.log('KRESF static security checks complete; GitHub settings and dependency integrity remain separate review gates.');
