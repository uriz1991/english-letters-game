// Builds one self-contained HTML file (works offline, can be sent over WhatsApp).
// Usage: node build.js
const fs = require('fs');
const path = require('path');

const root = __dirname;
const src = fs.readFileSync(path.join(root, 'src', 'index.src.html'), 'utf8');
const gsap = fs.readFileSync(path.join(root, 'vendor', 'gsap.min.js'), 'utf8');
const font = fs.readFileSync(path.join(root, 'vendor', 'andika.woff2')).toString('base64');

if (!src.includes('/*GSAP_INLINE*/') || !src.includes('/*FONT_B64*/')) {
  throw new Error('placeholders missing in src/index.src.html');
}

if (!src.includes('/*APP_VERSION*/') || !src.includes('/*APP_BUILT*/')) {
  throw new Error('version placeholders missing in src/index.src.html');
}
const full = src
  .replace('/*GSAP_INLINE*/', () => gsap)
  .replace('/*FONT_B64*/', () => font);

// Version = short hash of the game itself, so it changes only when the game changes.
// The date is kept from the last build of the same version, so rebuilding does not look like an update.
const version = require('crypto').createHash('sha256').update(full).digest('hex').slice(0, 8);
const verFile = path.join(root, 'docs', 'version.json');
let prev = null;
try { prev = JSON.parse(fs.readFileSync(verFile, 'utf8')); } catch (e) {}
const d = new Date();
const two = n => String(n).padStart(2, '0');
const built = prev && prev.version === version ? prev.built
  : `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`;
const out = full
  .replace('/*APP_VERSION*/', version)
  .replace('/*APP_BUILT*/', built);

// dist/  -> the single file to send over WhatsApp (not committed)
// docs/  -> served by GitHub Pages (main branch, /docs folder)
const targets = [
  path.join(root, 'dist', 'english-letters-A-H.html'),
  path.join(root, 'docs', 'index.html'),
];
for (const outFile of targets) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, out, 'utf8');
  console.log('built', outFile, Math.round(out.length / 1024) + 'KB');
}
fs.writeFileSync(path.join(root, 'docs', '.nojekyll'), '');
// the game asks for this file to know if a newer version exists
fs.writeFileSync(verFile, JSON.stringify({ version, built }) + '\n', 'utf8');
console.log('version', version, built);

// pwa/ -> docs/: install-as-app files (manifest, offline service worker, icons). Used only on the website.
for (const f of fs.readdirSync(path.join(root, 'pwa'))) {
  fs.copyFileSync(path.join(root, 'pwa', f), path.join(root, 'docs', f));
  console.log('copied', f);
}
