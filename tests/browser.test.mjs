import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base=process.env.KRESF_BASE_URL || 'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try {
  // Block all CDN assets deliberately. The educational modules must remain usable.
  await page.route(/(cdn\.tailwindcss\.com|unpkg\.com|cdn\.jsdelivr\.net)/,route=>route.abort());
  await page.goto(base,{waitUntil:'domcontentloaded'});
  assert.match(await page.locator('h1').innerText(),/A safer road/);
  assert.equal(await page.locator('a[href="./app/"]').count()>0,true);
  console.log('PASS companion site opens on a mobile viewport');

  await page.goto(new URL('app/',base).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => document.querySelector('#view-map')?.classList.contains('active'));
  assert.match(await page.locator('#leafletMap').innerText(),/Map requires an internet connection/);
  console.log('PASS app degrades gracefully when external map scripts are unavailable');

  await page.locator('button[onclick="toggleDriveSimulation()"]').click();
  assert.equal(await page.locator('#sim-btn-text').innerText(),'Pause');
  await page.locator('button[onclick="toggleDriveSimulation()"]').click();
  assert.equal(await page.locator('#sim-btn-text').innerText(),'Simulate');
  console.log('PASS simulator starts and stops without map or GPS');

  await page.locator('button[onclick="switchView(\'report\', this)"]').click();
  assert.equal(await page.locator('#rep-demo').isChecked(),true);
  await page.waitForFunction(()=>storageReady);
  await page.locator('button[onclick="submitReport()"]').click();
  await page.waitForFunction(()=>document.querySelector('#prof-xp')?.innerText==='50 XP');
  assert.match(await page.locator('#logs-list-container').innerText(),/Classroom demo — no location/);
  console.log('PASS classroom observation saves without GPS');

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('button[onclick="switchView(\'profile\', this)"]').click();
  assert.equal(await page.locator('#prof-xp').innerText(),'50 XP');
  console.log('PASS local classroom progress persists after reload');

  // Photo is captured in the report and persists only in IndexedDB on this device.
  await page.locator('.nav-btn').nth(1).click();
  await page.locator('#rep-photo').setInputFiles({
    name:'koala-classroom-test.png',
    mimeType:'image/png',
    buffer:Buffer.concat([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGOUqPJlYGBgYmBgYGBgAAAKaQDj+IylJQAAAABJRU5ErkJggg==', 'base64'),Buffer.from('GPS_EXIF_TEST_MARKER')])
  });
  await page.locator('#rep-photo-preview').waitFor({state:'visible',timeout:5000});
  await page.locator('button[onclick="submitReport()"]').click();
  await page.locator('button:text("⬇ Save photo to phone")').waitFor();
  const thumb=page.locator('img[alt="Saved observation photo"]');
  await thumb.waitFor();
  await page.waitForFunction(()=>document.querySelector('img[alt="Saved observation photo"]')?.getAttribute('src')?.startsWith('blob:'));
  // The original synthetic photo contains a test-only metadata marker.
  // The persisted canvas re-encode must not retain its original bytes.
  const sanitised=await page.evaluate(async()=>{
    const db=await openPhotoDb();
    const id=sightingsLog[0]?.photoId;
    return new Promise((resolve,reject)=>{
      const req=db.transaction('photos','readonly').objectStore('photos').get(id);
      req.onsuccess=async()=>{
        if(!req.result)return reject(Error('Missing sanitised photo'));
        const bytes=new Uint8Array(await req.result.arrayBuffer());
        const marker=new TextEncoder().encode('GPS_EXIF_TEST_MARKER');
        const found=bytes.some((_,i)=>marker.every((value,j)=>bytes[i+j]===value));
        resolve({mime:req.result.type,containsOriginalMarker:found});
      };
      req.onerror=()=>reject(req.error);
    });
  });
  assert.deepEqual(sanitised,{mime:'image/png',containsOriginalMarker:false});
  console.log('PASS new saved photos discard synthetic camera metadata');

  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.nav-btn').nth(3).click();
  await page.locator('button:text("⬇ Save photo to phone")').waitFor();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('button:text("⬇ Save photo to phone")').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/kresf-observation-.*\.png$/);
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('button:text("Remove saved photo")').click();
  await page.locator('button:text("Remove saved photo")').waitFor({state:'detached'});
  console.log('PASS photo saved to IndexedDB, persists after reload, downloads and can be deleted');

  // Stage 2: a saved observation can be individually deleted.
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('button:text("Delete observation")').last().click();
  await page.waitForFunction(()=>[...document.querySelectorAll('#logs-list-container button')].filter(b=>b.textContent==='Delete observation').length===1);
  console.log('PASS individual observation deletion available');
  
  // The local app shell is precached by the app-scoped service worker.
  await page.waitForFunction(() => 'serviceWorker' in navigator && !!navigator.serviceWorker.controller, {timeout:20000});
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.match(await page.locator('#network-badge').innerText(),/OFFLINE/);
  await page.locator('.nav-btn').nth(3).click();
  assert.equal(await page.locator('#prof-xp').innerText(),'100 XP');
  console.log('PASS cached PWA shell reopens offline with two saved classroom records intact');
  await page.locator('#qr-site svg').waitFor({timeout:5000});
  const cssOffline=await page.evaluate(()=>{
    const element=document.querySelector('.bg-slate-900');
    return !!element && getComputedStyle(element).backgroundColor!=='rgba(0, 0, 0, 0)';
  });
  assert.equal(cssOffline,true);
  console.log('PASS local QR and compiled Tailwind stylesheet available offline');

  await context.setOffline(false);
  // Guided Habitat Lab: choices drive visible story phases, crossing, celebration and reset.
  await page.locator('.nav-btn').nth(2).click();
  const start=page.locator('#habitat-start');
  const camera=page.locator('#habitat-camera');
  assert.equal(await start.isEnabled(),true);
  assert.match(await page.locator('#habitat-view-label').innerText(),/Perspective/);
  await camera.click();
  assert.equal(await page.locator('#habitat-scene').evaluate(el=>el.classList.contains('view-side')),true);
  assert.equal(await camera.getAttribute('aria-pressed'),'true');
  await camera.click();
  assert.equal(await page.locator('#habitat-scene').evaluate(el=>el.classList.contains('view-side')),false);
  assert.equal(await camera.getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#habitat-scene svg .habitat-far-trees').count(),1);
  console.log('PASS accessible Habitat camera toggle and layered 3D-style terrain');
  assert.equal(await page.locator('#chk-fence').isEnabled(),false);
  await start.click();
  assert.equal(await page.locator('#chk-fence').isEnabled(),true);
  await page.locator('#chk-virtual').check();
  assert.match(await page.locator('#habitat-thought').innerText(),/warning signal/i);
  await page.locator('#chk-speed').check();
  assert.match(await page.locator('#habitat-thought').innerText(),/Traffic is slower/);
  assert.equal(await page.locator('#habitat-scene').evaluate(el=>el.classList.contains('traffic-slow')),true);
  await page.locator('#chk-fence').check();
  assert.match(await page.locator('#habitat-hint').innerText(),/fauna underpass/);
  await page.locator('#chk-under').check();
  assert.match(await page.locator('#habitat-thought').innerText(),/found the underpass/i);
  assert.equal(await page.locator('#habitat-scene').evaluate(el=>el.classList.contains('is-crossing')),true);
  await page.waitForTimeout(5650);
  assert.equal(await page.locator('#habitat-celebration').isVisible(),true);
  assert.match(await page.locator('#habitat-celebration').innerText(),/Congratulations/);
  await page.waitForTimeout(5100);
  assert.equal(await page.locator('#habitat-celebration').isVisible(),false);
  assert.equal(await page.locator('#chk-fence').isChecked(),false);
  assert.equal(await start.isEnabled(),true);
  console.log('PASS interactive Habitat Lab choices, crossing, 5-second celebration and automatic reset');

  // The alert state machine must use the fixed 300m radius only in simulated mode.
  const audioStates=await page.evaluate(()=>{
    isSimulating=true;
    updateZoneAudio(301);
    const before=demoZoneInside;
    updateZoneAudio(300);
    const boundary=demoZoneInside && zoneBeepTimer!==null && insideDemoZone(300);
    updateZoneAudio(299);
    const entered=demoZoneInside;
    updateZoneAudio(301);
    const exited=!demoZoneInside && zoneBeepTimer===null;
    isSimulating=false;stopZoneAudio();
    return {before,boundary,entered,exited,radius:dangerRadius(),outside:insideDemoZone(301)};
  });
  assert.deepEqual(audioStates,{before:false,boundary:true,entered:true,exited:true,radius:300,outside:false});
  console.log('PASS simulated audio threshold and ten-second beep timer lifecycle');
  // Audio unlock is asynchronous: rejected resume must not display success.
  const rejected=await page.evaluate(async()=>{
    const original=window.AudioContext;
    class DeniedContext {
      state='suspended';
      resume(){return Promise.reject(Error('Permission denied'));}
    }
    window.AudioContext=DeniedContext;
    const previous=audioCtx;audioCtx=null;isAudioUnlocked=false;
    try{
      await initAudioEngine();
      return {unlocked:isAudioUnlocked,button:document.getElementById('btn-audio-init').className};
    }finally{window.AudioContext=original;audioCtx=previous;}
  });
  assert.equal(rejected.unlocked,false);
  assert.doesNotMatch(rejected.button,/^bg-brand-primary /);
  const accepted=await page.evaluate(async()=>{
    const original=window.AudioContext;
    class AllowedContext {
      state='suspended';
      async resume(){this.state='running';}
    }
    window.AudioContext=AllowedContext;
    const previous=audioCtx;audioCtx=null;isAudioUnlocked=false;
    try{await initAudioEngine();return isAudioUnlocked;}
    finally{window.AudioContext=original;audioCtx=previous;isAudioUnlocked=false;}
  });
  assert.equal(accepted,true);
  console.log('PASS audio resume rejection and successful unlock are reported accurately');


  assert.deepEqual(errors,[],'Unexpected uncaught browser JavaScript exceptions');
  console.log('PASS no unhandled JavaScript errors in tested flows');
  // Stage 2: GPS must be explicitly stoppable and must reject stale fixes.
  const gpsState=await page.evaluate(()=>{
    const oldGeo=Object.getOwnPropertyDescriptor(navigator,'geolocation');
    let success,fail,cleared=null;
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
      watchPosition(ok,bad){success=ok;fail=bad;return 42;},
      clearWatch(id){cleared=id;}
    }});
    try{
      startGPS();
      success({coords:{latitude:-34.2,longitude:150.7,accuracy:12},timestamp:Date.now()-60000});
      const staleRejected=!hasGPSFix && realGPS===null;
      success({coords:{latitude:-34.2,longitude:150.7,accuracy:10},timestamp:Date.now()});
      const goodAccepted=hasGPSFix;
      fail({code:1});
      const errorClears=!hasGPSFix && realGPS===null && gpsWatchId===null;
      startGPS();stopGPS();
      return {staleRejected,goodAccepted,errorClears,stopClears:!hasGPSFix&&realGPS===null&&gpsWatchId===null,cleared};
    }finally{
      if(oldGeo)Object.defineProperty(navigator,'geolocation',oldGeo);
      else delete navigator.geolocation;
    }
  });
  assert.deepEqual(gpsState,{staleRejected:true,goodAccepted:true,errorClears:true,stopClears:true,cleared:42});
  console.log('PASS GPS explicit stop and stale/error invalidation');
  // Stage 2: wipe all local observations, XP and images on explicit confirmation.
  await page.locator('.nav-btn').nth(3).click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('button:text("Delete all local observations and photos")').click();
  await page.waitForFunction(()=>document.querySelector('#prof-xp')?.innerText==='0 XP');
  assert.match(await page.locator('#logs-list-container').innerText(),/No sightings yet/);
  const emptied=await page.evaluate(async()=>{
    const db=await openPhotoDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(['observations','photos'],'readonly');
      const observations=tx.objectStore('observations').count();
      const photos=tx.objectStore('photos').count();
      tx.oncomplete=()=>resolve({observations:observations.result,photos:photos.result});
      tx.onerror=()=>reject(tx.error);
    });
  });
  assert.deepEqual(emptied,{observations:0,photos:0});
  console.log('PASS clear-all removes stored observations, photos and XP');


  // Stage 1: reject failed persistence without clearing inputs or awarding XP.
  const failureContext=await browser.newContext({viewport:{width:390,height:844}});
  const failurePage=await failureContext.newPage();
  try {
    await failurePage.route(/(cdn\\.tailwindcss\\.com|unpkg\\.com|cdn\\.jsdelivr\\.net)/,route=>route.abort());
    await failurePage.goto(new URL('app/',base).href,{waitUntil:'domcontentloaded'});
    await failurePage.waitForFunction(()=>storageReady);
    await failurePage.locator('.nav-btn').nth(1).click();
    await failurePage.locator('#rep-status').selectOption({index:1});
    const previous=await failurePage.locator('#rep-status').inputValue();
    await failurePage.evaluate(()=>{
      transactObservation=async()=>{throw new DOMException('Simulated quota exceeded','QuotaExceededError');};
    });
    await failurePage.locator('button[onclick="submitReport()"]').click();
    await failurePage.waitForFunction(()=>document.querySelector('#toast')?.innerText.includes('NOT SAVED'));
    assert.equal(await failurePage.locator('#rep-status').inputValue(),previous);
    assert.equal(await failurePage.locator('#prof-xp').innerText(),'0 XP');
    const noRecords=await failurePage.evaluate(async()=>{
      const db=await openPhotoDb();
      return new Promise((resolve,reject)=>{
        const req=db.transaction('observations','readonly').objectStore('observations').getAll();
        req.onsuccess=()=>resolve(req.result.length);
        req.onerror=()=>reject(req.error);
      });
    });
    assert.equal(noRecords,0);
    console.log('PASS failed durable commit preserves report and awards no XP');
  } finally {await failureContext.close();}

  // Stage 1: corrupted legacy JSON shape must not crash unrelated modules.
  const damagedContext=await browser.newContext();
  await damagedContext.addInitScript(()=>{
    try{
      localStorage.setItem('kresf_logs',JSON.stringify({length:1}));
      localStorage.setItem('kresf_xp',JSON.stringify({invalid:true}));
    }catch(e){}
  });
  const damagedPage=await damagedContext.newPage();
  const damagedErrors=[];
  damagedPage.on('pageerror',e=>damagedErrors.push(e.message));
  try{
    await damagedPage.route(/(cdn\\.tailwindcss\\.com|unpkg\\.com|cdn\\.jsdelivr\\.net)/,route=>route.abort());
    await damagedPage.goto(new URL('app/',base).href,{waitUntil:'domcontentloaded'});
    await damagedPage.waitForFunction(()=>storageReady);
    await damagedPage.locator('.nav-btn').nth(3).click();
    assert.equal(await damagedPage.locator('#prof-xp').innerText(),'0 XP');
    assert.match(await damagedPage.locator('#logs-list-container').innerText(),/No sightings yet/);
    await damagedPage.locator('.nav-btn').nth(2).click();
    assert.equal(await damagedPage.locator('#habitat-start').isEnabled(),true);
    assert.deepEqual(damagedErrors,[]);
    console.log('PASS malformed legacy state does not interrupt PWA modules');
    // Existing v2 records and photo bytes must survive IndexedDB v1 -> v2 upgrade.
    const upgradeContext=await browser.newContext();
    const upgradePage=await upgradeContext.newPage();
    try {
      await upgradePage.goto(base,{waitUntil:'domcontentloaded'});
      await upgradePage.evaluate(async()=>{
        localStorage.setItem('kresf_logs',JSON.stringify([{
          id:'legacy-photo-1',coords:'Classroom demo — no location',
          status:'Koala sighting',time:'04/11/2026 12:00',demo:true,photoId:'legacy-photo-1'
        }]));
        localStorage.setItem('kresf_xp',JSON.stringify(50));
        await new Promise((resolve,reject)=>{
          const req=indexedDB.open('kresf-local-photos-v1',1);
          req.onupgradeneeded=()=>req.result.createObjectStore('photos');
          req.onerror=()=>reject(req.error);
          req.onsuccess=()=>{
            const db=req.result;
            const tx=db.transaction('photos','readwrite');
            tx.objectStore('photos').put(new Blob(['old-photo'],{type:'image/png'}),'legacy-photo-1');
            tx.oncomplete=()=>{db.close();resolve();};
            tx.onerror=()=>reject(tx.error);
          };
        });
      });
      await upgradePage.route(/(cdn\\.tailwindcss\\.com|unpkg\\.com|cdn\\.jsdelivr\\.net)/,route=>route.abort());
      await upgradePage.goto(new URL('app/',base).href,{waitUntil:'domcontentloaded'});
      await upgradePage.waitForFunction(()=>storageReady);
      await upgradePage.locator('.nav-btn').nth(3).click();
      assert.equal(await upgradePage.locator('#prof-xp').innerText(),'50 XP');
      assert.match(await upgradePage.locator('#logs-list-container').innerText(),/Koala sighting/);
      assert.equal(await upgradePage.locator('button:text("⬇ Save photo to phone")').count(),1);
      const migrated=await upgradePage.evaluate(async()=>{
        const db=await openPhotoDb();
        return new Promise((resolve,reject)=>{
          const tx=db.transaction(['observations','photos'],'readonly');
          const observation=tx.objectStore('observations').get('legacy-photo-1');
          const photo=tx.objectStore('photos').get('legacy-photo-1');
          tx.oncomplete=()=>resolve({record:observation.result,photoSize:photo.result?.size});
          tx.onerror=()=>reject(tx.error);
        });
      });
      assert.equal(migrated.record.photoId,'legacy-photo-1');
      assert.equal(migrated.photoSize,9);
      console.log('PASS existing photo and observation survive v1 to v2 database migration');
    } finally {await upgradeContext.close();}

  }finally{await damagedContext.close();}

} finally {
  await browser.close();
}
