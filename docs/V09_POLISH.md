# v0.9 polish plan (for approval; nothing built)

Josh's notes from the v0.8 playtest on live main (`7d1c8f3`). Same method as always: find the actual problem, pick the cheap clever fix, and delete something where possible. This is the polish list for the plaza, the rooms, combat chrome and the test panel. The Bypass-as-NG+ design (pacing, Equity, the skill tree, the true ending) lives in a separate doc on `v09-plan` and is not decided here.

Mockups are still images in `/workspace/smw-mockups/v09/` (they aren't in the repo):

- `1-topbar-1280.png`, `1-topbar-1366.png`, `1-topbar-1920.png`: taller pylons and the receipt's old detail, pre-dawn, at Josh's laptop size and the two wider ones
- `1-topbar-postdawn-1280.png`: the same bar after dawn, with the Equity tenant and the highway sign, legs reaching the cabinets
- `6-funzone-bar-1280.png`, `6-funzone-bar-1920.png`: the Fun Zone's own top bar (no street)
- `6-offramp-bar-1280.png`, `6-offramp-bar-1920.png`: the Off-Ramp's bartop bar (no street)
- `8-roster-1280.png`, `8-roster-1920.png`: the battlefield roster popup
- `9-tooltip-1280.png`: a hover card on a battler and an enemy
- `13-title-1280.png`, `13-title-1920.png`: the title screen with the starburst logo

Leak rule still applies: everything about the Bypass, Equity, the second crew and the highway sign is post-dawn. Those strings stay in `DAWN`. The check.ts grep must pass. Off-Ramp placement is unchanged; only the Fun Zone moves earlier.

Layouts get checked at 1280×800 (Josh's size), 1366×768 and 1920×1080. Mobile is later, and always portrait.

---

## 1. Receipt detail and taller pylons

**Problem.** The receipt now reads as a plain cream box. The scoreboard floats above its posts. The left stack also needs more post to hold the receipt's height and, after dawn, the Equity tenant.

**Root cause.** Two v0.8 CSS changes, plus a bar that got taller:

- To stop the receipt bouncing, `.printer:not(.open) .paper` was given a fixed `height: 104px` and `overflow: hidden`. The torn edge is a `::after` at `bottom: -8px`, so the clip removes it. That's the missing detail. In v0.7 the paper was `min-height: 97px` with overflow visible, so the serrated tear, the printer housing and the green status light all read clearly.
- `.roadside` is `align-items: flex-end`. The left pylon grew (starburst + up to three tenants + asphalt) and the receipt was given a fixed height, but `.pole` is still 22px and `.legs` is still 34px. Most of those posts sit in the 32px grass/road strip, so a gap opens under the LED board. The scoreboard itself is the right size.

**Fix.**

- Keep the fixed receipt height (no bounce) but don't clip the tear: put the serrated edge inside the paper (padding at the bottom) or leave overflow visible on the y-axis. Bring back the printer housing and the blinking green light as the obvious top of the tape.
- Stretch `.pole` and `.legs` with `flex: 1` (or a larger min-height) so the concrete posts run from the road up to the cabinets and the LED board. The board's height and the 1.2K W-L stay as they are.
- A little extra padding above the road gives the receipt room for the tear without eating the plaza.

**Deleted:** nothing. This is restoring what v0.8's overflow clip took out.

---

## 2. Goodwill rate is wonky (0, then ~30/s)

**Problem.** On the lot, +GW/s is 0 most of the time, then jumps to about 30 GW/s and drops again. It feels like a 15-second recalculation.

**Root cause.** Not a 15s timer. `RATE_WINDOW` is 5 seconds (`src/game/rates.ts`). Cash from rent trickles in every sim step, so +$/s is smooth. Goodwill almost only arrives as a lump when a fight is won (`payFor` in `sim.ts`). A mid-game win is roughly 150 GW. The 5-second window then shows 150/5 ≈ 30 GW/s until that second slides out, then 0 until the next win (often 15–30s later). Josh's "15s update" is the fight rhythm, not the window.

**Fix.** Show Goodwill (and Equity, after dawn) as **GW/m and EQ/m over a 60-second window**. A 150 GW win every 20s reads as a steady 450 GW/m instead of a 0 / 30 / 0 blink. Cash and tickets stay as /s over 5 seconds, and the yellow lump pop still fires on a payout so a jackpot is obvious.

**Deleted:** the 5-second Goodwill rate, which was the wrong unit for lumpy income.

**Decision:** the Goodwill unit and window. Recommendation: GW/m (and EQ/m) over 60s, as above. The alternative is to keep /s but average over 60s (a mid-game win would read as ~2.5 GW/s, which looks like almost nothing).

---

## 3. Unlock the Fun Zone sooner (Off-Ramp stays)

**Problem.** The arcade comes on late enough that the game looks like "just battles" for a long first stretch. Unlocking the minigame tab early shows depth and gives later machines something to aim at. The Off-Ramp already opens quickly after dawn, and should stay where it is.

**Root cause / the math (seed 1991, official check-in and active bots).**

The Fun Zone unit is `S(..., zone 2, fight 0, lease $30K)`: Outlet fight 1, after capturing Big-Box. The door only appears once it's leased (`roomOpen` needs an unlocked machine; the Coin Pusher unlocks on the lease). Whac is gated "Capture Big-Box", but that capture is a prerequisite of Outlet fight 1, so Whac and the Fun Zone arrive together.

| Milestone | Check-in | Active | Cash on hand |
|---|---|---|---|
| Parking Lot captured / Big-Box fight 1 | 18:12 | 12:31 | $12.9K / $2.55K |
| Big-Box captured / Outlet fight 1 (unit appears) | 32:36 | 27:13 | $180K / $51.9K |
| Fun Zone actually leased | 1h 00m (Outlet fight 4) | 38:33 (Outlet fight 2) | $76.4K / $89.1K |
| Route 9 ending | 15h 14m | 12h 34m | — |
| Exit 14 fight 4 (Off-Ramp available) | 15h 31m | 12h 39m | 19 / 10 Equity |
| Off-Ramp leased | 15h 40m | 12h 41m | — |

So the arcade is *visible* around 27–33 minutes and *playable* at 38 min (active) or a full hour (check-in). The Off-Ramp is playable 7–17 minutes after dawn; leave it.

**Fix.** Move the Fun Zone lease to **Big-Box fight 1** and drop the price to **$8,000** (between Video Rental at $5K and Payday Loans at $15K).

- Check-in can lease it on arrival (~18 min, $12.9K on hand).
- Active play has only $2.55K at that moment and will save for it during early Big-Box (around the Video Rental window, ~19 min).
- The Coin Pusher opens on the lease. Whac still wants Big-Box captured, which is now a real machine-unlock goal (~27–33 min). Skee, the Claw, Night Shift and the Cyclone stay on their current lots.
- $30K at Big-Box fight 1 would miss the point: an active player couldn't buy it until Outlet anyway.

**Deleted:** the "Capture Big-Box, but only after you've already captured Big-Box" overlap on Whac.

**Decision:** the new lease point and price. Recommendation: Big-Box fight 1 for $8,000. The cheaper alt is $5,000, same as Video Rental, if the door should open for active players a few minutes sooner.

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

**Fix.** Move the pop. It starts over the *value* (the $ amount in the middle) and floats up out of the tenant, left of the rate. The rate never hides. Same pop, new anchor.

**Deleted:** the pop's overlap with `.r`, not the pop itself.

---

## 6. Room top bars shouldn't be a street

**Problem.** The roadside pylon, the grass, Rt. 9 and the concrete posts make sense outside. Inside the Fun Zone and the Off-Ramp they don't.

**Fix.** Each room keeps the same sticky bar (sign, tenants, receipt, doors, live rates) but swaps the chrome:

- **Fun Zone:** a dark carpet and a coin-door lip along the bottom edge. The sign is the existing pink FUN ZONE marquee. Tenants sit in cabinet-style bezels, not pylon cabinets. Posts and the highway sign are gone. The LED board becomes a credit / tickets display in a cabinet frame. ◂ PLAZA stays.
- **Off-Ramp:** a wood bartop along the bottom edge (rail, a couple of rings). The mint beer sign stays. Tenants sit on coasters or in the till window. Posts and the highway sign are gone. The LED board becomes a back-bar clock.

The plaza roadside is unchanged. The highway sign only exists outside, after dawn, as it does now.

**Deleted:** the street, the grass, the pylons and the highway chrome from both rooms.

---

## 7. The next group waits in line

**Problem.** Even on a clean win there is still a pause before the next fight. The only pause should be a smoke break.

**Root cause.** A win with nobody down still sets `c.regroup = 0.4` (`sim.ts`), and `startBattle` always starts with `enter: WALK_IN_SECONDS` (2s). The next group doesn't begin walking until that 0.4s is over, so a clean streak is 2.4s of dead air. Smoke breaks are already 5s and should stay.

**Fix.** During the current fight, the next group walks on from the back and waits in line behind the one you're fighting. On a clean win, the queued group is already in place: `enter` is 0 and the fight starts immediately. Delete the 0.4s regroup on a clean win. A smoke break (someone down, a loss, or a new fight) still pauses 5s; the queued group holds, or walks off if you drop back a fight.

**Deleted:** the 0.4s post-win regroup, and the 2s walk-in *after* a clean win.

---

## 8. Click the battlefield for a roster popup

**Problem.** The only lineup tool most people use is AUTO. There's no one screen that lists every battler, their real stats, and the buffers.

**Fix.** Clicking the battlefield (the lot canvas) opens a modal in the same family as the old rebrand / story cards: a brick frame over a dim plaza.

- **Fielded and benched fighters:** sprite, name, role, level, HP, damage, hit interval, and DPS (`dmg / interval` from `statsOf`, so renovations are already in the number). A Field / Bench toggle, the same `toggleField` the shop cards use. AUTO stays, and still means "I want the picker back."
- **On the curb:** every buffer, with their aura text. No slot toggle; they're always on.
- Empty slots are marked. The current fight's weakness is hinted on matching fighters.

Hovering a row uses the same tip as item 9.

**Deleted:** nothing from the shop cards (their Field / CURB stamps stay). The popup is the place you actually manage the crew.

---

## 9. Hover any battler, buffer or enemy for stats

**Problem.** The field is a canvas. Shop cards and the Break Room have hover text; the people in the fight don't.

**Fix.** Hit-test the sprites already drawn in `Field.tsx` (crew spots, curb spots, enemy spots). On hover, show the existing price-tag tip (`tip()`): name, role, level, HP, damage, interval, DPS, and the aura or the enemy's tell and weakness. The same tip is on the roster rows. Clicking the canvas still opens the roster (item 8); a hover doesn't.

**Deleted:** nothing. This is the tip the field was missing.

---

## 10. Autoplay should be visible, and more often

**Problem.** Attract Mode "plays badly while you're away," but you never see it. A game every 15 minutes means a player will likely never catch one. Buffs should shorten it further.

**Root cause.** `ATTRACT_EVERY` is `[0, 1800, 1200, 720]` — 30 / 20 / 12 minutes, even longer than the 15 Josh remembered. `tickRoom` calls `startPlay` / `endPlay(..., true)` and credits the purse with no cabinet UI. Test-panel autoplay is the same: "the cabinets stay dark." `ATTRACT_SKILL` is already 0.4 (badly).

**Fix.**

- When you're in the room and Attract Mode (or test autoplay) fires, the cabinet actually plays, at 0.4 skill: late drops, missed cups, a scratch. You can watch it. You can't grab the controls mid-attract play. If you're outside, a receipt line is enough.
- New intervals: **5 / 3 / 2 minutes** at Attract Lv 1 / 2 / 3. That's often enough to catch a game if you hang around, without turning the room into a slot farm. Re-check Route 9 cash so Big-Box doesn't flatten. Existing Attract prices stay; they still buy a faster clock.

**Deleted:** the silent payout-only attract play, and the 30/20/12-minute clock.

**Decision:** the new intervals. Recommendation: 5 / 3 / 2 minutes. The more aggressive alt is 3 / 2 / 1, which I'd only take if a pacing run still looks quiet.

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

**Deleted:** the arcade / plaza test toggle.

---

## 12. Keep the arcade relevant after dawn

**Problem.** Once the Bypass is open, Route 9 cash is a mountain and the Fun Zone's $ prizes don't matter. Tickets and the Claw need a second life.

**Root cause.** Claw toys are gated on Route 9: `startBattle` applies bat / duck only when `r === 0` (otherwise it uses the bar's poker buffs). The bouncy ball and the gold watch write onto `crews[0]`. The prize counter (`PERKS`: fighter slots, overtime, walk-ins) is Route 9 only. Tickets are already a global purse; they just have nothing Bypass-useful to buy.

**Fix.** Don't add a 22nd plaza unit. After dawn, the existing prize counter grows a second shelf (the "back room" of the same counter) that spends tickets on the Bypass crew: a Bypass fighter slot, a Bypass walk-in doorbell, longer claw buffs. And delete the Route 9-only gate on the Claw: bat, duck, troll, the rally and the gold watch apply to the crew that's actually fighting, including the Bypass. Night Shift's Goodwill board can stay Route 9; tickets and toys are what carry the arcade forward.

**Deleted:** the `r === 0` toy gate.

The rest of the Bypass economy (Equity rate, renovations, the skill tree) stays in the Bypass doc.

---

## 13. Title screen: the starburst, and less basic

**Problem.** The roof is still a flat letterboard, "STRIP MALL WARLORD" in a 3×5 font with a dead W — a leftover from before the roadside starburst. The page around it (brick menu, three big buttons, the away-stats card) is starting to feel plain next to the v0.8 bar.

**Fix.** The roof sign becomes the same starburst logo as the top bar (dead ray, dead O, PINEWOOD PLAZA · EST. 1991). The night lot, the four units, the parked car and the lamp stay; they're the good part. The menu sits on a cinder-block tenant board under the lot, same palette, slightly tighter, instead of a generic brick card. No Bypass, Equity or second-crew hints.

**Deleted:** the letterboard roof and the dead-W gag, replaced by the logo the rest of the game already uses.

---

## Change list (one line each)

1. Restore the receipt's torn edge and printer housing, and stretch every pylon post up to its cabinet so the scoreboard no longer floats.
2. Show Goodwill and Equity as GW/m and EQ/m over a 60-second window; cash and tickets stay /s over 5 seconds, with the lump pop moved off the rate.
3. The Fun Zone is for lease at Big-Box fight 1 for $8,000; the Off-Ramp stays at Exit 14 fight 4.
4. Buffers already don't take field slots; the new roster makes the curb rule obvious.
5. The yellow cash pop rises from the dollar amount, not on top of +$/s.
6. The Fun Zone and Off-Ramp get their own top-bar chrome (carpet and coin-door; wood bartop); the street and pylons stay outside.
7. The next group walks up during the current fight and waits in line; only a smoke break pauses, and the 0.4s clean-win delay goes away.
8. Clicking the battlefield opens a roster popup: fighters with renovated stats and DPS, Field / Bench, and buffers with their auras.
9. Hovering a battler, a buffer or an enemy shows a price-tag tip with its stats.
10. Attract Mode (and test autoplay) visibly plays the cabinet, badly; the clock becomes 5 / 3 / 2 minutes at Lv 1 / 2 / 3.
11. Test panel: visible autoplay on bar games too; drop the arcade/plaza toggle; +1h rent pays the viewed road; add +Equity, +Asphalt and Trigger flicker; the starburst wording and extra rays can sputter, not just the dead O and one ray.
12. After dawn the prize counter grows a Bypass shelf, and Claw toys apply to the crew that's fighting.
13. The title screen uses the starburst logo and a tighter tenant-board menu.

---

## Decisions for Josh

1. **Goodwill rate unit (item 2).** Recommendation: **GW/m (and EQ/m) over 60 seconds.** Alt: keep /s, still average over 60s.
2. **Fun Zone lease (item 3).** Recommendation: **Big-Box fight 1 for $8,000.** Alt: $5,000, the same as Video Rental. Off-Ramp stays put.
3. **Attract Mode interval (item 10).** Recommendation: **5 / 3 / 2 minutes** at Lv 1 / 2 / 3 (was 30 / 20 / 12). Alt: 3 / 2 / 1, only if a pacing run still feels quiet.

The other items are ready to build as written. Nothing ships until this list is approved.
