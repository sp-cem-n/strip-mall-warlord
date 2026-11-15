// Takes the README screenshots from a running `vite preview` (default http://localhost:4173).
// Usage: npm run build && npx vite preview & npm run screenshots  (needs `npx playwright install chromium` once)
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.URL ?? 'http://localhost:4173/';
const out = process.env.OUT ?? 'screenshots/v7';
const g = '?fresh=1&seed=1991&pause=1';
const room = `${g}&advance=3600&room=full&screen=room`;
const bar = `${g}&roster=full&region=1&room=full&screen=room`;
// a cabinet: the Play button puts a quarter in, then the READY beat
const cab = (i) => [['click', `.cab:nth-child(${i}) .cab-plate .btn.hot`], ['wait', 800]];
// [file, query, steps: ['click' | 'hover', selector] | ['wait', ms] | ['drag', selector, [x0, y0, x1, y1] in art px], clip selector?]
const shots = [
  ['01-title.png', `${g}&advance=900&away=5400&oldsave=1&screen=boot`],
  ['02-early-game-back-office.png', `${g}&advance=900&walkin=1&midbattle=1&screen=game`],
  ['03-receipt-history-open.png', `${g}&advance=2400&screen=game`, [['click', '.printer-head']]],
  ['04-lineup-and-slots.png', `${g}&advance=5400&active=1&screen=game`, [['hover', '.slots']]],
  ['05-patrol-on-the-lot-sign.png', `${g}&advance=5400&screen=game`, [['hover', '.zone.current .auto']]],
  ['05b-smoke-break.png', `${g}&advance=900&smoke=1&screen=game`],
  ['05c-next-group-walks-in.png', `${g}&advance=900&walkup=1&screen=game`],
  ['06-combat-spread-hits.png', `${g}&advance=7200&midbattle=1&screen=game`],
  ['07-arcade.png', room],
  ['08-arcade-coin-pusher.png', room, [...cab(1), ['wait', 900]], '.cab:nth-child(1)'],
  ['09-arcade-whac.png', room, [...cab(2), ['wait', 1500]], '.cab:nth-child(2)'],
  ['10-arcade-skee-ball.png', room, [...cab(3), ['hold', '.cab:nth-child(3) canvas', 500]], '.cab:nth-child(3)'],
  ['11-arcade-claw.png', room, [...cab(4), ['wait', 600]], '.cab:nth-child(4)'],
  ['12-arcade-pinball.png', room, [...cab(5), ['wait', 1200]], '.cab:nth-child(5)'],
  ['13-arcade-cyclone.png', room, [...cab(6), ['wait', 300]], '.cab:nth-child(6)'],
  ['14-bar.png', bar],
  ['15-bar-darts.png', bar, [...cab(1), ['click', '.cab:nth-child(1) canvas'], ['wait', 300], ['click', '.cab:nth-child(1) canvas']], '.cab:nth-child(1)'],
  ['16-bar-pool.png', bar, [...cab(2), ['drag', '.cab:nth-child(2) canvas', [39, 82, 41, 96]], ['wait', 450]], '.cab:nth-child(2)'],
  ['17-bar-video-poker.png', bar, [...cab(3), ['click', '.cab:nth-child(3) canvas']], '.cab:nth-child(3)'],
  ['18-bar-shuffleboard.png', bar, [...cab(5), ['hold', '.cab:nth-child(5) canvas', 700], ['wait', 600], ['hold', '.cab:nth-child(5) canvas', 400]], '.cab:nth-child(5)'],
  ['18b-bar-foosball.png', bar, [...cab(4), ['wait', 1500]], '.cab:nth-child(4)'],
  ['18c-bar-trivia.png', bar, [...cab(6), ['wait', 400]], '.cab:nth-child(6)'],
  ['20-test-mode-panel.png', `?test=1&${g.slice(1)}&advance=5400&screen=game`],
  ['21-top-bar-arcade-door.png', `${g}&advance=5400&screen=game`, [], '.roadside'],
  ['19-win-card.png', `${g}&roster=full&win=1&screen=game`],
];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
let errors = 0;
page.on('pageerror', (e) => (errors++, console.error('pageerror', e.message)));
page.on('console', (m) => m.type() === 'error' && (errors++, console.error('console', m.text())));
for (const [file, query, steps = [], clip] of shots) {
  await page.goto(base + query);
  await page.waitForSelector('.screen, .root');
  await page.waitForTimeout(500);
  for (const [kind, sel, arg] of steps) {
    if (kind === 'wait') await page.waitForTimeout(sel);
    else if (kind === 'hover') await page.hover(sel);
    else if (kind === 'click') await page.click(sel, { position: undefined });
    else {
      const b = await page.locator(sel).boundingBox();
      if (kind === 'hold') {
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(arg);
        await page.mouse.up();
      } else {
        // art px inside the tall screen (9, 25) at 3x
        const at = (x, y) => [b.x + (9 + x) * 3, b.y + (25 + y) * 3];
        await page.mouse.move(...at(arg[0], arg[1]));
        await page.mouse.down();
        await page.mouse.move(...at(arg[2], arg[3]), { steps: 6 });
        await page.mouse.up();
      }
    }
    await page.waitForTimeout(150);
  }
  if (clip) await page.locator(clip).screenshot({ path: `${out}/${file}` });
  else await page.screenshot({ path: `${out}/${file}`, fullPage: true });
  console.log('saved', `${out}/${file}`);
}
await browser.close();
if (errors) (console.error(`${errors} page errors`), process.exit(1));
