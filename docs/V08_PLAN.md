# v0.8 plan (for approval; no code yet)

Josh's eleven notes from the v0.7 playtest, each as problem → fix. The method is the same as always: find the actual problem, pick the cheap clever fix, and delete something where possible. Mockups are still images in `/workspace/smw-mockups/` (they aren't in the repo):

- `a1-main-screen.png`, `a2-main-screen-scrolled.png`: items 1, 2, 3, 6, 7, 8
- `b-funzone-top-bar.png`: item 4
- `c-coin-pusher-2-5d.png`, `d1-skee-ball-2-5d.png`, `d2-pool-2-5d.png`: item 11

Leak rule still applies: everything about the Bypass, Equity, the second crew, the region sign and the 21st unit is post-dawn. Those strings go in `DAWN`, and the check.ts grep must pass.

---

## 1. Sticky top bar, floating Lot + Back Office

**Problem.** Scrolling down the plaza (3 rows of shops, ~1500px) loses the money, the receipt and the lot. Josh is worried that a floating Back Office could leave Goodwill upgrades off-screen.

**Fix (CSS only, ~10 lines).**
- `.roadside { position: sticky; top: 0; z-index: 5 }`
- The right column (Lot + Back Office) gets `position: sticky; top: var(--bar)`, `max-height: calc(100vh - var(--bar))` and `overflow-y: auto`.
- So the column floats while it fits. When it doesn't (a short window or a long Back Office), it scrolls inside itself and every upgrade stays reachable. No JS and no "fits?" measuring.
- `--bar` is set once from the bar's height (one ResizeObserver line, or a fixed height now that item 7 fixes the receipt's height).
- At 1920×1080 the bar is ~196px, the Lot 494 and the 2-column Back Office ~180, so it fits with room to spare.
- On narrow, one-column layouts the sticky column is off; the bar alone stays sticky.

**Decision:** whether the bar also gets a compact form when scrolled (sign shrinks, receipt hides). Recommendation: no, not unless 768px-tall screens are a real case.

## 2. Back Office in 2 columns

**Problem.** Each training track is one full-width row: name on the left, button on the far right, and ~300px of nothing between them.

**Fix.**
- `grid-template-columns: 1fr 1fr` and the row becomes `name | Lv · % | button` packed tight. The bank row takes the 6th cell.
- 6 rows become 3, so the office is ~half as tall (which is also what makes item 1 fit).

## 3. +GW/s next to +$/s, live rates

**Already coded?** No. Today's `+$/s` is `rentPerSec`, a theoretical number, and minigame or fight payouts never move it. Goodwill has no rate at all.

**Fix.**
- The sim keeps one rolling window per currency (cash, Goodwill, tickets, Equity): a 15-slot ring buffer of per-second earnings, filled wherever income is credited (rent, fights, machines, bank).
- The bar shows sum/15 and redraws 4×/s.
- Lump payouts (a jackpot, a pot of $120B) also flash a small "+$120B" pop over the tenant, so you see a minigame land at once even though the rate only moves a bit.
- **Deleted:** `rentPerSec` as a display number. The rate is now the truth: rent shows up in it, and so do the arcade and fights.

**Decision:** the window length. 15s is the recommendation; 5s is twitchy and 60s hides the minigames.

## 4. Fun Zone / Off-Ramp get the same top bar

**Problem.** The rooms have their own thinner `header.room-bar`: different style, no rates, not sticky, and a separate code path.

**Fix.** Delete `room-bar` and its back button. The rooms render the same `Pylon` in a room variant:
- The sign becomes the room's marquee: FUN ZONE in pink neon, or the Off-Ramp's mint beer sign.
- Tenants show Cash / Goodwill / Tickets on Rt 9, and Cash / Equity / Tickets in the bar, each with a live rate and payout pops.
- The receipt prints the room's prize tape.
- The doors: "◂ PLAZA" on top (the old Back button) and the other room below.
- It's sticky, the same as item 1.

## 5. Test menu: autoplay every machine

**Fix.**
- One checkbox in TestPanel: "Autoplay machines".
- When it's on, the test tick calls the bot's existing `roomAct` for every unlocked machine as soon as it's off cooldown and affordable, and the cost is skipped in test mode.
- The machines' skill comes from the bot's existing skill roll.
- Test-only. It's in the lazy chunk and costs nothing in the real build.

## 6. More flavor on the sign

**Fix (see `a1`).**
- A bulb-chase border top and bottom.
- Two-tone lettering: small sodium "STRIP MALL" and a big red neon "WARLORD" with the O burned out (it flickers on now and then).
- An underline row: "PINEWOOD PLAZA · RT. 9" and a mint "NOW LEASING" that turns into "FULLY LEASED" when the last unit goes.
- After dawn on the Bypass, the underline reads the Bypass name (DAWN string).
- It's all CSS plus two strings. There's no new art.

## 7. Receipt and scoreboard stop bouncing

**Problem.**
- The grey footer slogans wrap from 1 to 2 lines when the receipt narrows, so the paper changes height and the bar jumps.
- The W/L and LOTS board changes width with the digits, and it's a different size on the Bypass.

**Fix.**
- The paper gets a fixed height. Lines and the footer get `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`, and the longest slogans are trimmed.
- The scoreboard is a fixed 300px with three fixed cells: W-L in short form (`1.2K-348`, using the existing `fmt`), the clock, and LOTS.
- It's the same component on both regions.

## 8. Doors stacked, one region sign

**Fix.**
- Once the Off-Ramp is open, the FUN ZONE and OFF-RAMP doors are both visible, stacked, with FUN ZONE on top.
- Clicking OFF-RAMP from Rt 9 switches the view to the Bypass and opens the bar in one step, and FUN ZONE does the reverse.
- The region switch becomes one green highway sign above the scoreboard: "BYPASS ▸" on Rt 9, "◂ RT 9" on the Bypass.
- Post-dawn only; before dawn the space is empty.
- **Deleted:** the region tabs in The Lot's header.

**Decision:** whether a door should switch your region view when you come back out. Recommendation: return to the region you left from.

## 9. The 21st unit (Pinewood, leasable after the Bypass opens)

21 units make 3 even rows of 7. At the current 6 per row it's 3 rows of 6 plus 3, so the plaza layout needs a call (see decisions).

Options, all post-dawn, strings in DAWN:

- **(a) Pinewood Plaza Management (recommended).** The office the receipt has always been printed for.
  - Its tenant is Uncle Sal, the property manager: by far the strongest single battler, slow and huge (a boss on your side).
  - It's also an uncapped cash sink: every renovation gives +% rent in both regions. That fixes the late game's piles of idle Rt 9 cash with nothing to buy.
  - It's leased with Equity, so it ties the two halves together.
  - Fiction: you finally own the landlord.
- **(b) Bingo hall / Lotto counter.** A minigame hub: raises payouts and Attract in both rooms. Good for item 11, but it's another currency loop.
- **(c) Armored car depot.** Moves cash from Rt 9 to the Bypass at a cut. Useful, but it's only a pipe with no battler.
- **(d) WPNE 1490 AM.** A radio booth: more walk-ins and a rally buff for both crews. Fun strings, weak mechanically.

**Decision:** which one (recommend a), and 7 per row versus 6.

## 10. Break room overflows when full

**Problem.** `.breakroom .bo-row` is `repeat(3, 1fr)` with `nowrap` names. The `1fr` columns have a min-content floor, so long names push the grid past the box.

**Fix.**
- `repeat(auto-fill, minmax(260px, 1fr))` plus `min-width: 0` and ellipsis on the cells.
- Check it with `?roster=full` and every slot filled before shipping.

## 11. Minigames in 2.5D

Shared approach so the rework stays small:
- One tiny perspective helper (`proj(x, y, z) → screen`), the same pixel `Painter`, and the same 64×… machine screens drawn at a slant.
- Physics stay 2D in table space. Only the camera changes.
- Every game keeps its current currency and payout curve, so balance.ts is undisturbed.
- Each game gets one more real decision. Mechanics that were secretly random are deleted.

Per game (✱ = mocked up):

- **✱ Coin Pusher.**
  - Problem: flat side view, one hidden pile number, so spam and aim feel the same.
  - 2.5D: look down into the cabinet. Coins have thickness and the moving shelf pushes the pile to the lip.
  - Deeper: timing the drop against the pusher stroke; the Rent Check coin and a KEY tag ride visibly on the pile.
  - Reward: cash as now, KEY is tickets.
  - Deleted: the PILE number and the RIGHT ON IT / CLOSE / WIDE text.
- **✱ Skee-Ball.**
  - Problem: the aim sweeps by itself (a second timing tap) and the power is hidden.
  - 2.5D: down the lane, with a hump and rings.
  - Deeper: drag to aim and release on a visible meter; a lit bonus cup.
  - Reward: same tickets.
  - Deleted: the auto-sweep.
- **✱ Pool.**
  - Problem: the physics are good, but it's flat with no aim help.
  - 2.5D: 3/4 table under the lamp, the same sim, plus a ghost ball.
  - Deeper: a called 8 (the regular picks the pocket); Attract lengthens the aim line.
  - Reward: same Equity.
  - Deleted: the top-down table art.
- **Whac-a-Shoplifter.**
  - 2.5D: a shelf aisle that recedes into depth; shoplifters pop from behind end-caps at three depths, and the far ones are smaller and faster.
  - Deeper: customers look the same until they turn around.
  - Reward: same Goodwill.
  - Deleted: the flat hole grid.
- **Claw.**
  - 2.5D: a glass box seen at a slant; you move the claw on X then Z, and its shadow on the pile is the aim.
  - Deeper: prizes have weight, and the heavy ones (the watch) need a centered grab.
  - Reward: same buffs.
  - Deleted: the hidden slip roll (`rand > q`); grip comes from how centered you are.
- **Night Shift (pinball).**
  - 2.5D: the classic tilted playfield, drawn tall.
  - Deeper: one ramp shot (the "time clock") that starts a 20s multiplier.
  - Reward: same Goodwill.
  - Mostly a redraw and the least urgent.
- **Cyclone.**
  - Fine as a 2D light ring; give it a slight tilt only.
  - Lowest priority.
- **Darts.**
  - 2.5D: the board on the wall in perspective, and the dart flies into depth.
  - Deeper: a hand sway you steady by holding (a breath), instead of waiting for the drift.
  - Reward: same.
  - Deleted: the drift-and-click.
- **Video Poker.**
  - It's a screen; leave it.
- **Foosball.**
  - 2.5D: a tilted table with the rods in depth.
  - Deeper: a pass between rods sets up a stronger shot.
  - Reward: same.
- **Shuffleboard.**
  - 2.5D: a long table down the lane (it reuses the skee-ball camera).
  - Deeper: knock their puck off; the hanger (overhang) scores 4.
  - Reward: same.
  - Deleted: the hold-for-power hidden bar (same meter as skee).
- **Bar Trivia.**
  - It's a screen; leave it.

**Recommended order:** Coin Pusher, Skee-Ball and Pool first. They're the three Josh touches most and the three that are mocked up. Skee's camera is then reused for Shuffleboard, so v0.8 stops at those 3 or 4 and the rest wait for v0.9.

---

## CHANGE LIST (for approval)

1. Top bar sticky on all screens; Lot + Back Office column sticky under it, scrolling inside itself when taller than the window (CSS only). **Decide:** compact bar on scroll, yes or no (rec: no).
2. Back Office training in 2 columns, tight rows, bank in the 6th cell.
3. Real rolling-earnings rates in the sim (cash, Goodwill, tickets, Equity), shown as +/s on every tenant, 4×/s, with a pop on lump payouts; the theoretical `rentPerSec` display is deleted. **Decide:** window length (rec: 15s).
4. Fun Zone / Off-Ramp use the main top bar (room variant: marquee sign, room tenants with rates, prize-tape receipt, ◂ PLAZA door); the old room header and Back button are deleted.
5. Test panel: "Autoplay machines" toggle (bot's roomAct on every unlocked machine, free in test mode).
6. Sign: bulb border, STRIP MALL / neon WARLORD with a dead O, "PINEWOOD PLAZA · RT. 9 · NOW LEASING" line.
7. Receipt fixed height with one-line ellipsis footer (long slogans trimmed); scoreboard fixed 300px on both regions with 1.2K-style W-L.
8. FUN ZONE and OFF-RAMP doors stacked (Fun Zone on top) once the Off-Ramp is open; doors switch region and room in one click; one green highway sign above the scoreboard ("BYPASS ▸" / "◂ RT 9"), post-dawn only; Lot region tabs deleted. **Decide:** after leaving a room, return to the region you came from (rec: yes).
9. 21st Pinewood unit, post-dawn, leased with Equity. **Decide:** which (rec: Pinewood Plaza Management, with Uncle Sal as a top battler and an uncapped both-region rent % sink) and plaza width, 7 per row or 6 (rec: 7).
10. Break room grid uses auto-fill minmax with min-width 0 and ellipsis, so it stays inside its box when full.
11. 2.5D rework of Coin Pusher, Skee-Ball and Pool (plus Shuffleboard if it falls out of Skee's camera), keeping payouts, deleting hidden randomness. **Decide:** which games make v0.8 (rec: those 3, the other 9 in v0.9).

Nothing is built until this list is approved. Then: check.ts (with the leak grep), tsc, vite build, balance.ts --guard, fresh screenshots, and a change list before anything goes to main.
