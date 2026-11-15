// Multi-size v0.9 screenshots from a running `vite preview`.
// Usage: OUT=screenshots/v9 URL=http://localhost:4179/ node scripts/screenshots.mjs
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.URL ?? 'http://localhost:4173/';
const outRoot = process.env.OUT ?? 'screenshots/v9';
const sizes = [
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
  [390, 844],
];
const g = '?fresh=1&seed=1991&pause=1';
const room = `${g}&advance=3600&room=full&screen=room`;
const bar = `${g}&roster=full&region=1&room=full&screen=room`;
const cab = (i) => [['click', `.cab:nth-child(${i}) .cab-plate .btn.hot`], ['wait', 800]];

// [file, query, steps, clip?]
const shots = [
  ['01-title', `${g}&advance=900&away=5400&oldsave=1&screen=boot`],
  ['02-early-plaza', `${g}&advance=900&walkin=1&midbattle=1&screen=game`],
  ['03-receipt-open', `${g}&advance=2400&screen=game`, [['click', '.printer-head']]],
  ['04-walk-up', `${g}&advance=900&walkup=1&screen=game`],
  ['05-roster-popup', `${g}&advance=5400&active=1&screen=game`, [['click', 'canvas.field']]],
  ['06-plaza-pylons', `${g}&advance=5400&screen=game`],
  ['07-arcade', room],
  ['08-arcade-pusher', room, [...cab(1), ['wait', 900]], '.cab:nth-child(1)'],
  ['14-bar', bar],
  ['19-win-card', `${g}&roster=full&win=1&screen=game`],
  ['20-test-panel', `?test=1&${g.slice(1)}&advance=5400&screen=game`],
  ['21-top-bar', `${g}&advance=5400&screen=game`, [], '.roadside'],
  ['22-top-bar-arcade', room, [], '.roadside'],
  ['23-top-bar-bar', bar, [], '.roadside'],
  ['24-back-office', `${g}&advance=7200&screen=game`, [['click', 'text=Back Office'], ['wait', 300]]],
  ['25-howto', `${g}&screen=howto`],
];

const browser = await chromium.launch();
let errors = 0;
for (const [w, h] of sizes) {
  const out = `${outRoot}/${w}x${h}`;
  mkdirSync(out, { recursive: true });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => (errors++, console.error('pageerror', e.message)));
  page.on('console', (m) => m.type() === 'error' && (errors++, console.error('console', m.text())));
  for (const [file, query, steps = [], clip] of shots) {
    await page.goto(base + query);
    await page.waitForSelector('.screen, .root');
    await page.waitForTimeout(500);
    for (const [kind, sel, arg] of steps) {
      if (kind === 'wait') await page.waitForTimeout(sel);
      else if (kind === 'hover') await page.hover(sel);
      else if (kind === 'click') {
        const loc = page.locator(sel).first();
        if (await loc.count()) await loc.click({ timeout: 4000 }).catch((e) => console.error('click fail', file, sel, e.message));
      } else if (kind === 'hold' || kind === 'drag') {
        const b = await page.locator(sel).boundingBox();
        if (!b) continue;
        if (kind === 'hold') {
          await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(arg);
          await page.mouse.up();
        }
      }
      await page.waitForTimeout(150);
    }
    const dest = `${out}/${file}.png`;
    if (clip) {
      const loc = page.locator(clip).first();
      if (await loc.count()) await loc.screenshot({ path: dest });
      else await page.screenshot({ path: dest, fullPage: true });
    } else await page.screenshot({ path: dest, fullPage: false });
    console.log('saved', dest);
  }
  await page.close();
}
await browser.close();
if (errors) (console.error(`${errors} page errors`), process.exit(1));
