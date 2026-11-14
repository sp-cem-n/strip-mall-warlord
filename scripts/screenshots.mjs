// Takes the README screenshots from a running `vite preview` (default http://localhost:4173).
// Usage: npm run build && npx vite preview & npm run screenshots  (needs `npx playwright install chromium` once)
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.URL ?? 'http://localhost:4173/';
const out = process.env.OUT ?? 'screenshots/v2';
const shots = [
  ['01-fresh-start.png', '?fresh=1&seed=1991&pause=1'],
  ['02-five-minutes.png', '?fresh=1&seed=1991&advance=300&pause=1'],
  ['03-mid-battle.png', '?fresh=1&seed=1991&advance=300&midbattle=1&pause=1'],
  ['04-twenty-minutes.png', '?fresh=1&seed=1991&advance=1200&midbattle=1&pause=1'],
  ['05-while-you-were-away.png', '?fresh=1&seed=1991&advance=120&away=3600&pause=1'],
];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
for (const [file, query] of shots) {
  await page.goto(base + query);
  await page.waitForSelector('.top');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${file}`, fullPage: true });
  console.log('saved', `${out}/${file}`);
}
await browser.close();
