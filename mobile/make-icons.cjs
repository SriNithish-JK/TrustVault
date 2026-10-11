// Draws the Android launcher icons and splash screens from the site's icon.  node mobile/make-icons.cjs
const path = require('node:path');
const sharp = require(path.join(__dirname, '..', 'server', 'node_modules', 'sharp'));

const icon = path.join(__dirname, '..', 'client', 'public', 'icon-512.png');
const res = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const black = { r: 0, g: 0, b: 0, alpha: 1 };
const clear = { r: 0, g: 0, b: 0, alpha: 0 };
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

// The icon centred on a canvas: `share` is how much of the shorter side it covers.
const centred = async (w, h, share, background) => {
  const size = Math.round(Math.min(w, h) * share);
  const logo = await sharp(icon).resize(size, size).png().toBuffer();
  return sharp({ create: { width: w, height: h, channels: 4, background } }).composite([{ input: logo }]).png();
};

(async () => {
  for (const [name, scale] of Object.entries(DENSITIES)) {
    const dir = path.join(res, `mipmap-${name}`);
    const legacy = Math.round(48 * scale);
    await (await centred(legacy, legacy, 1, black)).toFile(path.join(dir, 'ic_launcher.png'));
    await (await centred(legacy, legacy, 1, black)).toFile(path.join(dir, 'ic_launcher_round.png'));
    // Adaptive icon: 108dp canvas, only the middle 66dp is always visible.
    const adaptive = Math.round(108 * scale);
    await (await centred(adaptive, adaptive, 0.6, clear)).toFile(path.join(dir, 'ic_launcher_foreground.png'));
    await (await centred(Math.round(320 * scale), Math.round(480 * scale), 0.3, black)).toFile(path.join(res, `drawable-port-${name}`, 'splash.png'));
    await (await centred(Math.round(480 * scale), Math.round(320 * scale), 0.3, black)).toFile(path.join(res, `drawable-land-${name}`, 'splash.png'));
  }
  await (await centred(480, 320, 0.3, black)).toFile(path.join(res, 'drawable', 'splash.png'));
  console.log('Android icons and splash screens written.');
})();
