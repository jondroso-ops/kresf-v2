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
  assert.match(await page.locator('h1').innerText(),/Protecting koalas/);
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

  // The local app shell is precached by the app-scoped service worker.
  await page.waitForFunction(() => 'serviceWorker' in navigator && !!navigator.serviceWorker.controller, {timeout:20000});
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.match(await page.locator('#network-badge').innerText(),/OFFLINE/);
  await page.locator('button[onclick="switchView(\\'profile\\', this)"]').click();
  assert.equal(await page.locator('#prof-xp').innerText(),'50 XP');
  console.log('PASS cached PWA shell reopens offline with local data intact');
  await context.setOffline(false);
  assert.deepEqual(errors,[],'Unexpected uncaught browser JavaScript exceptions');
  console.log('PASS no unhandled JavaScript errors in tested flows');
} finally {
  await browser.close();
}
