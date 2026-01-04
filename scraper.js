const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function scrapeAIStudio() {
  const url = process.env.AI_URL || "https://aistudio.google.com/u/1/apps/drive/1C95LlT34ylBJSzh30JU2J1ZlwMZSIQrx?showPreview=true&showAssistant=true";
  const rawCookies = process.env.SESSION_COOKIES || '[]';
  
  console.log('--- STARTING SCRAPE v12 ---');
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    if (rawCookies && rawCookies !== '[]') {
      console.log('Injecting session...');
      const cookies = JSON.parse(rawCookies);
      await page.setCookie(...cookies.map(c => ({
        ...c, 
        domain: c.domain || '.google.com',
        secure: true
      })));
    }

    console.log('Navigating to: ' + url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    
    console.log('Waiting for render (30s)...');
    await new Promise(r => setTimeout(r, 30000));

    const content = await page.evaluate(() => {
      // Probeer de meest waarschijnlijke content containers
      const root = document.querySelector('app-root') || 
                   document.querySelector('.workspace-container') || 
                   document.body;
      return root.innerHTML;
    });

    const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>Stealth AI App</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; color: #fff; font-family: sans-serif; overflow: hidden; }
    #app-surface { width: 100%; height: 100%; overflow: auto; -webkit-overflow-scrolling: touch; }
  </style>
</head>
<body>
  <div id="app-surface">${content}</div>
</body>
</html>`;

    if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
    fs.writeFileSync(path.join('www', 'index.html'), finalHtml);
    console.log('--- SCRAPE SUCCESSFUL ---');
  } catch (err) {
    console.error('--- SCRAPE FAILED ---');
    console.error(err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}
scrapeAIStudio();