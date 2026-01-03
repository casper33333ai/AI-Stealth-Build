const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

/**
 * Functie om JSON cookies te injecteren in de Puppeteer browser sessie.
 * Ondersteunt formaten van populaire extensies zoals 'EditThisCookie'.
 */
async function injectSession(page, cookieData) {
  try {
    if (!cookieData || cookieData === '[]' || cookieData === '') {
      console.log('ℹ️ [SESSION] Geen sessie-cookies opgegeven. Doorgaan als gast.');
      return;
    }

    let cookies;
    try {
      cookies = JSON.parse(cookieData);
    } catch (e) {
       console.error('❌ [SESSION] Ongeldige JSON in Cookie Vault. Controleer de syntax.');
       return;
    }

    if (!Array.isArray(cookies)) {
      console.error('❌ [SESSION] Cookie data moet een JSON array zijn.');
      return;
    }

    console.log(`🔑 [SESSION] Bezig met injecteren van ${cookies.length} cookies...`);
    
    // Sommige export tools missen het 'domain' veld of gebruiken een '.' prefix die Puppeteer niet leuk vindt.
    // We zorgen ervoor dat cookies tenminste een valide domein hebben als ze dat missen.
    const validCookies = cookies.map(c => {
      // Filter ongeldige domeinen of zet ze om naar een standaard
      const domain = c.domain ? (c.domain.startsWith('.') ? c.domain : '.' + c.domain) : '.google.com';
      return {
        ...c,
        domain: domain,
        path: c.path || '/',
        httpOnly: c.httpOnly !== undefined ? c.httpOnly : false,
        secure: c.secure !== undefined ? c.secure : true,
        sameSite: c.sameSite || 'Lax'
      };
    });

    await page.setCookie(...validCookies);
    console.log('✅ [SESSION] Sessie succesvol geïnjecteerd.');
  } catch (err) {
    console.error('⚠️ [SESSION] Fout bij injecteren van cookies:', err.message);
    console.log('👉 Tip: Zorg dat de JSON exact hetzelfde formaat heeft als de export van je browser extensie.');
  }
}

async function scrapeAIStudio() {
  const url = process.env.AI_URL || "https://ai.studio/apps/drive/1tubqLw5bI6VwmqUsZpQEAQ8HQNf6p_TW";
  const rawCookies = process.env.SESSION_COOKIES || `[]`;
  
  console.log('🕶️ [STEALTH] Initialiseren van beveiligde browser sessie...');
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
      '--disable-infobars'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Roep de injectie functie aan voordat we navigeren
  await injectSession(page, rawCookies);

  try {
    console.log('🌐 [NAVIGATE] Navigeren naar: ' + url);
    // Gebruik een langere timeout en networkidle2 voor zware AI Studio pagina's
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    
    console.log('⏳ [WAIT] Wachten op rendering van de code editor/preview...');
    // Google AI Studio heeft vaak complexe loading states
    await new Promise(r => setTimeout(r, 25000));

    const result = await page.evaluate(async () => {
      // Helper om broncode te vinden in schaduw-DOMs of frames
      const findCode = (root) => {
        // Zoek eerst in alle iframes, want AI Studio renders previews in frames
        const frames = Array.from(root.querySelectorAll('iframe'));
        for (const frame of frames) {
          try {
            const frameDoc = frame.contentDocument || frame.contentWindow.document;
            if (frameDoc && frameDoc.documentElement.innerHTML.length > 500) {
              return frameDoc.documentElement.outerHTML;
            }
          } catch(e) {}
        }

        // Als geen frame, zoek naar Monaco editor of app-root
        const selectors = ['app-root', '#app', 'main', '.monaco-editor'];
        for (const s of selectors) {
          const el = root.querySelector(s);
          if (el && el.innerHTML.length > 100) return el.innerHTML;
        }
        
        return null;
      };

      return findCode(document);
    });

    if (!result || result.length < 200) {
      throw new Error('Kon geen valide web-app code vinden. Controleer of de URL correct is en de sessie nog geldig.');
    }

    console.log('🧹 [SANITY] Opschonen van broncode en headers...');
    
    // Verwijder Google-specifieke rommel uit de HTML string
    const sanitized = result
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, (match) => {
        if (match.includes('google') || match.includes('telemetry') || match.includes('analytics')) return '';
        return match;
      })
      .replace(/<link\b[^>]*google[^>]*>/gm, '');

    const finalHtml = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Stealth AI App</title>
    <style>
        body { margin: 0; padding: 0; background: #fafafa; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        #app-mount { width: 100vw; height: 100vh; overflow: auto; }
    </style>
</head>
<body>
    <div id="app-mount">${sanitized}</div>
</body>
</html>`;

    if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
    fs.writeFileSync(path.join('www', 'index.html'), finalHtml);
    
    console.log('🚀 [SUCCESS] Build broncode voorbereid voor native transformatie!');
  } catch (err) {
    console.error('❌ [FATAL] Scraper gefaald:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

scrapeAIStudio();