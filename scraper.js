const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function injectSession(page, cookieData) {
  try {
    if (!cookieData || cookieData === '[]' || cookieData === '') {
      console.log('ℹ️ [SESSION] Geen sessie-cookies gevonden in secrets of config.');
      return;
    }
    const cookies = JSON.parse(cookieData);
    const validCookies = cookies.map(c => ({
      ...c,
      domain: c.domain ? (c.domain.startsWith('.') ? c.domain : '.' + c.domain) : '.google.com',
      path: c.path || '/',
      secure: true
    }));
    await page.setCookie(...validCookies);
    console.log('✅ [SESSION] Cookies succesvol geïnjecteerd.');
  } catch (err) {
    console.error('⚠️ [SESSION] Cookie-injectie mislukt:', err.message);
  }
}

async function scrapeAIStudio() {
  const url = process.env.AI_URL || "https://github.com/casper33333ai/Transformation-Tracker";
  const rawCookies = process.env.SESSION_COOKIES || `[
    {
        "domain": ".github.com",
        "expirationDate": 1798978861.712139,
        "hostOnly": false,
        "httpOnly": false,
        "name": "_octo",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "GH1.1.44209285.1767442862",
        "id": 1
    },
    {
        "domain": ".github.com",
        "hostOnly": false,
        "httpOnly": false,
        "name": "color_mode",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": true,
        "storeId": "0",
        "value": "%7B%22color_mode%22%3A%22auto%22%2C%22light_theme%22%3A%7B%22name%22%3A%22light%22%2C%22color_mode%22%3A%22light%22%7D%2C%22dark_theme%22%3A%7B%22name%22%3A%22dark%22%2C%22color_mode%22%3A%22dark%22%7D%7D",
        "id": 2
    },
    {
        "domain": ".github.com",
        "hostOnly": false,
        "httpOnly": false,
        "name": "cpu_bucket",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": true,
        "storeId": "0",
        "value": "md",
        "id": 3
    },
    {
        "domain": ".github.com",
        "expirationDate": 1799002211.11144,
        "hostOnly": false,
        "httpOnly": true,
        "name": "dotcom_user",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "casper33333ai",
        "id": 4
    },
    {
        "domain": ".github.com",
        "expirationDate": 1799002211.110564,
        "hostOnly": false,
        "httpOnly": true,
        "name": "logged_in",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "yes",
        "id": 5
    },
    {
        "domain": ".github.com",
        "hostOnly": false,
        "httpOnly": false,
        "name": "preferred_color_mode",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": true,
        "storeId": "0",
        "value": "dark",
        "id": 6
    },
    {
        "domain": ".github.com",
        "hostOnly": false,
        "httpOnly": false,
        "name": "tz",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": true,
        "storeId": "0",
        "value": "Europe%2FAmsterdam",
        "id": 7
    },
    {
        "domain": "github.com",
        "expirationDate": 1768675811.10999,
        "hostOnly": true,
        "httpOnly": true,
        "name": "__Host-user_session_same_site",
        "path": "/",
        "sameSite": "strict",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "BwJsbtYSI64EJuuoj89tT-1Icc9SObXr_8EPXuUaVTIJvDSl",
        "id": 8
    },
    {
        "domain": "github.com",
        "expirationDate": 1799002206.745916,
        "hostOnly": true,
        "httpOnly": true,
        "name": "_device_id",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "5fb569dfaf8e15eb0c9b6605f15a423d",
        "id": 9
    },
    {
        "domain": "github.com",
        "hostOnly": true,
        "httpOnly": true,
        "name": "_gh_sess",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": true,
        "storeId": "0",
        "value": "55rO8mRPYNFucOxN9AL%2BW9EVPRALPZb3NxTSW81HF%2ByxOyOm822Hy%2Fer48v48drWCN9J340y%2FtBYMEOXSVe1PrZ6DhubGpC9Ap4ZhoUVOJx97C%2F%2Br%2BoGM4DVKl70LBbp8frUXzvR4i4vJDQtVX59ijUGpV9u6Ma6R1RIjFcWatd%2FUFXuZg9foxwdXN9CU3GianyHBO%2FUX8mtimy3iZTdJRkxDATODLCgDbEVIGEQrjKkRZYJ0tMmhgj1%2Fd7rFDPXiltj6Wu21Ysu83Wj8RQNjODLDt41mzuQgnFRz8iPSB7nUZZCIb9Oa5E9X60xn2Y8LJ2WE3boEI7HFRHGPmjLgVjTloDiMuxpBA81EJfC17yg7WViOLLcmHKLWKXLDA6qVwuzEfB40MF1w0to8krTLe8s0hszFA%2Bux8amMjfPkNbuGINIRjd7J2AQPEGDVUejODFXMktneUqqPjntu8rRD68Di8YoG160RcRvpnHCctXX%2FkhhVd04fy9AecADrQ6Ra9atyN54YWN8pWSsqK0WkraEN2h6r%2BdF524RwVKc6HBFDjec%2B99Z22H9F0brTaEvWxywbauPOGptklxI0kKioYgqTP5rRbBlBdxlLZV%2BxpkuQDiGBZ3v4NtkLJ5A%2FEC8xVlfonLSL7xhp0wIzbFQ6Cd0yfqflDW%2Boj4q77O9y4FkdGqx92d0wSGudht2pMeJZc178zgJxKLWWBv0D78WdDB7SLNHvL3eC4hZm1JwzZai6O2j76obHGNpYYQGchHDTR1b3jFZubd5O5dBQ4QzNgVQQjgDEX231Tg0tO%2FGmRApAW%2F34ErdkNpkwfcu9%2BrxTwj7cooxyAZuxig3BFzrpXIzDY0ZJ9g%2Bcqt8921n67n4az23l%2BOY6xeDNY50UbWpDN3MfaqhUCcxPDjwXSqmqcpZrrpnviohw4N0mFJaHXSOBRX1SY2GvFvCX0i72vb3OYHaqaCyN6dI0aHLYZbffpKYXQ%2FHRdvtFhGR1qJtZCV5ZtjDpFUc8dHqlGgXGlaEppO9qLzcslYQNGemPpGKv6UOFuqfIlZucvn7fPjq0F0%2B13cxjifwGlQAQcqrqXmMWKzmO7WHp7H2hXGg41hc3vBAfQfKTivpWQkfYFSVAUU%3D--U2kU3xiruMSAV%2FbB--48CksjIev8xrSOnZzfhTJw%3D%3D",
        "id": 10
    },
    {
        "domain": "github.com",
        "expirationDate": 1775238611.109332,
        "hostOnly": true,
        "httpOnly": true,
        "name": "saved_user_sessions",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "196204233%3ABwJsbtYSI64EJuuoj89tT-1Icc9SObXr_8EPXuUaVTIJvDSl",
        "id": 11
    },
    {
        "domain": "github.com",
        "hostOnly": true,
        "httpOnly": true,
        "name": "tz",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": true,
        "storeId": "0",
        "value": "Europe%2FAmsterdam",
        "id": 12
    },
    {
        "domain": "github.com",
        "expirationDate": 1768675811.109736,
        "hostOnly": true,
        "httpOnly": true,
        "name": "user_session",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "BwJsbtYSI64EJuuoj89tT-1Icc9SObXr_8EPXuUaVTIJvDSl",
        "id": 13
    }
]`;
  
  if (!url || url.includes('example.com')) {
    console.error('❌ [ERROR] Geen doel-URL gevonden. Stel de AI_URL secret in op GitHub.');
    process.exit(1);
  }

  console.log('🕶️ [STEALTH] Browser opstarten...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await injectSession(page, rawCookies);

  try {
    console.log('🌐 [NAVIGATE] Laden van: ' + url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('⏳ [WAIT] Analyseren van DOM (30s pauze voor JS rendering)...');
    await new Promise(r => setTimeout(r, 30000));

    const content = await page.evaluate(() => {
      const getCode = (doc) => {
        // Zoek naar de preview container van AI Studio
        const selectors = ['iframe', 'app-root', '#app', '.preview-content', 'main'];
        for (const s of selectors) {
          const el = doc.querySelector(s);
          if (el && s === 'iframe') {
            try { return el.contentDocument.documentElement.outerHTML; } catch(e) {}
          }
          if (el && el.innerHTML.length > 500) return el.outerHTML;
        }
        return null;
      };

      let html = getCode(document);
      if (!html) {
        // Diepe scan door alle frames
        const frames = Array.from(document.querySelectorAll('iframe'));
        for (const f of frames) {
          try {
            const d = f.contentDocument || f.contentWindow.document;
            html = d.documentElement.outerHTML;
            if (html.length > 500) break;
          } catch(e) {}
        }
      }
      return html;
    });

    if (!content) throw new Error('Geen bruikbare code gevonden op de pagina.');

    const finalHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>Stealth AI App</title></head><body style="margin:0;padding:0">${content}</body></html>`;

    if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
    fs.writeFileSync(path.join('www', 'index.html'), finalHtml);
    console.log('✅ [SUCCESS] Broncode opgeslagen in www/index.html');
  } catch (err) {
    console.error('❌ [FATAL] Scraper fout:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

scrapeAIStudio();