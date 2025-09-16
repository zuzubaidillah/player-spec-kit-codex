import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const appinfoSrc = path.join(root, 'appinfo.json');
const appinfoDst = path.join(dist, 'appinfo.json');
const icon192Src = path.join(root, 'icon-192.png');
const icon192Dst = path.join(dist, 'icon-192.png');

const icon512Src = path.join(root, 'icon-512.png');
const icon512Dst = path.join(dist, 'icon-512.png');

if (!fs.existsSync(dist)) {
  console.error('Dist folder not found. Run "npm run build" first.');
  process.exit(1);
}
if (!fs.existsSync(appinfoSrc)) {
  console.error('appinfo.json not found at project root.');
  process.exit(1);
}

// --- copy appinfo.json ---
fs.copyFileSync(appinfoSrc, appinfoDst);
console.log('Copied appinfo.json into dist/.');

// --- copy icon-192.png from root ---
if (!fs.existsSync(icon192Src)) {
  console.error('icon-192.png not found at project root.');
  process.exit(1);
}

fs.copyFileSync(icon192Src, icon192Dst);
console.log('Copied icon-192.png into dist/.');

// --- copy icon-512.png from root ---
if (!fs.existsSync(icon512Src)) {
  console.error('icon-512.png not found at project root.');
  process.exit(1);
}

fs.copyFileSync(icon512Src, icon512Dst);
console.log('Copied icon-512.png into dist/.');

// Copy slide-00*.{png,jpg,mp4} from project root into dist/
try {
  const names = fs.readdirSync(root);
  const slideRegex = /^slide-00\d+\.(png|jpg|jpeg|mp4)$/i;
  const picked = names.filter((n) => slideRegex.test(n));
  for (const n of picked) {
    const src = path.join(root, n);
    const dst = path.join(dist, n);
    fs.copyFileSync(src, dst);
    console.log('Copied', n, 'into dist/.');
  }
  if (!picked.length) {
    console.warn('No slide-00*.{png,jpg,mp4} files found at project root.');
  }
} catch (e) {
  console.warn('Slide copy step failed:', e?.message || e);
}

// Minimal verification for required files (after copies)
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
  // Drop 'nomodule' attribute from legacy scripts for broader compatibility
  html = fs.readFileSync(htmlPath, 'utf8');
  const withoutNoModule = html.replace(/\snomodule(=\"\"|=\'\')?/gi, '');
  if (withoutNoModule !== html) {
    fs.writeFileSync(htmlPath, withoutNoModule);
    console.log('Removed nomodule attribute from legacy script tags.');
  }
  // Ensure legacy bundles are referenced; if missing, inject them explicitly
  const assetsDir = path.join(dist, 'assets');
  const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
  const legacyIndex = files.find(f => /index-legacy-.*\.js$/i.test(f));
  const legacyPoly = files.find(f => /polyfills-legacy-.*\.js$/i.test(f));
  let html2 = fs.readFileSync(htmlPath, 'utf8');
  if (!/index-legacy-.*\.js/i.test(html2) && legacyIndex) {
    const inject = [
      legacyPoly ? `<script src="assets/${legacyPoly}"></script>` : '',
      `<script src="assets/${legacyIndex}"></script>`
    ].filter(Boolean).join('\n    ');
    html2 = html2.replace(/<\/body>/i, `    ${inject}\n  </body>`);
    fs.writeFileSync(htmlPath, html2);
    console.log('Injected explicit legacy scripts into index.html');
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
