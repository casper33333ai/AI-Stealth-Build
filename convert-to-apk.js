const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function forge() {
  console.log('--- STARTING FORGE v12 ---');
  
  const run = (cmd) => {
    console.log('Executing: ' + cmd);
    execSync(cmd, { stdio: 'inherit' });
  };

  try {
    // 1. Setup web directory
    if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
    if (!fs.existsSync(path.join('www', 'index.html'))) {
      fs.writeFileSync(path.join('www', 'index.html'), '<html><body><h1>Re-scraped content missing</h1></body></html>');
    }

    // 2. Build Capacitor Config
    const capConfig = {
      appId: "com.forge.stealth",
      appName: "Stealth AI App",
      webDir: "www",
      server: {
        androidScheme: "https",
        allowNavigation: ["*"]
      }
    };
    fs.writeFileSync('capacitor.config.json', JSON.stringify(capConfig, null, 2));

    // 3. Native Platform Management
    if (!fs.existsSync('android')) {
      run('npx cap add android');
    }
    
    run('npx cap sync android');

    // 4. Gradle Build with Permission Fix
    console.log('Configuring Gradle...');
    if (process.platform !== 'win32') {
      run('chmod -R 777 android');
    }

    const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    run('cd android && ' + gradlew + ' assembleDebug --stacktrace');
    
    console.log('--- FORGE SUCCESSFUL ---');
  } catch (e) {
    console.error('--- FORGE FAILED ---');
    console.error(e.message);
    process.exit(1);
  }
}
forge();