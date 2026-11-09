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

const out = src
  .replace('/*GSAP_INLINE*/', () => gsap)
  .replace('/*FONT_B64*/', () => font);

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
