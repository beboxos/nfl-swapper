// Ajuste le projet Android généré par Capacitor : icônes, portrait, plein écran.
// Idempotent : peut être relancé après chaque `cap sync`.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');
const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const stylesPath = path.join(res, 'values', 'styles.xml');

if (!fs.existsSync(manifestPath)) {
  console.error('Projet android absent : lancer `npm run android:init` d\'abord.');
  process.exit(1);
}

// 1) icônes
const iconsSrc = path.join(root, 'resources', 'android');
for (const dir of fs.readdirSync(iconsSrc)) {
  const dest = path.join(res, dir);
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(path.join(iconsSrc, dir))) {
    fs.copyFileSync(path.join(iconsSrc, dir, f), path.join(dest, f));
  }
}
// les icônes adaptatives XML de Capacitor pointent vers un fond blanc : on utilise un fond navy
const bgColor = path.join(res, 'values', 'ic_launcher_background.xml');
if (fs.existsSync(bgColor)) {
  fs.writeFileSync(bgColor, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0B1530</color>\n</resources>\n');
}

// 2) orientation portrait
let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android:screenOrientation')) {
  manifest = manifest.replace('<activity', '<activity\n            android:screenOrientation="portrait"');
  fs.writeFileSync(manifestPath, manifest);
}

// 3) plein écran (sans barre d'action ni barre d'état)
if (fs.existsSync(stylesPath)) {
  let styles = fs.readFileSync(stylesPath, 'utf8');
  if (!styles.includes('android:windowFullscreen')) {
    styles = styles.replace(
      /(<style name="AppTheme.NoActionBar"[^>]*>)/,
      '$1\n        <item name="android:windowFullscreen">true</item>'
    );
    fs.writeFileSync(stylesPath, styles);
  }
}
console.log('Projet Android ajusté (icônes, portrait, plein écran).');
