// Builds the PNG icons and the link-preview image from client/public/favicon.svg.
// Run: node scripts/make-icons.cjs   (uses sharp from the server's node_modules)
const fs = require('fs');
const path = require('path');
const sharp = require(require.resolve('sharp', { paths: [path.join(__dirname, '..', 'server')] }));

const pub = path.join(__dirname, '..', 'client', 'public');
const mark = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8');
const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace('</svg>', '');

// App icon: the mark on a black tile with a soft neon glow (phones add their own rounded corners).
const tile = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <defs><radialGradient id="bg" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#1a1440"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
  <rect width="64" height="64" fill="url(#bg)"/>
  <g transform="translate(9.6 9) scale(0.7)">${inner}</g>
</svg>`;

// Link preview (Open Graph) image, 1200 x 630.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="a" cx="0.1" cy="0.05" r="0.8"><stop offset="0" stop-color="#19e6ff" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="0.95" cy="0.9" r="0.8"><stop offset="0" stop-color="#b56bff" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="#19e6ff"/><stop offset="0.6" stop-color="#b56bff"/><stop offset="1" stop-color="#ff4fd8"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#000"/><rect width="1200" height="630" fill="url(#a)"/><rect width="1200" height="630" fill="url(#b)"/>
  <g transform="translate(110 150) scale(5)">${inner.replace(/id="g"/g, 'id="og"').replace(/url\(#g\)/g, 'url(#og)')}</g>
  <text x="470" y="300" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="104" font-weight="800" fill="#f5f5f7" letter-spacing="-3">Trust<tspan fill="url(#t)">Vault</tspan></text>
  <text x="474" y="368" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="30" fill="#a1a1b5">Encrypted document vault, instantly verified</text>
  <text x="474" y="436" font-family="JetBrains Mono, Consolas, monospace" font-size="21" font-weight="600" fill="#19e6ff" letter-spacing="2">AES-256 · AUTHENTICATOR · HASH LEDGER</text>
</svg>`;

(async () => {
  const out = (name) => path.join(pub, name);
  await sharp(Buffer.from(tile(180))).png().toFile(out('apple-touch-icon.png'));
  await sharp(Buffer.from(tile(192))).png().toFile(out('icon-192.png'));
  await sharp(Buffer.from(tile(512))).png().toFile(out('icon-512.png'));
  await sharp(Buffer.from(og)).png().toFile(out('og-image.png'));
  console.log('Icons written to client/public');
})();
