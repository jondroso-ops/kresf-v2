import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Verify self-hosted Tailwind and QR work with external Leaflet under the CSP.
const base=process.env.KRESF_BASE_URL || 'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const pageErrors=[];
const requests=[];
page.on('request',req=>requests.push(req.url()));
page.on('pageerror',e=>pageErrors.push(e.message));
try{
  await page.goto(new URL('app/',base).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.L==='object' && typeof window.qrcode==='function',{timeout:25000});
  await page.waitForFunction(()=>{
    const el=document.querySelector('.bg-slate-900');
    return el && getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
  },{timeout:25000});
  assert.notEqual(await page.locator('#leafletMap.leaflet-container').count(),0,
    'Live Leaflet map was not initialized');
  await page.locator('.nav-btn').nth(3).click();
  const code=page.locator('#qr-site svg');
  await code.waitFor({timeout:10000});
  assert.ok(requests.some(url=>url.includes('/app/styles/tailwind.css')));
  assert.ok(requests.some(url=>url.includes('/app/vendor/qrcode.js')));
  assert.ok(!requests.some(url=>url.includes('cdn.tailwindcss.com') || url.includes('cdn.jsdelivr.net/npm/qrcode-generator')));
  assert.deepEqual(pageErrors,[]);
  console.log('PASS local Tailwind and QR plus pinned external Leaflet function under CSP');
} finally {await browser.close();}
