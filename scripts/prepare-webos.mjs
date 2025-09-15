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

// Remove modern ESM script tags that cause ares-package minifier issues
try {
  const htmlPath = path.join(dist, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const before = html;
  // Remove <script type="module" ...></script>
  html = html.replace(/<script[^>]*type=["']module["'][^>]*><\/script>\s*/gi, '');
  if (before !== html) {
    fs.writeFileSync(htmlPath, html);
    console.log('Removed module scripts from dist/index.html (legacy-only runtime).');
  }
  // Remove modern JS bundles to avoid ares-package minifier parsing errors
  const assets = path.join(dist, 'assets');
  if (fs.existsSync(assets)) {
    for (const f of fs.readdirSync(assets)) {
      if (f.endsWith('.js') && !f.includes('legacy')) {
        fs.rmSync(path.join(assets, f), { force: true });
        console.log('Removed modern bundle:', f);
      }
    }
  }
} catch (e) {
  console.warn('HTML post-process failed:', e?.message || e);
}
