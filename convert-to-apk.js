const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function forge() {
  console.log('🏗️ [FORGE] Starting Native Build Pipeline...');
  
  try {
    // 1. Forceer een schone web directory met index.html
    if (!fs.existsSync('www')) {
      fs.mkdirSync('www', { recursive: true });
    }
    
    if (!fs.existsSync(path.join('www', 'index.html'))) {
      console.log('⚠️ [WARN] No index.html found, creating placeholder...');
      fs.writeFileSync(path.join('www', 'index.html'), '<html><body><h1>App Loading...</h1></body></html>');
    }

    // 2. Capacitor Config: Forceert WebView naar de juiste mappen en staat navigatie toe
    const capConfig = {
      appId: "com.forge.stealth",
      appName: "Stealth AI App",
      webDir: "www",
      bundledWebRuntime: false,
      server: {
        androidScheme: "https",
        allowNavigation: ["*"],
        cleartext: true
      }
    };
    fs.writeFileSync('capacitor.config.json', JSON.stringify(capConfig, null, 2));
    console.log('⚙️ [CONFIG] Capacitor settings forced.');

    // 3. Android Project Setup
    if (!fs.existsSync('android')) {
      console.log('➕ [PLATFORM] Adding Android...');
      execSync('npx cap add android', { stdio: 'inherit' });
    }
    
    console.log('🔄 [SYNC] Syncing native project...');
    execSync('npx cap sync android', { stdio: 'inherit' });
    
    // 4. Gradle APK Build
    console.log('🛠️ [BUILD] Compiling APK...');
    const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    execSync('cd android && chmod +x gradlew && ' + gradlew + ' assembleDebug', { stdio: 'inherit' });
    
    console.log('🚀 [DONE] APK Forge Complete!');
  } catch (e) {
    console.error('❌ [ERROR] Forge failed:', e.message);
    process.exit(1);
  }
}
forge();