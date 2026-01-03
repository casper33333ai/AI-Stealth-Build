const { execSync } = require('child_process');
const fs = require('fs');

async function forge() {
  console.log('🏗️ [FORGE] Capacitor Initialisatie...');
  try {
    const capConfig = { appId: "com.forge.stealth", appName: "Stealth AI App", webDir: "www", server: { androidScheme: "https" }};
    fs.writeFileSync('capacitor.config.json', JSON.stringify(capConfig, null, 2));

    if (!fs.existsSync('android')) {
      execSync('npx cap add android', { stdio: 'inherit' });
    }
    execSync('npx cap sync android', { stdio: 'inherit' });
    
    console.log('🛠️ [GRADLE] APK Compileren...');
    const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    execSync(`cd android && chmod +x gradlew && ${gradlew} assembleDebug`, { stdio: 'inherit' });
    console.log('🚀 [DONE] APK is klaar!');
  } catch (e) {
    console.error('❌ [BUILD ERROR]', e.message);
    process.exit(1);
  }
}
forge();