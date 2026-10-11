// Builds side-by-side BEFORE | AFTER images from docs/screenshots/before-*.jpg and after-*.jpg.
//   node docs/make-comparison.mjs     (run from the project folder; uses sharp from the server)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const sharp = createRequire(path.join(import.meta.dirname, '..', 'server', 'package.json'))('sharp');
const dir = path.join(import.meta.dirname, 'screenshots');
const W = 800;
const BAR = 46;

const label = (text, color) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${BAR}">
  <rect width="100%" height="100%" fill="#0b0a14"/>
  <rect x="16" y="11" width="${text.length * 11 + 28}" height="24" rx="12" fill="${color}"/>
  <text x="30" y="28" font-family="Arial" font-weight="bold" font-size="14" fill="#fff">${text}</text></svg>`);

for (const before of fs.readdirSync(dir).filter((f) => f.startsWith('before-'))) {
  const name = before.slice('before-'.length);
  const after = `after-${name}`;
  if (!fs.existsSync(path.join(dir, after))) continue;
  const [b, a] = await Promise.all([before, after].map((f) => sharp(path.join(dir, f)).resize({ width: W }).toBuffer({ resolveWithObject: true })));
  const h = Math.max(b.info.height, a.info.height);
  await sharp({ create: { width: W * 2 + 12, height: h + BAR, channels: 3, background: '#0b0a14' } })
    .composite([
      { input: label('BEFORE', '#52525b'), left: 0, top: 0 },
      { input: label('AFTER - liquid glass + transitions', '#7c3aed'), left: W + 12, top: 0 },
      { input: b.data, left: 0, top: BAR },
      { input: a.data, left: W + 12, top: BAR },
    ])
    .jpeg({ quality: 88 })
    .toFile(path.join(dir, `compare-${name}`));
  console.log(`compare-${name}`);
}
