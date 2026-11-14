// Takes the README screenshots from a running `vite preview` (default http://localhost:4173).
// Usage: npm run build && npx vite preview & npm run screenshots  (needs `npx playwright install chromium` once)
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.URL ?? 'http://localhost:4173/';
const out = process.env.OUT ?? 'screenshots/v4';
const g = '?fresh=1&seed=1991&pause=1';
// [file, query, optional selector to hover]
const shots = [
  ['01-boot-screen.png', `${g}&advance=600&away=5400&screen=boot`],
  ['02-how-to-play.png', `${g}&screen=howto`],
  ['03-story-intro.png', `${g}&screen=story&story=all`],
  ['04-main-five-minutes.png', `${g}&advance=300&walkin=1&screen=game`],
  ['05-rebrand-sample-book.png', `${g}&advance=420&screen=game&book=2`],
  ['06-hover-card.png', `${g}&advance=1200&screen=game`, '.zone.current .weak'],
  ['07-mid-battle.png', `${g}&advance=600&midbattle=1&screen=game`],
  ['08-fresh-game.png', `${g}&screen=game`, '.t-heat'],
];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
for (const [file, query, hover] of shots) {
  await page.goto(base + query);
  await page.waitForSelector('.screen, .root');
  await page.waitForTimeout(query.includes('story') ? 1200 : 500);
  if (hover) {
    await page.hover(hover);
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: `${out}/${file}`, fullPage: true });
  console.log('saved', `${out}/${file}`);
}
await browser.close();
