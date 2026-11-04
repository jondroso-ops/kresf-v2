import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const website = fs.readFileSync('index.html','utf8');
const app = fs.readFileSync('app/index.html','utf8');
const manifest = JSON.parse(fs.readFileSync('app/manifest.webmanifest','utf8'));
const sw = fs.readFileSync('app/sw.js','utf8');

function check(label, fn) { fn(); console.log('PASS '+label); }
function scripts(html) {
  return [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(m=>m[1]).filter(code=>code.trim());
}
check('website and app inline JavaScript parse', () => {
  [...scripts(website),...scripts(app)].forEach(code=>new vm.Script(code));
});
check('service worker JavaScript parses',()=>new vm.Script(sw));
check('correct separate site and app paths',()=>{
  assert.match(website,/href="\.\/app\/"/);
  assert.match(app,/COMPANION_URL = 'https:\/\/jondroso-ops\.github\.io\/kresf-v2\/'/);
});
check('manifest scoped to PWA',()=>{
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.start_url,'./index.html');
  assert.equal(manifest.display,'standalone');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
});
check('GPS requires explicit opt in',()=>{
  assert.match(app,/onclick="startGPS\(\)"/);
  assert.match(app,/function startGPS\(\)/);
  assert.match(app,/navigator\.geolocation\.watchPosition/);
  assert.ok(app.indexOf('function startGPS()') < app.indexOf('navigator.geolocation.watchPosition'));
});
check('demo warning labels protect against real-world claims',()=>{
  assert.doesNotMatch(app,/Safe Buffer Zone|LIVE GPS|HIGH RISK ZONE/);
  assert.match(app,/not a live warning/);
  assert.match(website,/no live wildlife tracking/);
});
check('core educational features remain',()=>{
  ['view-map','view-report','view-lab','view-profile','rep-photo','badge-grid','kresf-crossing'].forEach(id=>assert.ok(app.includes(id),id));
});
check('classroom demonstration works without a GPS fix',()=>{ 
  assert.match(app,/id="rep-demo" checked/);
  assert.match(app,/const demo = document\.getElementById\('rep-demo'\)\.checked/);
  assert.match(app,/Classroom demo — no location/);
});
check('simulator resets after pause even with no GPS',()=>{
  assert.match(app,/simStep = 0;/);
  assert.match(app,/currentLat = activeTarget\.lat - 0\.015/);
});
check('network and CDN failures do not hide the QR link',()=> {
  assert.match(app,/id="network-badge"/);
  assert.match(app,/window\.addEventListener\("offline", refreshNetworkBadge\)/);
  assert.match(app,/if \(window\.tailwind\) tailwind\.config/);
  assert.match(app,/Open link \(QR unavailable offline\)/);
});
check('offline cache avoids map tiles',()=>{
  assert.match(sw,/kresf-v3-shell/);
  assert.match(sw,/THIRD_PARTY/);
  assert.match(sw,/if\(!own&&!allowed\.has\(url\.host\)\)return/);
});
check('level hero and interactive Habitat Lab controls',()=>{
  assert.match(website,/\.hero-art[^}]*transform:none/);
  assert.match(app,/id="habitat-start"/);
  assert.match(app,/function startHabitatStory\(\)/);
  assert.match(app,/function showHabitatCelebration\(\)/);
  assert.match(app,/habitatResetTimer = setTimeout\(resetHabitatStory, 5000\)/);
});
check('audio limited to user-started 300m demonstration',()=>{
  assert.match(app,/const dangerRadius = \(\) => 300/);
  assert.match(app,/function updateZoneAudio\(distanceMetres\)/);
  assert.match(app,/if \(!isSimulating\) return/);
  assert.match(app,/zoneBeepTimer = setInterval/);
  assert.match(app,/10000\)/);
});
check('private photo storage and owner approval requirements',()=>{
  assert.match(app,/indexedDB\.open\(PHOTO_DB_NAME, 1\)/);
  assert.match(app,/await saveLocalPhoto\(id,file\)/);
  assert.match(app,/function addPhotoControls\(row, record\)/);
  assert.match(app,/Save photo to phone/);
  assert.match(app,/Remove saved photo/);
  assert.ok(fs.readFileSync('.github/CODEOWNERS','utf8').includes('* @jondroso-ops'));
});
console.log('All KRESF static smoke checks passed. Browser/device validation remains necessary.');
