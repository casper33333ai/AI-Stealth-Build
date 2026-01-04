const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function scrapeAIStudio() {
  const url = process.env.AI_URL || "https://aistudio.google.com/u/1/apps/drive/1C95LlT34ylBJSzh30JU2J1ZlwMZSIQrx?showPreview=true&showAssistant=true";
  const rawCookies = process.env.SESSION_COOKIES || '[]';
  
  console.log('🚀 [FORGE] Starting Stealth Scraper...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    if (rawCookies !== '[]' && rawCookies !== '') {
      console.log('🍪 [SESSION] Injecting cookies...');
      const cookies = JSON.parse(rawCookies);
      await page.setCookie(...cookies.map(c => ({
        ...c, 
        domain: c.domain || '.google.com',
        secure: true
      })));
    }

    console.log('🌐 [NAVIGATE] Loading URL...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    
    console.log('⏳ [WAIT] Allowing UI to render (20s)...');
    await new Promise(r => setTimeout(r, 20000));

    const content = await page.evaluate(() => {
      // Probeer de hoofdcontainer te vinden
      const selectors = ['app-root', '.workspace-container', 'main', '#app'];
      for (const s of selectors) {
        const el = document.querySelector(s);
        if (el && el.innerHTML.length > 500) return el.innerHTML;
      }
      return document.body.innerHTML;
    });

    const finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>Stealth AI App</title>
  <style>
    body { margin: 0; padding: 0; background: #000; color: #fff; font-family: sans-serif; overflow: hidden; }
    .container { width: 100vw; height: 100vh; overflow: auto; }
  </style>
</head>
<body>
  <div class="container">${content}</div>
</body>
</html>`;

    if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
    fs.writeFileSync(path.join('www', 'index.html'), finalHtml);
    console.log('✅ [SUCCESS] UI captured to www/index.html');
  } catch (err) {
    console.error('❌ [FATAL] Scraper failed:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}
scrapeAIStudio();