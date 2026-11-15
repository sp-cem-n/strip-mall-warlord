# v0.9 progress

Last updated: 15 Nov 2026, about 4:40 AM America/New_York (P1 chunk: logos, flicker, roster full-field, M1+M2 to main).

Worktree: `/workspace/smw-v09` on branch `v09`. Commit author is always Josh Durbin `<149157950+sp-cem-n@users.noreply.github.com>`. Do not work in `/workspace/strip-mall-warlord` (still on `v09-polish`). Mockups live only on this machine at `/workspace/smw-mockups/v09/` and `/workspace/smw-mockups/v09b/`, plus `/workspace/smw-mockups/minigames/`.

Josh authorized a live push: "you have the go ahead to push everything live, let me know when everything is done w link." Report to him only when M1–M4 are done, with the live URL, the `/v0.9/` archive URL, hashes, a change list by milestone, check results, cuts, and 6–8 screenshot paths. Mid-milestone user pings should not become a status dump.

Usage was tight as of this writing. If the run is cut off, resume from this file. Push meaningful chunks to `origin/v09` often. After a milestone passes `bun scripts/check.ts` (including the pre-dawn leak grep), `bun scripts/balance.ts --guard`, and multi-size screenshots, merge to `main` and push so GitHub Pages goes live. Never push a failing build. After M4: bump `package.json` to `0.9.0`, tag `v0.9`, push the tag (archive at `https://sp-cem-n.github.io/strip-mall-warlord/v0.9/`). `SAVE_VERSION` stays 5.

Plans: `docs/V09_POLISH.md` (b8de1e9) and `docs/V09_BYPASS.md` (45f76d3), already merged into `v09` / `main`. Cost Deep Dive: `https://cursor.com/canvas/store-2a58db62-021e-466c-b74f-238b407050e2/58052c0f-aa31-4be5-aa23-62c86ab08741`.

---

## Live now (M1 + M2 + P1 polish)

- Live: https://sp-cem-n.github.io/strip-mall-warlord/ — `main` = see git log (merge of `v09` after the P1 chunk). Package still **0.8.0**; no tag until M4.
- P1 chunk (on top of the M2 commits):
  - Fun Zone logo = Toad's neon script (v09e option B) as four layered PNGs (`src/art/fz-base.png` dead tubes + props, `fz-fun`, `fz-zone`, `fz-line`); generator `/workspace/smw-mockups/v09g/fzlayers.py`. `FZ_LOGO` in `ui/art.ts`, `.fz-logo` in styles.
  - Off-Ramp logo = Toad's neon matchbook (v09f C2, Josh approved) with the striker shortened and kept clear of CLOSE COVER BEFORE STRIKING: `src/art/bar-logo.png`, generator `/workspace/smw-mockups/v09g/orlogo.py`. Old procedural Fun Zone / Off-Ramp logo code deleted from `art/logos.ts` (only `starsTile` left).
  - `ui/lights.ts`: three separate schedules. Plaza tubes (ray + dead shop tubes). WARLORD letters (`signOut.mask`, `titleSign(ray, outMask)`): one at a time, ≤2 dark, always sputter out and sputter back. Fun Zone (`fzOff`): FUN / ZONE / underline blinks, 40% hang dark 2–5s, always ends lit; 12% of events are a ~10s tantrum. `?lights=still&signout=MASK&fzoff=zone` freezes for screenshots; `?lights=fast` for testing. The O is no longer permanently dark (boot scene at dawn still darkens it).
  - Roster full field: `fieldFull` / `slotSources` in `game/economy.ts`, red FIELD FULL strip in the popup (`.roster-full`, auto-clears 6s, click dismisses). Lists only sources still available (Route 9: Back Office Goodwill buys, Fun Zone prize counter; Bypass strings in `DAWN.slotWhere`). Maxed (≥ MAX_SLOTS or nothing left) = just "Bench someone first." Two new checks.
  - Guard fix: the M2 Coin Pusher pile (`tickPusher`) was drawing from the game's seeded `rand(s)`, which shifted every fight roll and broke `--guard` (Phase II 14 tries, Outlet 13, losses 10%). The pile now has its own RNG (`pileRand`, `room.pusher.rng`). Guard is back to the M1 numbers below.
- Save popup: the top-right ✕ (redundant with the sign click) is now a floppy (`.boot-door.save`, inline SVG in `Pylon.tsx`) that opens `SavePopup` (`Screens.tsx`, `app.savePop`, Esc closes) with the same `SaveBox`: selectable code textarea (select-on-focus), Copy, Load. Boot screen keeps its box. Back Office has no lease code. Shot: `screenshots/v9/<size>/32-save-popup.png`. `scripts/screenshots.mjs` takes `ONLY=regex`.
- Battle hand-off (visual only, `ui/Field.tsx` `trails`): the one regroup tick between two fights keeps drawing the last fight (no blink), a group that was waiting in line steps up from its line spot over `STEP_UP` 0.6s instead of popping in, and the last group's fallen finish fading. Sim / battle timing untouched (guard unchanged).
- P2 chunk 1: Shuffleboard is `ui/shuffle.ts` (`shuffleV2`): 2.5D lane, real puck physics (`slide`, collisions, gutters, off the end), you throw 6 blue, the house (next unbeaten `BAR_HOUSE` name) throws 3 red and goes after your best puck; aim by mouse / A/D / arrows, hold or Space for power on a visible meter; only your pucks score (q = score / SHUFFLE_TOP as before). Old flat `shuffle()` deleted from `machines.ts`. Foosball (`bargames.ts`): 2.5D perspective table, A/D/arrows slide your rods, Space / W / Up shoots, tap still works. `GameRoom` forwards Space / W / Up too (repeat ignored). Checks: a measured throw parks in the 3; a hard red throw knocks it out. Shots `33-bar-foos-play`, `34-bar-shuffle-play`. Darts / pool / poker / trivia 2.5D not redone yet.
- P2 chunk 2: three new bar games in `ui/bar3.ts`, registered in `room.ts` MACHINES (bar now 9, check updated), `GameRoom` LOOKS, `machines.ts` newGame, `debug.ts` room=full. Pull-Tabs (`tabs`, with the Off-Ramp lease, 6s rent, pays 18× rent × q; three tickets, three windows, 3-alike wins; keys 1/2/3/Space), Blackjack (`blackjack`, Corporate Campus fight 4, 20s rent; win 2.2×, blackjack 3.5×, push 1×; H/S or tap HIT/STAND), Fairway 9 (`fairway`, Town Center Phase II fight 4, 20s rent, Equity winPay×7×q; nine fixed holes, par 18, water +1, pick up after 3; aim by mouse or A/D, hold/Space for power). Not in the official bot's BAR_MIX (Bypass pacing re-check is M4). Grapevine drops not wired yet. Shots `35-bar-tabs`, `36-bar-blackjack`, `37-bar-fairway`.
- Known, not fixed: at 390×844 the top bar is wider than the screen (receipt / LED board scroll off to the right), same as before.
- `bun scripts/check.ts`: all good, including leak checks.
- `bun scripts/balance.ts --guard` (Route 9 15h±1; CI 14–16h, active 11–15.5h, losses 10–30%, frontier ≤50%, boss tries ≤12):

  | seed | mode     | Route 9 | losses |
  |------|----------|---------|--------|
  | 1991 | check-in | 15h 55m | 17%    |
  | 1991 | active   | 15h 29m | 19%    |
  | 7    | check-in | 14h 50m | 16%    |
  | 7    | active   | 14h 37m | 15%    |

- New screenshots: `screenshots/v9/<size>/29-roster-full.png`, `30-sign-letters-out.png`, `31-funzone-zone-off.png`, `23-top-bar-bar.png`.

## Next (P2, in order; push live after each checked chunk)

1. (done: shuffleboard + foosball; darts/pool/poker/trivia 2.5D still open, low priority). 2. (done) Pull-Tabs, Blackjack, Fairway 9. 3. Grapevine rumor slips (strings in `dawn.ts`). 4. Hotkeys in How to Play. 5. High-stakes tables. 6. Trivia batches toward 1,200+. Then P3 = M4 Bypass, bump 0.9.0, tag v0.9.

---

## M1 change list (shipped)

- Fun Zone opens at Parking Lot fight 7 (zone 0, fight index 6) for $20,000, same fight as the Vape Shop. In `SHOP_LIST` it sits after Vape. The lease-order check now allows a tie (`>=`). Coin Pusher still opens on the lease; Whac still wants Big-Box captured.
- Pylons flex to close the gap at 1280×800, 1366×768, 1440×900, 1920×1080, and 390×844 portrait. Receipt tear is inside the paper padding. Cash pop is anchored over the value, not the rate.
- Rates: cash/tickets over 5s, Goodwill/Equity over 60s. Display `/m` below 1/s, `/s` at ≥1.5/s, hold in the 1.0–1.5 band (`rateLabel` in `src/game/rates.ts`).
- Room top bars drop street posts. Fun Zone and Off-Ramp use logos from `src/art/logos.ts` (Off-Ramp title is passed from `DAWN` so `logos.ts` stays leak-safe). Plaza top bar has a night sky (`--stars`).
- Next group walks up during the current fight (`Crew.queueEnter`). Only a smoke break clears the line. A clean win starts with whatever walk is left (often 0).
- Roster is a modal popup (`src/ui/Roster.tsx`), not a full screen. Click the lot or press R. Esc closes. Rebuilt on `v09` to match Toad's mockup (Josh's reference): steel-bevel "THE LOT" header with fight / lot / tells, ON THE FIELD count and a red X; 3×3 fighter cards with portrait, role, large DPS, HP bar, DMG / EVERY, FIELD|BENCH (benched cards dim and stamp BENCH); right column ON THE CURB with lilac effect chips; totals strip; AUTO + hint + "ESC to close". Footer and totals stay pinned when the grid scrolls. Stacks and scrolls as one column at 390×844. Leak-safe. Checked at 1280×800 and 390×844 (`screenshots/v9/review/roster-mid-1280x800.png`, `roster-full-1280x800.png`, `roster-mid-390x844.png`, `roster-mid-390x844-bottom.png`).
- Attract Mode is 5 / 3 / 2 minutes (`ATTRACT_EVERY` `[0, 300, 180, 120]`) and queues a visible play (`room.attracting`) at 0.4 skill, then `endPlay`. Cabinets get `.cab.attracting`.
- Title screen uses the starburst (`titleSign` blit in `bootScene`, logo on the tenant-board menu).
- Lease codes: prefix `SMW1.`, base64url of the JSON, confirm before overwrite (`exportCode` / `importCode` in `src/game/save.ts`). UI is `SaveBox` on the boot menu and in the Back Office. v0.8 saves still migrate; `SAVE_VERSION` is 5.
- Plaza cash sinks in `src/game/sinks.ts` / Back Office: consultants (20 min of rent, after the next lot is captured), auto-reno (45 min, once the consultant is hired, at most one shop every 10s if the till can cover it twice), landmarks (billboard / tower / pylon at 30 / 50 / 90 min after lots 1 / 2 / 4), retainers (20 min ×1.5^n, from lotsTaken ≥3), permanent stacking blitzes (radio / paper / banner). The official bot does not buy these.
- How to Play mentions the door, click-the-lot roster, and lease codes. Leak-safe.
- Test panel: +1h rent is on the viewed road; +Asphalt; Trigger flicker; +Equity only after dawn via `DAWN.equity` (no literal). Arcade/plaza toggle removed. Autoplay starts a visible attract play.
- `triggerFlicker()` in `src/ui/lights.ts`.

### Bot / pacing retunes (keep these)

The official bot must **not** freeze renovations to save $20K the moment Fun Zone appears at fight 7. That stretched check-in Route 9 to 17–18h.

- Fun Zone is excluded from the cheap-first lease loop and from `pending` (so it does not cap renovations).
- The bot leases it only once `lotsTaken(s, 0) >= 2` (Big-Box captured, i.e. Outlet is open) and cash covers the lease. Players can still buy it at fight 7.
- After a patrolled boss has failed twice, `sim.ts` auto-pops overtime if the till can pay (`tries >= 2`, `autoCovers`, `overtime === 0`). Check-in only acts every 10 minutes, so without this, Outlet could rack 14 boss tries in one gap. Active mode already popped overtime from the bot.
- Exit 14 opening jump: `LOT_JUMP[1][0]` is **1.9** (was 2) in `src/game/knobs.ts`. Needed so seed 7 check-in Exit 14 frontier loss stays ≤50% after the overtime change. Do not revert casually; re-run `--guard`.

### Screenshots

Multi-size set at `screenshots/v9/{1280x800,1366x768,1440x900,1920x1080,390x844}/`. Script: `scripts/screenshots.mjs` (URL / OUT env). Best ones for a later report:

- `screenshots/v9/1280x800/01-title.png`
- `screenshots/v9/1280x800/03-receipt-open.png`
- `screenshots/v9/1280x800/05-roster-popup.png`
- `screenshots/v9/1280x800/06-plaza-pylons.png`
- `screenshots/v9/1280x800/07-arcade.png`
- `screenshots/v9/1280x800/22-top-bar-arcade.png`
- `screenshots/v9/1280x800/24-back-office.png`
- `screenshots/v9/1920x1080/01-title.png`

The boot screen is a flex column so the lease-code box stays on-screen at 1280×800 (scene shrinks with `object-fit: contain`). Back Office sinks are in the sticky right column (scroll that pane).

---

## M2 in progress (ticket economy landed; cabinets next)

Ticket economy is on local / `origin/v09` (not merged to main):

- Skee typical payout is 28+60q (70 tickets at 70% skill); jackpot stays 140.
- Coin Pusher sometimes drops an 8–20 ticket token.
- Pre-dawn shelf is 9 items; first prize is the House mug at 250 tickets; mid prizes in the mid hundreds; the second fighter slot stays 5,000.
- After dawn, a back-room shelf in `dawn.ts` (Bypass slot and doorbell, longer claw buffs, souvenir shot glass).
- `roomAct` buys the cheapest affordable prize, including after a visit's plays. Official `--guard` still does **not** pass `--room` (a modest official Skee habit bought power perks and pulled Route 9 well under target). Acceptance is a `--room` check-in: a first prize within 2h of Skee. `bun scripts/check.ts` and `--guard` both pass; Route 9 times match the earlier M1 guard.

Fun Zone 2.5D cabinets and YOU WON slips are also on `origin/v09`:

- Coin Pusher: 3-coin drops, persistent `room.pusher` field (save-migrates, no SAVE_VERSION bump), bonus hole, hopper timer, coin tower, visible Rent Check; the hidden 8% roll is gone. The pile ticks while you are away.
- Whac-a-Shoplifter: a flat 3×3 brick slab; beanie+sack bandits vs basket shoppers.
- Claw: five toys on their own spots with floor gaps; hover to read the prize; centered grabs hold, off-center slips on the lift, a gap is a miss. `pay()` trusts the visible result when a toy is picked.
- Night Shift: time-clock ramp (20s 2× and a short multiball), standup targets, flippers on A/D, arrows, and click/tap.
- YOU WON slip: a dimmed sodium card on the cabinet when the play pays (cash over cost, 20+ tickets, a toy, or a big win). Click or any key dismisses; it auto-clears at 2.8s.

Off-Ramp 2.5D and arcade high-stakes tables stay M3. Logos are picked and shipped (see top). Review shots: `screenshots/v9/review/funzone-*-1280x800.png`.

## Not done (M2 cabinets, then M3 → M4)

M3 and M4 have not been implemented. M2 ticket economy + Fun Zone cabinets are in; high-stakes arcade tables can land with M3. `package.json` is still 0.8.0. There is no `v0.9` tag and no `/v0.9/` archive.

### M2 — Fun Zone 2.5D, ticket economy, arcade high-stakes

Read items 12, 14–17 in `docs/V09_POLISH.md`. Mockups: `/workspace/smw-mockups/v09b/` (whac-v2, pusher-v2, claw-v2, pinball-v2, prize counters pre/post dawn) and `/workspace/smw-mockups/minigames/`. Play code is `src/ui/machines.ts`; payouts and `PERKS` are in `src/game/room.ts`.

Ticket economy (acceptance: official cadences should buy a first prize after Skee opens; today tickets never reach 1,200 in 24h on check-in):

- Raise typical Skee payout (jackpot can stay 140). Let the Coin Pusher drop a ticket token sometimes.
- First shelf item should be 200–400 tickets; mid prizes in the mid hundreds; the 5,000-ticket second slot can stay late.
- Flesh the pre-dawn shelf to about 8–10 items (keep slots, overtime, doorbell; add cheap openers). After dawn, a second shelf on the same counter (Bypass slot, Bypass doorbell, longer claw buffs, maybe a Grapevine souvenir). Post-dawn names must live in `dawn.ts` (leak grep).
- Fix official bot buy order in `roomAct`: it currently walks `PERKS` in object order and **breaks after the first unsold slot**, hoarding for the 5,000-ticket slot. Buy what is affordable (cheapest first).
- Delete the Route 9-only claw / toy gate. `grant()` in `room.ts` still applies rally and the gold watch to `s.crews[0]` — use the crew that is actually fighting (`s.view`). Night Shift’s Goodwill board can stay Route 9.
- Re-run `--guard` after the income retune. Official `--guard` does **not** pass `--room`, so the bot may need a little room time once Skee is open, or the acceptance test should be a `--room` cadence plus a check. Do not flatten Big-Box / Outlet.

Coin Pusher (item 15): a play is 3–5 coins, not one; positions persist in `room.pusher` (save-migrate, do not bump `SAVE_VERSION`); bonus hole / ticket token and a timed shelf drop; a coin tower; the Rent Check is a real coin, not a hidden 8% roll. Blurb still says “One coin a game.”

Claw (item 16): hover a toy for its reward; negative space in the bin; misses are possible (especially at Attract 0.4 skill); toys can slip on the way up; slower restock.

Pinball / Night Shift (item 17): richer playfield (ramps, standups, lanes, a short mode / multiball around the time-clock ramp). Flippers on A/D, arrows, and click/tap. Payout stays Goodwill by score.

Whac (item 14): flatten the depth; Toad’s v2 is a shallower counter / cabinet face, not a long aisle. Keep “read the turn.”

Arcade high-stakes tables were part of the decided cash-sink set (bot must not buy them). Design is in the polish doc item 28; they can land with M2 or M3.

YOU WON slips (item 24) should appear on every cabinet, including arcade ones. GameRoom already shows a short result line; make it a clear bezel / receipt slip (“YOU WON $12” / “140 TICKETS” / “THE PLUSH BAT”).

### M3 — Off-Ramp 2.5D, Grapevine, trivia, new bar games, hotkeys

Items 18–24. Mockups: pull-tabs, blackjack, Fairway 9, YOU WON template in `/workspace/smw-mockups/v09b/`. Bar games live in `src/ui/bargames.ts`.

- Rebuild Off-Ramp games in 2.5D with readable logic (shuffleboard pucks collide; foosball keys: arrows and A/D, tap/key to shoot).
- Grapevine rumor slips: not a top-bar currency and not Regulars. Playing a bar game can drop a napkin / torn receipt. Spend on intel or a short Bypass fight edge. All copy is post-dawn (keep it out of leak-grepped literals; put strings in `dawn.ts`). Reset with the room on a REIT sale unless the Rolodex “keep the room” node is owned (M4).
- Trivia: 1,200+ original + public-domain / open-licensed **pre-1998** questions, no scraped sets. Categories + easy/regular/hard. Shuffle bag per run, persisted. Existing 36 stay and get tagged.
- New games: Pull-Tabs (with the Off-Ramp lease), Blackjack (Corporate Campus; video poker stays; H/S keys), Fairway 9 (Town Center, Phase II). In-game currency only. No sweepstakes parlors.
- Hotkeys (item 18), listed in How to Play only once the door is open: R roster (done in M1), Esc, `[`/`]` or 1/2 swap roads after dawn, F/B or 3/4 rooms once leased, A/D and arrows in games, Space to fire. Every action still needs a tap.

### M4 — Bypass NG+ (`docs/V09_BYPASS.md`)

- Reno growth 1.50 (Route 9 stays 1.35 until sale? Follow the Bypass doc). Goodwill/Equity 20 flat. Raised Bypass-only offline cap (proposed 12h; Route 9 stays 8h). Do not shrink played Route 9 under 15h±1.
- Arcade **RESETS on REIT sale** unless the player bought the keep-the-room Rolodex node (that node is a Rolodex card, not a default).
- Bypass stays hidden until dawn. Names stay “Sell to the REIT” / “Uncle Sal’s Rolodex.”
- Rolodex rebalance already recorded in the plan: 12 nodes / 39 cards, Keep the Room costs 8, Contractor’s Discount cut.
- Walls ≤60% / ≤30 tries. Re-run pacing after rooms and sinks.
- Then bump `package.json` to 0.9.0, tag `v0.9`, push the tag.

---

## Already decided (do not reopen)

Fun Zone $20K at fight 7; Off-Ramp stays Exit 14 fight 4; Attract 5/3/2; Grapevine slips not Regulars; trivia 1,200+; Fairway 9; save codes; short numbers; cash sinks without rival buyouts; blitzes are permanent and stacking; gambling is in-game currency only; no sweepstakes parlors; test mode stays on live; sound and a11y deferred; mobile later is portrait only; official bot does not buy sinks.

---

## Resume checklist

1. Open `/workspace/smw-v09`, `git pull` on `v09`, `bun install` if needed (do not commit `bun.lock` unless the repo switches to it; `package-lock.json` is what main has).
2. Skim this file and the M2 section of `docs/V09_POLISH.md`.
3. Implement M2 in chunks; after each meaningful chunk: `bun run typecheck`, and when the economy or bot changes also `bun scripts/check.ts` and `bun scripts/balance.ts --guard`. Commit as Josh and `git push origin v09`.
4. When M2 (then M3, then M4) is complete and checks + guard + screenshots pass, merge to `main` and push so it deploys. After M4, version bump and tag.
5. Final user note only then: live URL, `https://sp-cem-n.github.io/strip-mall-warlord/v0.9/`, final commit and tag hashes, change list by milestone, check/guard results, anything cut, and 6–8 screenshot paths (the M1 set above plus new M2–M4 shots).
