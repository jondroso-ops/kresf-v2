import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = process.env.KRESF_BASE_URL || 'http://127.0.0.1:8765/';
await fs.mkdir('review/screenshots',{recursive:true});
const browser = await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const views=[
  {name:'01-website-desktop',url:'',viewport:{width:1440,height:900},tab:null},
  {name:'02-website-mobile',url:'',viewport:{width:390,height:844},tab:null},
  {name:'03-pwa-hud',url:'app/',viewport:{width:390,height:844},tab:0},
  {name:'04-pwa-spot-save',url:'app/',viewport:{width:390,height:844},tab:1},
  {name:'05-pwa-habitat-lab',url:'app/',viewport:{width:390,height:844},tab:2},
  {name:'06-pwa-guardian',url:'app/',viewport:{width:390,height:844},tab:3}
];
try {
  for(const entry of views) {
    const context=await browser.newContext({viewport:entry.viewport,isMobile:entry.viewport.width<500,hasTouch:entry.viewport.width<500});
    const page=await context.newPage();
    const consoleErrors=[];
    page.on('pageerror',e=>consoleErrors.push(e.message));
    await page.goto(new URL(entry.url,base).href,{waitUntil:'domcontentloaded'});
    // Give the production CDN and map tiles an opportunity to load.
    await page.waitForTimeout(4500);
    if(entry.tab!==null) {
      await page.locator('.nav-btn').nth(entry.tab).click();
      await page.waitForTimeout(650);
      if(entry.tab===2){
        await page.waitForFunction(()=>window.KresfHabitat3D?.state.frames>3,{timeout:12000});
      }
    }
    const path='review/screenshots/'+entry.name+'.png';
    await page.screenshot({path,fullPage:entry.tab===null});
    const nav = entry.tab===null ? 'companion website' : 'PWA tab '+entry.tab;
    console.log('CAPTURED '+path+' ('+nav+', pageErrors='+consoleErrors.length+')');
    if(consoleErrors.length)console.log('BROWSER WARN '+entry.name+': '+consoleErrors.join('; ').slice(0,400));
    await context.close();
  }
} finally {await browser.close();}
