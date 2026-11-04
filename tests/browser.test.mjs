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
  await page.locator('button[onclick="submitReport()"]').click();
  assert.equal(await page.locator('#prof-xp').innerText(),'50 XP');
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
    buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9G7hQAAAAASUVORK5CYII=', 'base64')
  });
  await page.locator('#rep-photo-preview').waitFor({state:'visible',timeout:5000});
  await page.locator('button[onclick="submitReport()"]').click();
  await page.locator('button:text("⬇ Save photo to phone")').waitFor();
  const thumb=page.locator('img[alt="Saved observation photo"]');
  await thumb.waitFor();
  await page.waitForFunction(()=>document.querySelector('img[alt="Saved observation photo"]')?.getAttribute('src')?.startsWith('blob:'));
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

  // The local app shell is precached by the app-scoped service worker.
  await page.waitForFunction(() => 'serviceWorker' in navigator && !!navigator.serviceWorker.controller, {timeout:20000});
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.match(await page.locator('#network-badge').innerText(),/OFFLINE/);
  await page.locator('.nav-btn').nth(3).click();
  assert.equal(await page.locator('#prof-xp').innerText(),'100 XP');
  console.log('PASS cached PWA shell reopens offline with two saved classroom records intact');
  await context.setOffline(false);
  // Guided Habitat Lab: choices drive visible story phases, crossing, celebration and reset.
  await page.locator('.nav-btn').nth(2).click();
  const start=page.locator('#habitat-start');
  assert.equal(await start.isEnabled(),true);
  assert.equal(await page.locator('#chk-fence').isEnabled(),false);
  await start.click();
  assert.equal(await page.locator('#chk-fence').isEnabled(),true);
  await page.locator('#chk-virtual').check();
  assert.match(await page.locator('#habitat-thought').innerText(),/warning signal/i);
  await page.locator('#chk-speed').check();
  assert.match(await page.locator('#habitat-thought').innerText(),/Traffic is slower/);
  await page.locator('#chk-fence').check();
  assert.match(await page.locator('#habitat-hint').innerText(),/fauna underpass/);
  await page.locator('#chk-under').check();
  assert.match(await page.locator('#habitat-thought').innerText(),/found the underpass/i);
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
    updateZoneAudio(299);
    const entered=demoZoneInside && zoneBeepTimer!==null;
    updateZoneAudio(301);
    const exited=!demoZoneInside && zoneBeepTimer===null;
    isSimulating=false;stopZoneAudio();
    return {before,entered,exited,radius:dangerRadius()};
  });
  assert.deepEqual(audioStates,{before:false,entered:true,exited:true,radius:300});
  console.log('PASS simulated audio threshold and ten-second beep timer lifecycle');

  assert.deepEqual(errors,[],'Unexpected uncaught browser JavaScript exceptions');
  console.log('PASS no unhandled JavaScript errors in tested flows');
} finally {
  await browser.close();
}
