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
  const url = process.env.AI_URL || "https://ai.studio/apps/drive/1BNWwLtp83Lrj8hnBWKgLcIMdmdK27e-a";
  const rawCookies = process.env.SESSION_COOKIES || `[
    {
        "domain": ".aistudio.google.com",
        "expirationDate": 1802002387.353105,
        "hostOnly": false,
        "httpOnly": false,
        "name": "_ga",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "GA1.1.1096617774.1767188855",
        "id": 1
    },
    {
        "domain": ".aistudio.google.com",
        "expirationDate": 1802002387.372652,
        "hostOnly": false,
        "httpOnly": false,
        "name": "_ga_P1DBVKWT6V",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "GS2.1.s1767442141$o5$g1$t1767442387$j45$l0$h281952451",
        "id": 2
    },
    {
        "domain": ".aistudio.google.com",
        "expirationDate": 1802002387.187485,
        "hostOnly": false,
        "httpOnly": false,
        "name": "_ga_RJSPDF5Y0Q",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "GS2.1.s1767442141$o5$g1$t1767442387$j44$l0$h0",
        "id": 3
    },
    {
        "domain": ".google.com",
        "expirationDate": 1801766252.17005,
        "hostOnly": false,
        "httpOnly": false,
        "name": "__Secure-1PAPISID",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "EV-2ZXCz8aBNsQhY/APT_tLDDFMYlZ4qKN",
        "id": 4
    },
    {
        "domain": ".google.com",
        "expirationDate": 1801766252.168079,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__Secure-1PSID",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "g.a0005AjMoxiKDUd2lMuEqjoBbEQCvbCrnyEyjVwRY6G2MlCo6G2ChJbxpj3GkFEhIUHvu1y6PAACgYKAfkSARISFQHGX2MiN0LiTk1KQgTpgX2clxDlGRoVAUF8yKrfGiTuM6bOgUtg8P70h19f0076",
        "id": 5
    },
    {
        "domain": ".google.com",
        "expirationDate": 1798978585.941586,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__Secure-1PSIDCC",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "AKEyXzXH06J3Kh_s1o2Fnbbr4lxyOuYosURciO9K8Z_BSoVh4pyLAU43PyDE6IkPPmz5Oyy6fQ",
        "id": 6
    },
    {
        "domain": ".google.com",
        "expirationDate": 1767442735.007165,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__Secure-1PSIDRTS",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "sidts-CjYBflaCdc3CIGFPSJZFq_rFg2un_6uGyUyJybDOt5Wn9wbZ4EJL0nDV3SUOLQrHnqtky7ndhpAQAA",
        "id": 7
    },
    {
        "domain": ".google.com",
        "expirationDate": 1798978135.004806,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__Secure-1PSIDTS",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "sidts-CjYBflaCdc3CIGFPSJZFq_rFg2un_6uGyUyJybDOt5Wn9wbZ4EJL0nDV3SUOLQrHnqtky7ndhpAQAA",
        "id": 8
    },
    {
        "domain": ".google.com",
        "expirationDate": 1801766252.170282,
        "hostOnly": false,
        "httpOnly": false,
        "name": "__Secure-3PAPISID",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "EV-2ZXCz8aBNsQhY/APT_tLDDFMYlZ4qKN",
        "id": 9
    },
    {
        "domain": ".google.com",
        "expirationDate": 1801766252.168333,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__Secure-3PSID",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "g.a0005AjMoxiKDUd2lMuEqjoBbEQCvbCrnyEyjVwRY6G2MlCo6G2CN17ytMY7kgiwJNRJjvjVugACgYKAdoSARISFQHGX2Mic9K3BYpoVGHbkKC5UN8ctRoVAUF8yKpJAObShXdz9epk2lfJD4bj0076",
        "id": 10
    },
    {
        "domain": ".google.com",
        "expirationDate": 1798978585.941781,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__Secure-3PSIDCC",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "AKEyXzVeJPZtetismXthMoEDlPyqey5FyOJMsPxBOfQFbLoAg92e7rm3tc8Scrp_Zyoma0-QFA",
        "id": 11
    },
    {
        "domain": ".google.com",
        "expirationDate": 1767442735.007605,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__Secure-3PSIDRTS",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "sidts-CjYBflaCdc3CIGFPSJZFq_rFg2un_6uGyUyJybDOt5Wn9wbZ4EJL0nDV3SUOLQrHnqtky7ndhpAQAA",
        "id": 12
    },
    {
        "domain": ".google.com",
        "expirationDate": 1798978135.007412,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__Secure-3PSIDTS",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "sidts-CjYBflaCdc3CIGFPSJZFq_rFg2un_6uGyUyJybDOt5Wn9wbZ4EJL0nDV3SUOLQrHnqtky7ndhpAQAA",
        "id": 13
    },
    {
        "domain": ".google.com",
        "expirationDate": 1781083850.84499,
        "hostOnly": false,
        "httpOnly": true,
        "name": "__Secure-BUCKET",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "CPYD",
        "id": 14
    },
    {
        "domain": ".google.com",
        "expirationDate": 1775036644.927835,
        "hostOnly": false,
        "httpOnly": true,
        "name": "AEC",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "AaJma5t6rMgsXZLoRuZXyTWbqRIb-XS98PDTViueIjjZ0Ca2YiQYK9N8YA",
        "id": 15
    },
    {
        "domain": ".google.com",
        "expirationDate": 1801766252.169534,
        "hostOnly": false,
        "httpOnly": false,
        "name": "APISID",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "jHWvR4faGvAMQnY7/AU5EKiw_AH0bUtuMa",
        "id": 16
    },
    {
        "domain": ".google.com",
        "expirationDate": 1801766252.169086,
        "hostOnly": false,
        "httpOnly": true,
        "name": "HSID",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "A5LJZkrKIHtDB1Dli",
        "id": 17
    },
    {
        "domain": ".google.com",
        "expirationDate": 1783252868.242479,
        "hostOnly": false,
        "httpOnly": true,
        "name": "NID",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "527=vC7p2t8i8OTspVlhOrbkVKla7jZnF6H213FHehXPsfqkbNZZnXtIZqc1hClIlMNy_5NAxBHITVttPlimNFP8Oqw1phkZxosVL8eZ07Bxex4KJslkdXzWj3nZrLi5UBQdi_VZRvEf9n-6aZ98UPAq5OzSd_0WXY2STXT-cocaucx-HDyOTpWWEiNQiY8AKtqanK5Hxe0Dqv3LpxIKoTl5BoRIz9yJYTMfltx4s8UFxbhRG2lmVFnY4nIT0gqa78c5Rtw6g4oySJaULG3ShbLXz2pAysD1XLmJ5vRpr99JK_3kIVtr2Z3ABdxSRZtUb3lps_B5hCOpASQm3zGWF31NGQI5bsxD6Mge5nqqJBEt9UjJzW54IZgM_wgltd3Adbec17ER7D9U6v0RH8pV6iaq4CwHnL2nr6zWzEffP_ebsoquPnraPDYX14RyQX88mc9gj2iewwiCP23EM3Gp5qiSUiv3Ru-GxRP0C6oEs1m8SNTK6N7fTREN-SZxIw8fDyD47X2SAxw__Sf0NeHhPH2Tpwm44xffWa9eivMDTsprswCy64xZbCVksd0ofbIyzIpIxPlKLblKz3skEkmmi0mHwme4N46UGCQHV_3MMJvrirzhWY_F5fclW3CUVDj6_frrFKNs5VQ49XcOW9P8onpDW39MSHfmEVfzxsZyu-UQa8gv8OrjXmy4Ik4bEUSNJY3aFNdF-N7sfpNfpgScLD2Zt4lkjeHG5WXzn7EqUswPB8xllBdcMX1oY-Neceubp0u982eXfIAaLfk_rRyxB65uNZkqfVkgquJFsSFRON2k_OxemFrqGytufqHx3RcEaLJeGGXBUHk0QCz-Qz_hXZ_Gc3f6PirwcCseENaxYEIF8bKcD5d5Sr9PS3prJT7qH0fmx8ERT6_nLcP2F9TBY3ZAoOI00Q",
        "id": 18
    },
    {
        "domain": ".google.com",
        "expirationDate": 1801766252.169816,
        "hostOnly": false,
        "httpOnly": false,
        "name": "SAPISID",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "EV-2ZXCz8aBNsQhY/APT_tLDDFMYlZ4qKN",
        "id": 19
    },
    {
        "domain": ".google.com",
        "expirationDate": 1780750000.101546,
        "hostOnly": false,
        "httpOnly": false,
        "name": "SEARCH_SAMESITE",
        "path": "/",
        "sameSite": "strict",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "CgQIzp8B",
        "id": 20
    },
    {
        "domain": ".google.com",
        "expirationDate": 1801766252.167643,
        "hostOnly": false,
        "httpOnly": false,
        "name": "SID",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "g.a0005AjMoxiKDUd2lMuEqjoBbEQCvbCrnyEyjVwRY6G2MlCo6G2Cq7cHrcDf65ZCGhSA-3zKBQACgYKAa0SARISFQHGX2MilDDDN_HkrUuheTajjJQvRRoVAUF8yKojKXtqEHuU5nkXpz6tsTPP0076",
        "id": 21
    },
    {
        "domain": ".google.com",
        "expirationDate": 1798978585.941176,
        "hostOnly": false,
        "httpOnly": false,
        "name": "SIDCC",
        "path": "/",
        "sameSite": "unspecified",
        "secure": false,
        "session": false,
        "storeId": "0",
        "value": "AKEyXzWW7G8Z2ifTcKO-DkCLbV3M2H78Mb2uLA7OEbrPB1BTfWVhsMUYa8V2xFRQmuBHX-Gvv0E",
        "id": 22
    },
    {
        "domain": ".google.com",
        "expirationDate": 1793612650.576948,
        "hostOnly": false,
        "httpOnly": false,
        "name": "SOCS",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "CAISHAgCEhJnd3NfMjAyNTEwMDItMF9SQzEaAm5sIAEaBgiApPzGBg",
        "id": 23
    },
    {
        "domain": ".google.com",
        "expirationDate": 1801766252.169311,
        "hostOnly": false,
        "httpOnly": true,
        "name": "SSID",
        "path": "/",
        "sameSite": "unspecified",
        "secure": true,
        "session": false,
        "storeId": "0",
        "value": "Az00D5OqzLpA5TXTe",
        "id": 24
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