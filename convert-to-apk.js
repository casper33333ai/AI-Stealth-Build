const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function buildApp() {
  console.log('🏗️ [FORGE] Starten van native APK build proces...');
  const webPath = path.join(process.cwd(), 'www');
  
  if (!fs.existsSync(path.join(webPath, 'index.html'))) {
    console.error('❌ Fout: Geen index.html gevonden in de web directory.');
    process.exit(1);
  }

  try {
    const config = {
      appId: "com.forge.stealth",
      appName: "Stealth AI App",
      webDir: "www",
      server: { androidScheme: "https" }
    };
    fs.writeFileSync('capacitor.config.json', JSON.stringify(config, null, 2));

    console.log('⚙️ [CAP] Toevoegen van Android platform...');
    try { execSync('npx cap add android', { stdio: 'inherit' }); } catch(e) {}
    
    console.log('🔄 [CAP] Synchroniseren van web assets...');
    execSync('npx cap sync android', { stdio: 'inherit' });
    
    if (process.platform !== 'win32') {
      console.log('🔑 [FS] Instellen van executable rechten...');
      if (fs.existsSync('android/gradlew')) {
        execSync('chmod +x android/gradlew');
      }
    }

    console.log('🛠️ [GRADLE] Compileren naar APK (Debug Mode)...');
    execSync(`cd android && ./gradlew assembleDebug --no-daemon`, { stdio: 'inherit' });
    
    console.log('🎯 [DONE] APK succesvol gegenereerd!');
  } catch (e) {
    console.error('❌ [BUILD_ERROR] Fout tijdens compilatie:', e.message);
    process.exit(1);
  }
}

buildApp();