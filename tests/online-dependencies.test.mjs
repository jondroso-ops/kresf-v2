import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Unlike browser.test.mjs, this test permits normal network dependencies.
// Fail rather than falsely claiming online map/QR/theme compatibility.
const base=process.env.KRESF_BASE_URL || 'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(e.message));
try{
  await page.goto(new URL('app/',base).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.L==='object' && typeof window.qrcode==='function',{timeout:25000});
  await page.waitForFunction(()=>{
    const el=document.querySelector('.bg-slate-900');
    return el && getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
  },{timeout:25000});
  assert.notEqual(await page.locator('#leafletMap .leaflet-container').count(),0,
    'Live Leaflet map was not initialized');
  await page.locator('.nav-btn').nth(3).click();
  const code=page.locator('#qr-site svg');
  await code.waitFor({timeout:10000});
  assert.deepEqual(pageErrors,[]);
  console.log('PASS CDN-loaded Tailwind, Leaflet and QR code function with the app CSP');
} finally {await browser.close();}
