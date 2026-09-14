/**
 * Renders the dawn, dusk and night frames of "The Beach" from the committed day image, so
 * the dynamic wallpaper can cross-fade between real pictures like a macOS dynamic desktop.
 *
 *   node scripts/wallpapers/beach-variants.mjs            # writes public/wallpapers/the-beach-{dawn,dusk,night}.jpg
 *   node scripts/wallpapers/beach-variants.mjs --out DIR  # somewhere else, e.g. to eyeball the result
 *
 * Runs the pixel work in the Playwright Chromium (a canvas is all it needs), so there is no
 * native image dependency. Point PLAYWRIGHT_CHROMIUM_PATH at a Chromium of a different build
 * when the bundled one is not installed.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DAY = path.join(ROOT, 'public/wallpapers/the-beach.jpg');
const outIdx = process.argv.indexOf('--out');
const OUT_DIR = outIdx > 0 ? path.resolve(process.argv[outIdx + 1]) : path.join(ROOT, 'public/wallpapers');
const QUALITY = 0.86;

/** Runs inside the browser: grades the day image into one variant and returns a JPEG data URL. */
function render({ dataUrl, variant, quality }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('day image failed to decode'));
    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const image = ctx.getImageData(0, 0, W, H);
      const d = image.data;

      const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
      const lerp = (a, b, t) => a + (b - a) * t;
      const smooth = (edge0, edge1, x) => {
        const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
      };
      const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
      /** Colour at t (0..1) along a list of [stop, '#hex'] pairs. */
      const gradient = (stops, t) => {
        let i = 0;
        while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
        const [t0, c0] = stops[i];
        const [t1, c1] = stops[i + 1];
        const k = smooth(t0, t1, t);
        const a = hex(c0);
        const b = hex(c1);
        return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
      };
      const hue = (r, g, b) => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        if (delta === 0) return { h: 0, s: 0, v: max / 255 };
        let h;
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
        return { h, s: delta / max, v: max / 255 };
      };

      // The sea meets the sky at 44.5% of the height; everything blue above that line is sky.
      const HORIZON = Math.round(H * 0.445);
      /** How much of a pixel is open sky (soft mask on hue, saturation and position). */
      const skyMask = (r, g, b, y) => {
        if (y >= HORIZON) return 0;
        const { h, s, v } = hue(r, g, b);
        // The band just above the horizon is pale and nearly white, so the thresholds relax
        // towards it; otherwise a strip of day sky would survive the regrade.
        const near = smooth(HORIZON * 0.7, HORIZON, y);
        const hueOk = smooth(150, 165, h) * (1 - smooth(228, 240, h));
        return hueOk * smooth(0.22 - 0.16 * near, 0.38 - 0.24 * near, s) * smooth(0.4, 0.55, v);
      };
      /** How much of a pixel is sea (teal below the horizon line). */
      const seaMask = (r, g, b, y) => {
        if (y < HORIZON - 4) return 0;
        const { h, s, v } = hue(r, g, b);
        const hueOk = smooth(165, 178, h) * (1 - smooth(215, 230, h));
        return hueOk * smooth(0.3, 0.45, s) * smooth(0.25, 0.4, v);
      };

      // Deterministic pseudo-random so the stars land in the same place every run.
      let seed = 1234567;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      const V = {
        night: {
          sky: [
            [0, '#040a1f'],
            [0.5, '#0a1a3d'],
            [1, '#123a5a'],
          ],
          grade(r, g, b) {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const r1 = lerp(r, lum, 0.5);
            const g1 = lerp(g, lum, 0.5);
            const b1 = lerp(b, lum, 0.5);
            return [r1 * 0.2 + 4, g1 * 0.27 + 8, b1 * 0.5 + 26];
          },
          sea: [8, 26, 58],
          seaMix: 0.55,
          stars: true,
          moon: { x: 0.2, y: 0.17, r: 0.019, glow: 0.11 },
        },
        dusk: {
          sky: [
            [0, '#221d5c'],
            [0.32, '#5b3a86'],
            [0.62, '#c85a7a'],
            [0.84, '#f08a52'],
            [1, '#ffc25a'],
          ],
          grade(r, g, b) {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const r1 = lerp(r, lum, 0.15);
            const g1 = lerp(g, lum, 0.15);
            const b1 = lerp(b, lum, 0.15);
            return [r1 * 0.86 + 6, g1 * 0.64 + 2, b1 * 0.56 + 10];
          },
          sea: [48, 38, 96],
          seaMix: 0.62,
          sun: { x: 0.36, y: 0.445, r: 0.24, colour: [255, 170, 90], strength: 0.6 },
        },
        dawn: {
          sky: [
            [0, '#3c4a86'],
            [0.4, '#8a7fb4'],
            [0.72, '#efa9b6'],
            [1, '#ffd8a8'],
          ],
          grade(r, g, b) {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const r1 = lerp(r, lum, 0.2);
            const g1 = lerp(g, lum, 0.2);
            const b1 = lerp(b, lum, 0.2);
            return [r1 * 0.9 + 10, g1 * 0.82 + 8, b1 * 0.92 + 14];
          },
          sea: [96, 88, 140],
          seaMix: 0.5,
          sun: { x: 0.5, y: 0.445, r: 0.2, colour: [255, 214, 170], strength: 0.3 },
        },
      }[variant];

      const stars = [];
      if (V.stars) {
        for (let i = 0; i < 520; i++) {
          const x = Math.floor(rand() * W);
          // Denser towards the top of the sky, thinning out to the horizon.
          const y = Math.floor(Math.pow(rand(), 1.6) * HORIZON * 0.95);
          const i0 = (y * W + x) * 4;
          if (skyMask(d[i0], d[i0 + 1], d[i0 + 2], y) < 0.85) continue;
          stars.push({ x, y, b: 0.35 + rand() * 0.65, big: rand() < 0.12 });
        }
      }

      for (let y = 0; y < H; y++) {
        const ty = y / HORIZON;
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          let [nr, ng, nb] = V.grade(r, g, b);

          const sky = skyMask(r, g, b, y);
          if (sky > 0) {
            const sc = gradient(V.sky, ty);
            nr = lerp(nr, sc[0], sky);
            ng = lerp(ng, sc[1], sky);
            nb = lerp(nb, sc[2], sky);
          }
          const sea = seaMask(r, g, b, y);
          if (sea > 0) {
            // The water picks up the sky: mix towards the sea tint, darker away from the horizon.
            const depth = smooth(HORIZON, H * 0.62, y);
            const k = sea * V.seaMix * (0.55 + 0.45 * depth);
            nr = lerp(nr, V.sea[0], k);
            ng = lerp(ng, V.sea[1], k);
            nb = lerp(nb, V.sea[2], k);
            if (V.sun) {
              // Sun glitter under the sun, fading with depth.
              const dx = (x - V.sun.x * W) / (V.sun.r * W);
              const glit = Math.max(0, 1 - dx * dx) * (1 - depth) * 0.5 * V.sun.strength * sea;
              nr += V.sun.colour[0] * glit;
              ng += V.sun.colour[1] * glit;
              nb += V.sun.colour[2] * glit;
            }
          }
          if (V.sun && y < HORIZON + 6) {
            // A low sun: additive glow on the sky only, strongest at the horizon.
            const dx = (x - V.sun.x * W) / (V.sun.r * W);
            const dy = (y - V.sun.y * H) / (V.sun.r * H * 0.7);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const glow = Math.max(0, 1 - dist) ** 2 * V.sun.strength * (0.35 + 0.65 * sky);
            nr += V.sun.colour[0] * glow;
            ng += V.sun.colour[1] * glow;
            nb += V.sun.colour[2] * glow;
          }
          if (V.moon) {
            const dx = x - V.moon.x * W;
            const dy = y - V.moon.y * H;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rad = V.moon.r * W;
            if (dist < rad * 6 && sky > 0) {
              const disc = 1 - smooth(rad - 1.5, rad + 1.5, dist);
              const halo = Math.max(0, 1 - dist / (rad * 6)) ** 2 * V.moon.glow;
              const k = Math.min(1, disc * 0.95 + halo) * sky;
              nr = lerp(nr, 236, k);
              ng = lerp(ng, 240, k);
              nb = lerp(nb, 250, k);
            }
          }
          d[i] = clamp(nr);
          d[i + 1] = clamp(ng);
          d[i + 2] = clamp(nb);
        }
      }

      for (const s of stars) {
        const put = (x, y, k) => {
          if (x < 0 || y < 0 || x >= W || y >= H) return;
          const i = (y * W + x) * 4;
          d[i] = clamp(d[i] + 235 * k);
          d[i + 1] = clamp(d[i + 1] + 238 * k);
          d[i + 2] = clamp(d[i + 2] + 255 * k);
        };
        put(s.x, s.y, s.b);
        if (s.big) {
          put(s.x + 1, s.y, s.b * 0.5);
          put(s.x - 1, s.y, s.b * 0.5);
          put(s.x, s.y + 1, s.b * 0.5);
          put(s.x, s.y - 1, s.b * 0.5);
        }
      }

      ctx.putImageData(image, 0, 0);
      // Mean brightness of the strip behind the menu bar, so the shell knows which text colour to use.
      let sum = 0;
      for (let y = 0; y < 40; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }
      resolve({ url: canvas.toDataURL('image/jpeg', quality), topLuma: sum / (40 * W) });
    };
    img.src = dataUrl;
  });
}

async function main() {
  const day = await readFile(DAY);
  const dataUrl = `data:image/jpeg;base64,${day.toString('base64')}`;
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
  );
  try {
    const page = await browser.newPage();
    await mkdir(OUT_DIR, { recursive: true });
    for (const variant of ['dawn', 'dusk', 'night']) {
      const { url, topLuma } = await page.evaluate(render, { dataUrl, variant, quality: QUALITY });
      const file = path.join(OUT_DIR, `the-beach-${variant}.jpg`);
      const bytes = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
      await writeFile(file, bytes);
      console.log(`${path.relative(ROOT, file)}  ${(bytes.length / 1024).toFixed(0)} KB  top strip luma ${topLuma.toFixed(0)}/255`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
