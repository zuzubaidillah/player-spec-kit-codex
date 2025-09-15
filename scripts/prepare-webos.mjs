import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const appinfoSrc = path.join(root, 'appinfo.json');
const appinfoDst = path.join(dist, 'appinfo.json');

if (!fs.existsSync(dist)) {
  console.error('Dist folder not found. Run "npm run build" first.');
  process.exit(1);
}
if (!fs.existsSync(appinfoSrc)) {
  console.error('appinfo.json not found at project root.');
  process.exit(1);
}

fs.copyFileSync(appinfoSrc, appinfoDst);
console.log('Copied appinfo.json into dist/.');

// Minimal verification for required files
const required = ['index.html', 'manifest.json', 'icon-192.png'];
const missing = required.filter((f) => !fs.existsSync(path.join(dist, f)));
if (missing.length) {
  console.warn('Warning: some expected files missing in dist:', missing);
}
