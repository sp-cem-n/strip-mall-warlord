# v0.9 plan (for approval; nothing built)

Josh's notes from the v0.8 playtest on live main (`7d1c8f3`), plus the 15 Nov notes that fold the 2.5D minigame rework into this version. Same method as always: find the actual problem, pick the cheap clever fix, and delete something where possible.

**v0.9 is the plaza polish and the 2.5D minigame rework together.** The Bypass-as-NG+ design (pacing, Equity, the skill tree, the true ending) still lives in `docs/V09_BYPASS.md` on `v09-plan`. This doc assumes that document's recommended numbers so the two plans can be sequenced; Josh has not signed the Bypass card yet, so those assumptions are flagged **pending**.

**Status (15 Nov 2026, America/New_York):** Josh approved the 5/3/2 autoplay interval and the auto /s vs /m rate switch. Fun Zone price is still open (the metric is average play time). He asked for the 2.5D work, prize-counter depth, an Off-Ramp reward identity, hotkeys, room logos, a night sky on the main bar, three more bar games, and a clearer "you won" moment to be part of v0.9. **Build nothing** until the list is approved in one go.

Mockups are still images, not in the repo. Toad is revising several of them in parallel (Whac, the roster, room logos, the top-bar sky, the prize counter, and the new bar games). This doc describes the design; the pictures are Toad's.

- Plaza / chrome: `/workspace/smw-mockups/v09/` (`1-topbar-*.png`, `6-funzone-bar-*.png`, `6-offramp-bar-*.png`, `8-roster-*.png`, `9-tooltip-1280.png`, `13-title-*.png`)
- Minigames: `/workspace/smw-mockups/minigames/` (`arcade-01`…`06`, `bar-01`…`06`, `fun-zone-room.png`, `off-ramp-room.png`, plus `src/`)

Leak rule still applies: everything about the Bypass, Equity, the second crew, the highway sign, Regulars, and the new bar games is post-dawn (or post-Off-Ramp). Those strings stay in `DAWN` or behind the same gates. How to Play only lists a hotkey once its door is open. The `check.ts` grep must pass. Off-Ramp placement is unchanged; only the Fun Zone moves earlier.

Layouts get checked at 1280×800 (Josh's size), 1366×768 and 1920×1080. Mobile is later, and always portrait, but every new control also has to work by tap.

The [Cost Deep Dive](https://cursor.com/canvas/store-2a58db62-021e-466c-b74f-238b407050e2/58052c0f-aa31-4be5-aa23-62c86ab08741) is the source for play-time numbers and the prize-counter income problem.

---

## 1. Receipt detail and taller pylons

**Problem.** The receipt now reads as a plain cream box. The scoreboard floats above its posts. The left stack also needs more post to hold the receipt's height and, after dawn, the Equity tenant. Josh's read of the v0.9 mockups: the pylons are still not fully attached to the signs.

**Root cause.** Two v0.8 CSS changes, plus a bar that got taller:

- To stop the receipt bouncing, `.printer:not(.open) .paper` was given a fixed `height: 104px` and `overflow: hidden`. The torn edge is a `::after` at `bottom: -8px`, so the clip removes it. That's the missing detail. In v0.7 the paper was `min-height: 97px` with overflow visible, so the serrated tear, the printer housing and the green status light all read clearly.
- `.roadside` is `align-items: flex-end`. The left pylon grew (starburst + up to three tenants + asphalt) and the receipt was given a fixed height, but `.pole` is still 22px and `.legs` is still 34px. Most of those posts sit in the 32px grass/road strip, so a gap opens under the LED board. The scoreboard itself is the right size. The first mockups stretched the posts and still left a hairline of sky between the concrete and the cabinet. That gap has to go.

**Fix.**

- Keep the fixed receipt height (no bounce) but don't clip the tear: put the serrated edge inside the paper (padding at the bottom) or leave overflow visible on the y-axis. Bring back the printer housing and the blinking green light as the obvious top of the tape.
- Stretch `.pole` and `.legs` with `flex: 1` (or a larger min-height) so the concrete posts run from the road up to the cabinets and the LED board with **no air gap** at 1280, 1366, 1440 and 1920. The board's height and the 1.2K W-L stay as they are. If a mockup still shows a gap, the mockup is wrong; the build is the source of truth, and Toad should match it.
- A little extra padding above the road gives the receipt room for the tear without eating the plaza.

**Deleted:** nothing. This is restoring what v0.8's overflow clip took out, and closing a gap the first mockups didn't.

---

## 2. Goodwill rate is wonky (0, then ~30/s)

**Problem.** On the lot, +GW/s is 0 most of the time, then jumps to about 30 GW/s and drops again. It feels like a 15-second recalculation.

**Root cause.** Not a 15s timer. `RATE_WINDOW` is 5 seconds (`src/game/rates.ts`). Cash from rent trickles in every sim step, so +$/s is smooth. Goodwill almost only arrives as a lump when a fight is won (`payFor` in `sim.ts`). A mid-game win is roughly 150 GW. The 5-second window then shows 150/5 ≈ 30 GW/s until that second slides out, then 0 until the next win (often 15–30s later). Josh's "15s update" is the fight rhythm, not the window.

**Fix.** Keep a smooth number, then **auto-switch the unit** between /s and /m based on how much that currency is earning, with hysteresis so the label doesn't flicker:

- Measure Goodwill and Equity over a **60-second window** (fight payouts are lumpy). Cash and tickets stay over **5 seconds** (cash already trickles in smoothly).
- Show **/m** when the smoothed rate is under **1.0 per second** (early Goodwill of 0.67/s reads as 40 GW/m, not "0 then 30").
- Show **/s** when the smoothed rate is at or above **1.5 per second** (a mid-game 150 GW win every 20s reads as 7.5 GW/s).
- In the **1.0–1.5/s band, hold whichever unit is currently showing**, so a rate that hovers around 1/s doesn't flip every few seconds.
- Each currency switches independently (cash can be $/s while Goodwill is still GW/m). The yellow lump pop still fires on a payout so a jackpot is obvious, and item 24 adds a cabinet-side "you won" slip so the pop is no longer the only cue.

**Deleted:** the 5-second Goodwill rate, which was the wrong unit for lumpy income.

**Decision:** Josh wants both /m and /s, depending on earnings. **Accepted:** auto-switch with a 1.0–1.5/s hysteresis band, as above.

---

## 3. Unlock the Fun Zone sooner (Off-Ramp stays)

**Problem.** The arcade comes on late enough that the game looks like "just battles" for a long first stretch. Unlocking the minigame tab early shows depth and gives later machines something to aim at. The Off-Ramp already opens quickly after dawn, and should stay where it is.

**Root cause / the math.** The Fun Zone unit is `S(..., zone 2, fight 0, lease $30K)`: Outlet fight 1, after capturing Big-Box. Multi-seed bot runs (1991 / 7 / 42, official cadences) and the Cost Deep Dive say:

| Fun Zone option | Check-in: available / affordable / bought | Active: available / affordable / bought |
|---|---|---|
| Current: $30,000 at Outlet fight 1 | 1h 01m / 1h 01m / 1h 10m | 41m 28s / 41m 28s / 41m 37s |
| $5,000 at Big-Box fight 1 | 20m 37s / 20m 37s / 21m 01s | 15m 50s / 15m 53s / 15m 58s |
| $8,000 at Big-Box fight 1 | 20m 37s / 20m 37s / 21m 01s | 15m 50s / 15m 58s / 15m 58s |
| $15,000 at Big-Box fight 1 | 20m 37s / 20m 37s / 21m 01s | 15m 50s / 16m 10s / 16m 18s |
| $30,000 at Big-Box fight 1 | 20m 37s / 20m 59s / 21m 01s | 15m 50s / 16m 36s / 16m 38s |

Cash already reaches $5K / $8K / $15K / $30K at 8m 46s / 9m 54s / 12m 53s / 16m 59s check-in, and 8m 58s / 11m 27s / 12m 38s / 13m 07s active — all at or before Big-Box fight 1 is won. So **the unlock point does the work**; the sticker price barely changes when a typical player can buy it. Today's late lease is the Outlet fight 1 gate, plus the check-in bot farming before it pushes that fight, not a $30K shortage.

**Fix.** Move the Fun Zone lease to **Big-Box fight 1** (after that fight is won). **Leave the price undecided** until Josh picks it from play time. The Off-Ramp stays at Exit 14 fight 4. The Coin Pusher opens on the lease. Whac still wants Big-Box captured, which becomes a real machine-unlock goal (~27–33 min if the player pushes). Skee, the Claw, Night Shift and the Cyclone stay on their current lots.

If a sticker has to be picked, $8,000 sits between Video Rental ($5K) and Payday Loans ($15K) and is already in the wallet when the unit appears.

**Deleted:** the "Capture Big-Box, but only after you've already captured Big-Box" overlap on Whac.

**Decision:** unlock at Big-Box fight 1 is still the proposal; **price is open.**

---

## 4. Break Room employees and field slots

**Problem.** Buffers taking a field slot waters down the renovated shop fighters they're supposed to be buffing.

**Root cause.** This is already the rule. `START_SLOTS` is commented "buffers stand on the curb and don't take one." `fighters()` drops them, `autoLineup` / `toggleField` / `lineupOf` never put them in a slot, and `auras()` still counts everyone on the curb. Shop cards already stamp buffers `CURB`. If a slot feels stolen, it's a fighter (Token Kid is damage, for example), not a buffer.

**Fix.** Don't change the rule. The new roster popup (item 8) makes the split obvious: fighters have Field / Bench, buffers are a CURB list with their auras, always on. No new slot math.

**Deleted:** nothing. The bug is that the rule is easy to miss from the lot.

---

## 5. The yellow cash pop covers +$/s

**Problem.** A win on an arcade game pops "+$…" in yellow directly on top of the live +$/s.

**Root cause.** `.tenant .pop` is `position: absolute; right: 10px; top: -6px`, the same corner as `.tenant .r` (`margin-left: auto`). Both live in the 34px-tall tenant. The pop's 2.5s rise only goes 12px, so it never clears the rate.

**Fix.** Move the pop. It starts over the *value* (the $ amount in the middle) and floats up out of the tenant, left of the rate. The rate never hides. Same pop, new anchor. Item 24 adds a cabinet-side slip so a missable pop is no longer how you learn what you won.

**Deleted:** the pop's overlap with `.r`, not the pop itself.

---

## 6. Room top bars, room logos, and a little sky on the plaza

**Problem.** The roadside pylon, the grass, Rt. 9 and the concrete posts make sense outside. Inside the Fun Zone and the Off-Ramp they don't. The room signs are still the existing pink marquee and mint beer sign — they didn't get the love the starburst did. The main plaza bar is a flat night strip; the new title screen's star field is the better sky.

**Fix.** Each room keeps the same sticky bar (sign, tenants, receipt, doors, live rates) but swaps the chrome:

- **Fun Zone:** a dark carpet and a coin-door lip along the bottom edge. Tenants sit in cabinet-style bezels, not pylon cabinets. Posts and the highway sign are gone. The LED board becomes a credit / tickets display in a cabinet frame. ◂ PLAZA stays. The sign is a new Fun Zone logo in the spirit of the starburst: a worn pink neon marquee with a dead bulb or two, "FUN ZONE" as the neon word, a token or claw in the mark, and a quieter "TOKENS · TICKETS · NOW OPEN" line. Toad is drawing this.
- **Off-Ramp:** a wood bartop along the bottom edge (rail, a couple of rings). Tenants sit on coasters or in the till window. Posts and the highway sign are gone. The LED board becomes a back-bar clock. The sign is a new Off-Ramp logo in the same spirit: a mint beer neon or a roadhouse shield, "THE OFF-RAMP" as the lit word, one tube or letter dead, and a quieter "EXIT 14 · COLD BEER · OPEN LATE" line. Toad is drawing this. No Bypass or Equity wording on the logo itself beyond what the current mint sign already does behind a dawn gate.
- **Plaza top bar:** keep the roadside, the starburst, the pylons and the receipt. Add a sparse night sky in the bar's background — a few sodium-dim stars, in the same quiet style as the title-screen lot, not a second starburst and not a weather system. The tenants and the sign stay readable.

The highway sign only exists outside, after dawn, as it does now.

**Deleted:** the street, the grass, the pylons and the highway chrome from both rooms. The leftover generic FUN ZONE / beer-sign lettering, replaced by logos in the starburst's family.

---

## 7. The next group waits in line

**Problem.** Even on a clean win there is still a pause before the next fight. The only pause should be a smoke break.

**Root cause.** A win with nobody down still sets `c.regroup = 0.4` (`sim.ts`), and `startBattle` always starts with `enter: WALK_IN_SECONDS` (2s). The next group doesn't begin walking until that 0.4s is over, so a clean streak is 2.4s of dead air. Smoke breaks are already 5s and should stay.

**Fix.** During the current fight, the next group walks on from the back and waits in line behind the one you're fighting. On a clean win, the queued group is already in place: `enter` is 0 and the fight starts immediately. Delete the 0.4s regroup on a clean win. A smoke break (someone down, a loss, or a new fight) still pauses 5s; the queued group holds, or walks off if you drop back a fight.

**Deleted:** the 0.4s post-win regroup, and the 2s walk-in *after* a clean win.

---

## 8. Click the battlefield for a roster popup

**Problem.** The only lineup tool most people use is AUTO. There's no one screen that lists every battler, their real stats, and the buffers. The first roster mockup looks rough next to the rest of the art, and it fills the screen so the lot disappears. Josh wants a real popup, with the game still visible behind it, at the same art quality as the plaza.

**Fix.** Clicking the battlefield (the lot canvas) opens a **modal card over a dim, still-visible plaza** — the same family as the old rebrand / story cards, not a full-screen takeover. Toad is redrawing it to the current art bar (Sodium Night, the same brick, type, and sprites as the shop cards).

- **Fielded and benched fighters:** sprite, name, role, level, HP, damage, hit interval, and DPS (`dmg / interval` from `statsOf`, so renovations are already in the number). A Field / Bench toggle, the same `toggleField` the shop cards use. AUTO stays, and still means "I want the picker back."
- **On the curb:** every buffer, with their aura text. No slot toggle; they're always on.
- Empty slots are marked. The current fight's weakness is hinted on matching fighters.
- Click the dim plaza, the ✕, or Esc to close. The lot keeps animating underneath (the queued walk-up from item 7 is visible around the card).

Hovering a row uses the same tip as item 9.

**Deleted:** a full-screen roster that hides the fight. Nothing is removed from the shop cards (their Field / CURB stamps stay).

---

## 9. Hover any battler, buffer or enemy for stats

**Problem.** The field is a canvas. Shop cards and the Break Room have hover text; the people in the fight don't.

**Fix.** Hit-test the sprites already drawn in `Field.tsx` (crew spots, curb spots, enemy spots). On hover (and on a long-press on a phone, later), show the existing price-tag tip (`tip()`): name, role, level, HP, damage, interval, DPS, and the aura or the enemy's tell and weakness. The same tip is on the roster rows. Clicking the canvas still opens the roster (item 8); a hover doesn't.

**Deleted:** nothing. This is the tip the field was missing.

---

## 10. Autoplay should be visible, and more often

**Problem.** Attract Mode "plays badly while you're away," but you never see it. A game every 15 minutes means a player will likely never catch one. Buffs should shorten it further.

**Root cause.** `ATTRACT_EVERY` is `[0, 1800, 1200, 720]` — 30 / 20 / 12 minutes, even longer than the 15 Josh remembered. `tickRoom` calls `startPlay` / `endPlay(..., true)` and credits the purse with no cabinet UI. Test-panel autoplay is the same: "the cabinets stay dark." `ATTRACT_SKILL` is already 0.4 (badly).

**Fix.**

- When you're in the room and Attract Mode (or test autoplay) fires, the cabinet actually plays, at 0.4 skill: late drops, missed cups, a scratch, a slipped claw (item 16). You can watch it. You can't grab the controls mid-attract play. If you're outside, a receipt line is enough.
- New intervals: **5 / 3 / 2 minutes** at Attract Lv 1 / 2 / 3. That's often enough to catch a game if you hang around, without turning the room into a slot farm. Re-check Route 9 cash so Big-Box doesn't flatten. Existing Attract prices stay; they still buy a faster clock.

**Deleted:** the silent payout-only attract play, and the 30/20/12-minute clock.

**Decision:** **Approved** at 5 / 3 / 2 minutes. The more aggressive 3 / 2 / 1 alt is off the table unless a later pacing run still looks quiet.

---

## 11. Test panel and a wider flicker

**Problem.** Autoplay doesn't seem to work on bar games. The arcade / plaza toggle is leftover. +1h rent only pays the Route 9 till. There's no Equity button, no flicker trigger, no asphalt button. Flicker should also hit the units' signs and more of the starburst (wording and rays), not just the one dead point and the dead O.

**Root cause.**

- Test autoplay loops every unlocked machine, including the bar, but never opens a cabinet (item 10). Bar games also stay locked until the Off-Ramp is leased; "Unlock every machine" already does that after dawn. Without a visible play, a bar table looks broken even when Equity is being credited.
- `+1h rent` is hard-coded to `crews[0]` and `rentPerSec(s, 0)`.
- Flicker (`lights.ts`) already includes leased storefronts that have a dead tube, plus `sign-ray` and `sign-o`. It does not flicker other letters in WARLORD / STRIP MALL, or the other starburst rays. `?lights=fast` already exists for screenshots, but there's no button on the panel.

**Fix.**

- Autoplay uses the same visible-bad play as item 10, on bar tables too.
- Delete the "Go to the arcade / Back to the plaza" toggle. The Fun Zone door on the bar is enough.
- `+1h rent` pays the *viewed* region's till (Route 9 or the Bypass, whichever you're looking at).
- Add `+ Equity`, `+ Asphalt` (one pave's worth, +144, no run reset) and `Trigger flicker`.
- Flicker candidates grow: storefront tubes stay, and the starburst can also sputter extra rays and a letter in the wording, still rare, still minutes apart.
- When the new systems land, the panel also needs a way to grant tickets, Regulars, and to jump a cabinet's persisted state (pusher field, trivia deck) — otherwise the new logic is untestable.

**Deleted:** the arcade / plaza test toggle.

---

## 12. Prize counter depth, and ticket income that can actually reach it

**Problem.** The prize counter is thin, both before dawn and after. After dawn, Route 9 cash is a mountain and the Fun Zone's $ prizes don't matter. Tickets and the Claw need a second life. The Cost Deep Dive found a worse problem underneath: **on official cadences, tickets never reach 1,200 in 24 hours, so no prize is ever bought.** Even an active player grinding the arcade half of online time (8 hours, same 3 seeds, ~70% skill) hit 1,200 tickets on only one seed (3h 58m); the other two ended 8 hours with 251 and 13 tickets. Skee is the only early ticket source (Cyclone tickets arrive around 8h). The bot also saves for the 5,000-ticket second slot before cheaper 800-ticket coupons, so the shelf hides what you could already afford.

**Root cause.** Claw toys are gated on Route 9 (`r === 0`). The prize counter (`PERKS`: fighter slots 1,200 / 5,000, overtime coupons 800 / 800, punch card 2,000, doorbell 1,200) is Route 9 only and is priced for a player who already has a ticket engine. Tickets are a global purse with almost no income and nothing Bypass-useful to buy.

**Fix.** Don't add a 22nd plaza unit. Do three things on the existing counter:

1. **Income.** Raise Skee's typical payout (jackpot can stay the rare 140). Let the Coin Pusher's tower or a bonus hole occasionally drop a ticket token, so the first machine you lease is already in the ticket loop. Keep Cyclone as the late jackpot. Combined with the approved 5/3/2 Attract clock, a check-in player who visits the Fun Zone should be able to buy a *first* prize in a normal session once Skee is open, not after an eight-hour grind. Retune the first shelf down (a 200–400 ticket opener; mid prizes in the mid hundreds; the 5,000 slot can stay a late Route 9 goal). And fix the buy order: the counter sells what you can afford, instead of hoarding for the next slot.
2. **Pre-dawn shelf.** Flesh it out to a short, readable rack — about 8–10 things, not a second skill tree. Keep slots, overtime, and the doorbell. Add a couple of cheap, flavorful openers (a cup of leftover tickets, a free Attract nudge, a short walk-in bump) so the first Skee session buys something. Toad is drawing the counter.
3. **After dawn, a second shelf** on the same counter (the "back room"): a Bypass fighter slot, a Bypass doorbell, longer claw buffs, maybe one Regulars-adjacent souvenir that spends tickets at the bar. Delete the Route 9-only gate on the Claw: bat, duck, troll, the rally and the gold watch apply to the crew that's actually fighting, including the Bypass. Night Shift's Goodwill board can stay Route 9; tickets and toys are what carry the arcade forward.

Re-run the Route 9 guard after the income retune so Big-Box and Outlet don't flatten. The Cost Deep Dive's "prizes are dead" finding is the acceptance test: official check-in and active cadences should buy at least the first shelf item in a typical run after Skee unlocks.

**Deleted:** the `r === 0` toy gate, and the "save for the 5,000-ticket slot before anything cheaper" buy order.

---

## 13. Title screen: the starburst, and less basic

**Problem.** The roof is still a flat letterboard, "STRIP MALL WARLORD" in a 3×5 font with a dead W — a leftover from before the roadside starburst. The page around it (brick menu, three big buttons, the away-stats card) is starting to feel plain next to the v0.8 bar.

**Fix.** The roof sign becomes the same starburst logo as the top bar (dead ray, dead O, PINEWOOD PLAZA · EST. 1991). The night lot, the four units, the parked car, the lamp and the star field stay; they're the good part (and the sky that item 6 borrows). The menu sits on a cinder-block tenant board under the lot, same palette, slightly tighter, instead of a generic brick card. No Bypass, Equity or second-crew hints.

**Deleted:** the letterboard roof and the dead-W gag, replaced by the logo the rest of the game already uses.

---

## 14. 2.5D minigame rework (Whac is the exception)

**Problem.** The cabinets are flat and the play is often a hidden roll plus a score. Josh wants the 2.5D mockups in v0.9 because they allow more complexity. All of Toad's first sheets are a good direction except Whac-a-Shoplifter, which leans too hard on a vanishing-point aisle and doesn't look as good as the others.

**Fix.** Rebuild every Fun Zone and Off-Ramp game in 2.5D, grounded in the existing payouts and in `/workspace/smw-mockups/minigames/`. Click the cabinet to play (already in v0.8); the price stays on the coin door. The new games have more logic — readable piles, collisions, aim, a house player — and less hidden randomness. Payout currencies stay as they are (Route 9 cash / Goodwill / tickets; Bypass cash / Equity / Regulars, item 19).

**Whac** is redesigned, not shipped from the first sheet. Keep "read the turn" (bag vs basket, shoppers that aren't all threats) but flatten the depth: a shallower counter or a cabinet face, not a long 3-deep aisle that steals the frame. Toad is redrawing it. The other eleven first sheets (and the two room overviews) stand, plus the per-game notes in items 15–17, 20–23.

**Deleted:** hidden payout rolls that the new logic replaces (the pusher's 8% Rent Check roll, claw "always a toy," Cyclone's lifetime speed-up — already out of the mockup). The first Whac aisle.

---

## 15. Coin Pusher: a real, persistent field, and the house doesn't always win

**Problem.** Today it's "one coin a game" on an abstract 0–10 pile, with a hidden 8% Rent Check roll. The mockup already implies that coin locations matter. Josh wants more life, a field that you can work over several visits, and a machine that can pay ahead — a real pusher, not a house-edge slot dressed as one.

**Fix.**

- A play buys a **handful of coins** (three to five), not one, so a single play has motion.
- Coins have positions and thickness. Where you drop them matters. The whole field, including any tower, **persists in the save** when you leave and come back (`room.pusher`, not a fresh pile every open).
- The player can come out ahead. That means the field has to gain coins you didn't just put in: a **bonus slot or hole** that drops a coin or a ticket token onto the shelf, and a **timed shelf drop** (a small rain of coins after a trigger — a clean push, a tower hit, or a slow clock, not a hidden roll).
- A **coin tower** builds at the back or on a step and can be knocked down over several plays, which is how a big win is set up rather than a lucky edge coin.
- The Rent Check is a real coin in the pile, nudged toward the edge over several plays, as the mockup said. Delete the hidden 8% roll.

**Deleted:** "one coin a game," the abstract 0–10 shelf, and the hidden Rent Check roll.

---

## 16. Claw: you can miss, things slip, and you can read the toys

**Problem.** The first claw was an un-losable experience: a crowded bin, constant restocking, and nothing that slips once you grab it. (The pay function already has a slip line, but the presentation and the restock don't make a miss feel real.) Autoplay at 0.4 skill should look bad here.

**Fix.**

- Hover (or long-press) a toy to see its name and what it would give you if you snag it. The five toys stay the five existing buffs.
- The bin has **negative space** between items, so a drop can land on the felt.
- A grab can miss without needing perfect accuracy — a near-center hit still takes the toy; a sloppy drop doesn't. The bad autoplayer misses often; a careful player mostly doesn't.
- A toy that is in the claw can **slip** on the way up, the way a real claw does. That's the notorious part, not a second hidden roll on a successful drop.
- Restock is slower and you can see the empty felt. The gold watch still wants a dead-center grab.

**Deleted:** the always-full, never-slips bin.

---

## 17. Pinball (Night Shift): a real playfield, and flippers you can hit

**Problem.** Night Shift started strong, and 2.5D helps it, but the playfield is still a basic two-half table. Josh wants more table, and flippers on keys and on a click or tap.

**Fix.** Flesh the playfield out in the same "night shift / time clock" theme: ramps, standup targets, lanes, and at least one mode (the time-clock ramp already punches in 20s of 2×; keep that as the table's story, and add a short multiball or a lit-lane mode around it). Flippers are **A / D, the arrow keys, and click or tap** on the flipper itself. Everything still works with only a tap, for phones later. The payout stays Goodwill, scaled by the score.

**Deleted:** the bare two-half playfield.

---

## 18. Hotkeys, listed in How to Play as they unlock

**Problem.** There are almost no keys. Once the roster, the second road, and the rooms exist, walking through menus to swap them is slower than it should be. Keys have to stay optional: the game is going to phones, and every action still needs a tap.

**Fix.** Add a short, consistent set. Each one is appended to How to Play **only once its door is open** (no Bypass or Off-Ramp keys before dawn). On a phone, or with no keyboard, nothing is missing.

| Key | Does | When it appears in How to Play |
|---|---|---|
| `R` | Open or close the roster | Once you're on the lot |
| `Esc` | Close a popup, or leave a room / cabinet | From the start |
| `[` / `]` or `1` / `2` | Swap Route 9 and the Bypass | After dawn |
| `F` / `B` (or `3` / `4`) | Open the Fun Zone / the Off-Ramp, or swap them if you're already in a room | Once that room is leased |
| `A` / `D` and arrow keys | Flippers, foosball, and other games that have a left/right | When that cabinet is in play; also click or tap |
| `Space` | The obvious fire (drop the claw, STOP the Cyclone, launch a ball) where a game already has a single button | When that cabinet is in play |

**Deleted:** nothing. Keys are an overlay, not a new menu.

---

## 19. Off-Ramp rewards: Regulars, not a second ticket counter

**Problem.** Off-Ramp games are a Bypass cash booster. That's fine as a base, but it has no identity of its own, and a ticket counter would be a copy of the arcade in the wrong building.

**Options.**

1. **Regulars (recommended).** Playing any Off-Ramp game fills a Regulars meter — a chalkboard of names, including yours, in the same family as the house players already on shuffleboard and Night Shift (MO, TERRI, GUS, BIG AL, RAY). Tiers pay **favors**, not a new top-bar currency: a round on the house (a Bypass cash bump), a word from the bartender (a short crew buff, in the same spirit as a poker hand), a rumor that helps the next Bypass fight, and a late "back room" favor after you're a known face. The chalkboard *is* the UI. Cash payouts stay; Regulars are what you come back for.
2. **The Tab.** Wins leave a running tab that you can cash out as a lump of Bypass cash or Equity. Too close to a second purse, and it doesn't need the house.
3. **Grapevine slips.** Each win drops a rumor slip you spend on intel or a one-fight edge. Ties to the crew, but it's a new inventory and it's abstract for a bar.

**Fix.** Build Regulars (option 1). Don't add a Regulars number to the plaza tenants. Favors are short and readable, and they can help the Bypass crew without becoming a second prize shop. If the room survives a REIT sale (Bypass doc, pending), Regulars persist with the room — a reason to be a regular across runs, and a pacing risk to re-check in M4.

**Deleted:** "the bar is only a cash booster," and any plan to clone the ticket counter onto the bartop.

**Decision (pending):** Regulars as the Off-Ramp identity, not The Tab or Grapevine slips.

---

## 20. Shuffleboard collision, and more logic in general

**Problem.** Shuffleboard today has no puck-on-puck collision. The new sheet does. In general the 2.5D games should have more logic and less of a hidden roll.

**Fix.** Shuffleboard pucks collide, the house player (MO…RAY) still alternates, and you can knock his off or hang yours for 4, as the mockup said. The same standard applies to the rest of the rooms: if the sheet shows a readable physical reason for the payout, the build has that reason. Autoplay at 0.4 skill uses the same logic and looks clumsy, not lucky.

**Deleted:** pucks that pass through each other.

---

## 21. Bar Trivia: categories, difficulty, and a bank that doesn't go stale

**Problem.** Trivia looks good, and categories are the right idea, but 36 questions will go stale the moment someone grinds the Bypass. Knowing the answers from last time waters it down.

**Fix.**

- Keep "pick 1 of 3 categories per round." Add a **difficulty toggle** (easy / regular / hard) that draws from a tagged slice of the same bank, not a second game.
- **Target for v0.9: at least 1,200 questions**, tagged by category and difficulty, with a path to grow past 2,000. A long Bypass grind at a few rounds an hour should almost never exhaust the bag in one run.
- **Sourcing:** a seed of original questions in the game's mid-90s voice, plus a curated bank of public-domain or openly licensed facts (civics, geography, pre-1998 sports records, science, history). All of it is **pre-1998**: no events, products, or pop culture after 1997. **No scraping of copyrighted trivia sets** (no Jeopardy, no pub-quiz dumps, no Sporcle). Attribution and license sit in the content file header. The existing 36 are tagged and kept; they are not rewritten to invent new facts.
- **No-repeat:** a shuffle bag per run, persisted in the save. A question is not redrawn until the bag for that filter is empty; then it reshuffles. A sale (if the room is kept) can keep the long memory or start a new bag — default to a new bag per run so later runs stay fresh, and keep a lifetime "seen" list only if we have the headroom.

**Deleted:** the unpaid speed score (already out of the mockup), and any plan to live on 36 questions.

**Decision (pending):** 1,200+ as the v0.9 target, original-plus-open-licensed, pre-1998, no scrapes, new bag per run.

---

## 22. Foosball keys

**Problem.** Foosball is already fun. It wants the same optional keys as pinball, without losing tap play.

**Fix.** Arrow keys and A/D move the line you're on; a key or a tap shoots. Pass, trap, and the shot still go where that man is aimed, as the mockup said. A phone only needs the tap. Listed in How to Play when Foosball is in play (item 18).

**Deleted:** nothing.

---

## 23. Three more Off-Ramp games, because the Bypass is longer

**Problem.** The Bypass is meant to take roughly twice as long as Route 9. Six bar games will feel thin over a 25–37 hour second road. Josh wants scratch-offs / pull-tabs and blackjack (and does not want to drop video poker), plus maybe one more.

**Fix.** Add three cabinets, spread across the longer Bypass so they aren't all waiting on the Galleria:

- **Pull-Tabs** (with the Off-Ramp lease). A stack of bar pull-tabs / scratch-offs on the bartop. Cheap, fast, a little luck, very mid-90s. Pays Bypass cash, and a win can nudge Regulars. Not a skill game, and that's fine — it's what you do with one hand on a beer.
- **Blackjack** (mid Bypass, Corporate Campus). A bartender deals. Video poker stays; this is a different game (hits, stands, a real dealer, no hold buttons). Pays Bypass cash, with a regulars bump on a blackjack. Tap and also keys (H / S) while the hand is open.
- **Fairway 9 (recommended third).** A mid-90s cabinet golf game in the Golden Tee family. Aim and power, a short nine, late unlock (Town Center, Phase II — the Bypass already has a Golf Superstore). Skillful, key-and-tap friendly, not a second poker and not a second shuffleboard.

**Alts for the third:** Bowl-Mor (a bar bowling / shuffle-alley machine, distinct from shuffleboard) if golf feels too close to Skee; a jukebox is weaker, because it's a buff station more than a game; a punchboard is too close to pull-tabs.

Toad is drawing these. Click the cabinet to play, price on the machine, win slip from item 24, Regulars from item 19.

**Deleted:** nothing from video poker. The "maybe we only needed two" option is still there if Fairway 9 gets cut.

**Decision (pending):** the third game is Fairway 9, with Bowl-Mor as the alt.

---

## 24. A clear "you won X" moment on every game

**Problem.** Some games only show a score, and you'd have to catch the yellow drop (item 5) to see what you actually won. That's easy to miss, and it's the wrong place to learn the payout.

**Fix.** Every cabinet, table, and bar game ends on a **receipt slip or a lit bezel banner** in the machine: "YOU WON $12" / "140 TICKETS" / "THE PLUSH BAT" / "THE HOUSE PICKS UP THE TAB," lingering until the next play or a short beat. The plaza receipt can echo the same line. The yellow tenant pop still fires (from the dollar amount, item 5), but it is a backup, not the only cue.

**Deleted:** a score-only end screen as the way you learn the payout.

---

## 25. Bypass assumptions (pending Josh)

The Bypass card is still open. This plan assumes the recommendations in `docs/V09_BYPASS.md` so polish and NG+ can be sequenced, and flags them as **pending**:

- Bypass renovation growth **1.50** (Route 9 stays 1.35).
- Check-in at about **2.5× Route 9** (~37h Bypass) is acceptable; arcade will run shorter, and the Night Manager node is the later-run fix.
- **The room survives the sale**, same as paving (unlocks, Attract, perks, tickets, pusher field, Regulars).
- After a sale, **the Bypass hides until dawn** again.
- The names are good: **Sell to the REIT**, **Uncle Sal's Rolodex**, Rolodex cards, the 12 nodes.
- Bypass wall limit: frontier **≤60%** per lot, boss tries **≤30**.

The rest of that doc (flat 20:1 Goodwill → Equity, 1.5× fights, the card formula, Campus jump tuning) stays on `v09-plan` and is also pending. Leak rule: no sale or Rolodex copy before the Galleria falls; no Bypass copy before dawn.

Polish should know: anything we add to the room (tickets, Regulars, a persisted pusher field) will carry into later runs if the room-survives-the-sale assumption holds, and will shorten arcade-mode Bypass. M4 re-runs the guard after M2 and M3.

---

## Blind spots

Josh asked where the list is still thin. The ones worth watching, not new build items unless he wants them:

- **Ticket income was the hidden one.** It's now item 12. If we raise Skee and add pusher tokens without retuning prizes, Route 9 cash and mid-game slots will move; the guard has to catch it.
- **Bypass cash still has almost nothing to buy.** Steeper renovations (pending) and the new bar games are the sinks. If those slip, the till piles up again.
- **A persisted pusher field, a trivia bag, and Regulars make the save bigger**, and they snowball if the room survives a sale. Worth a cap (a max coin count on the shelf, a max Regulars tier).
- **2.5D on Josh's laptop (1280×800) and on a future phone.** Cabinets have to stay readable and cheap to draw; Whac's first aisle was already a warning.
- **Hold-to-aim and drag games on a touch screen.** Keys are optional; every cabinet still needs a tap or a drag that works in portrait later.
- **How to Play can bloat.** Only list a key once it's unlocked, and keep the list short.
- **Attract at 5/3/2 plus a +EV pusher** can pay a check-in player who never touches a cabinet. That's intended, in moderation; the Route 9 guard is the brake.
- **Audio, rumble, and a real "insert coin" beat** are still unmentioned. Not required for v0.9.
- **Corporate Campus is already a wall** in the Bypass numbers. New Regulars favors that help fights could hide it or flatten it; M4 has to see them.
- **Fun Zone price is still open.** The unlock is the real decision; don't block M1 on the sticker.

---

## Change list (one line each)

1. Restore the receipt's torn edge and printer housing, and stretch every pylon post so it is fully attached to its sign at 1280, 1366, 1440 and 1920, with no air gap.
2. Auto-switch Goodwill and Equity (and the others) between /s and /m with a 1.0–1.5/s hysteresis band; 60s window for GW/EQ, 5s for cash and tickets. **(Decided.)**
3. Move the Fun Zone lease to Big-Box fight 1; price still undecided (play-time table in item 3). The Off-Ramp stays at Exit 14 fight 4. **(Unlock proposed, price open.)**
4. Buffers already don't take field slots; the new roster makes the curb rule obvious.
5. The yellow cash pop rises from the dollar amount, not on top of +$/s.
6. The Fun Zone and Off-Ramp get their own top-bar chrome (carpet and coin-door; wood bartop) and new logos in the spirit of the starburst, each themed to its room; the plaza bar gets a quiet night sky inspired by the title screen; the street and pylons stay outside.
7. The next group walks up during the current fight and waits in line; only a smoke break pauses, and the 0.4s clean-win delay goes away.
8. Clicking the battlefield opens a real popup — game still visible behind it, art on par with the plaza — with renovated stats and DPS, Field / Bench, and buffers with their auras.
9. Hovering a battler, a buffer or an enemy shows a price-tag tip with its stats.
10. Attract Mode (and test autoplay) visibly plays the cabinet, badly; the clock is **approved** at 5 / 3 / 2 minutes at Lv 1 / 2 / 3. **(Approved.)**
11. Test panel: visible autoplay on bar games too; drop the arcade/plaza toggle; +1h rent pays the viewed road; add +Equity, +Asphalt, Trigger flicker, and later tickets / Regulars; the starburst wording and extra rays can sputter, not just the dead O and one ray.
12. Flesh out the prize counter before and after dawn, fix ticket income so the first shelf is actually reachable, and after dawn add a Bypass shelf; Claw toys apply to the crew that's fighting.
13. The title screen uses the starburst logo and a tighter tenant-board menu.
14. Rebuild every Fun Zone and Off-Ramp game in 2.5D from Toad's mockups; Whac is the exception and gets a shallower redesign (less emphasis on the depth aisle).
15. Coin Pusher: several coins per play, positions that matter and persist between visits, occasional bonus coins (slot/hole or a timed shelf drop), a tower you knock down over time, and a machine that can pay ahead; the Rent Check is a real coin, not a hidden roll.
16. Claw: hover a toy to see its reward, misses are possible (especially for the bad autoplayer) without perfect accuracy, negative space between items, and toys can slip from the claw.
17. Night Shift gets a fleshed-out playfield (ramps, targets, lanes, a mode or multiball in the time-clock theme) and flippers on A/D, arrow keys, and click or tap.
18. Hotkeys across the board, listed in How to Play as each one unlocks: roster, Esc, Route 9 / Bypass, Fun Zone / Off-Ramp, and in-game controls. Keys are optional; everything still works by tap.
19. Off-Ramp games keep their cash payout and gain Regulars (a chalkboard of favors — rounds, a short crew buff, a rumor) instead of a copied ticket counter. **(Recommended, pending.)**
20. Shuffleboard pucks collide, and the new minigames have more readable logic in general.
21. Bar Trivia: categories plus a difficulty toggle, and a very large question bank (target 1,200+ for v0.9, original or public-domain/openly licensed, pre-1998, no scraped copyrighted sets, a no-repeat shuffle bag per run). **(Recommended, pending.)**
22. Foosball can be played with arrow keys and A/D, and still with a tap.
23. Three new Off-Ramp games, spread across the longer Bypass: pull-tabs, blackjack (video poker stays), and Fairway 9 (a Golden Tee-style cabinet; Bowl-Mor is the alt). **(Third game recommended, pending.)**
24. Every minigame ends on a clear "you won X" slip or bezel banner, not just a score and a missable yellow drop.
25. Bypass NG+ assumptions (all **pending**): renovation growth 1.50, check-in at ~2.5× is fine, the room survives the sale, the Bypass hides until dawn after a sale, the names are good, walls at ≤60% / 30 tries. Full design stays in `V09_BYPASS.md`.

---

## Decisions for Josh

1. **Goodwill rate unit (item 2).** **Decided:** auto-switch /s vs /m with a 1.0–1.5/s hysteresis band and a 60s window for GW/EQ.
2. **Fun Zone lease (item 3).** **Unlock still proposed at Big-Box fight 1; price undecided.** The metric is average play time (see item 3 and the [Cost Deep Dive](https://cursor.com/canvas/store-2a58db62-021e-466c-b74f-238b407050e2/58052c0f-aa31-4be5-aa23-62c86ab08741)). $5K / $8K / $15K / $30K all become affordable within about a minute of that unlock (~21 min check-in / ~16 min active). Off-Ramp stays put.
3. **Attract Mode interval (item 10).** **Approved:** 5 / 3 / 2 minutes at Lv 1 / 2 / 3.
4. **Off-Ramp identity (item 19).** **Recommended: Regulars.** Alts: The Tab, or Grapevine slips. **Pending.**
5. **Trivia bank (item 21).** **Recommended: 1,200+** original-plus-open-licensed, pre-1998, no scrapes, new shuffle bag per run. **Pending.**
6. **Third bar game (item 23).** **Recommended: Fairway 9** (Golden Tee-style). Alt: Bowl-Mor. **Pending.**
7. **Bypass card (item 25).** **Assumed as recommended, all pending:** growth 1.50, check-in ~2.5× is fine, the room survives the sale, the Bypass hides until dawn, the names are good, walls at ≤60% / 30 tries.

**Build nothing, and ship nothing, until the list is approved in one go.** Toad can keep revising mockups in parallel.

---

## Sequencing

v0.9 is large: plaza chrome, a 2.5D rebuild of twelve games, a ticket retune, a new bar identity, three new cabinets, a 1,200-question bank, and then the Bypass NG+ knobs. Building it as one unstructured push is how things slip. Suggested milestones, in this order. Josh asked for v0.9 to include the 2.5D work, so the live ship waits until M3 is in, unless he later wants M1 out on its own as a small playable increment.

**M0 — Approve, no code.** Josh signs the list (and, when he's ready, the Bypass card). Toad delivers the revised mockups: Whac, the roster as a real popup, Fun Zone and Off-Ramp logos, the plaza night sky, the prize counter, pull-tabs, blackjack, and Fairway 9. Risk: low.

**M1 — Plaza polish.** Items 1–11, 13, and the plaza half of 6 and 8: receipt and pylons with no gap at every size, rate switch, earlier Fun Zone unlock, cash pop, room chrome and logos, night sky, walk-up line, roster popup, hover tips, visible 5/3/2 Attract, test panel, title screen, flicker. Fun Zone price can stay a knob until Josh picks it. Risk: **low**. This is the part that can be checked at 1280 on Josh's laptop first.

**M2 — Fun Zone 2.5D and the ticket economy.** Items 12, 14–17, 24 (arcade side): pusher (persist, multi-coin, tower, +EV), claw (hover, miss, slip, gaps), Skee, Cyclone, Night Shift's playfield and keys, the Whac redesign, prize-counter income and both shelves, win slips. Risk: **medium-high**. Pusher physics plus a ticket retune can move Route 9 pacing; the existing guard is the brake. Pinball's extra table is the other schedule risk.

**M3 — Off-Ramp 2.5D, Regulars, and the three new games.** Items 18–24 (bar side): darts, pool, video poker, shuffleboard collision, foosball keys, the trivia bank, Regulars, pull-tabs, blackjack, Fairway 9, bar win slips, room hotkeys. Risk: **high**. Three new games plus 1,200 licensed-clean questions is the content and schedule risk. Pull-tabs and blackjack are smaller than Fairway 9; if the milestone overruns, Fairway 9 is the one that can slip to a patch without cutting Josh's first two.

**M4 — Bypass NG+, after M2 and M3.** Item 25 / `V09_BYPASS.md`. Re-run the §4 pacing and the new Bypass guard with the earlier Fun Zone, the ticket retune, Regulars, and a room that may survive the sale. Tune `BP_RENO_GROWTH` in the 1.50–1.52 band and the Campus jump against ≤60% / 30 tries. Risk: **medium**, and it depends on M2/M3. Do not lock the Bypass hours before the rooms are in.

**Later, not v0.9.** Mobile portrait. Full audio. Anything that needs a phone-width layout.

**Why this order.** Pylon and popup quality can be signed off before a cabinet is rewritten (M1). Ticket income has to land with the Fun Zone rebuild, or the prize counter is still dead (M2). Regulars and the new bar games need the 2.5D bar and a longer Bypass to justify them (M3). Bypass numbers have to be re-measured after both rooms change (M4), which is also what `V09_BYPASS.md` already asked for.
