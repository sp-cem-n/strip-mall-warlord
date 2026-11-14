# Strip Mall Warlord v0.7: revision passes on v0.6

Josh's method, every pass: **(1) identify all the problems, (2) create clever solutions, (3) delete instead of simply adding.**
Passes alternate: 1 and 3 by Code, 2 and 4 by Toad. Design and review only: nothing here is built until Josh signs off.

Evidence base for Pass 1: v0.6 at `c7db436` (tag `v0.6` = `cfdb874`), balance bot `bun scripts/balance.ts 50 <seed> [--active --every=10] [--room] [--idle] --pave=1` on seeds 1991 and 7, a headless Playwright run of the live build and the local preview (no console errors; 60 fps on the plaza, 57 fps / worst 33 ms frame in the arcade), `simulateAway` timings, a read of all of `src/`, and `screenshots/v6/`.

---

## Pass 1 (Code)

### Problems

**A. Combat and balance**

1. **Walls are lumpy, not a curve.** Frontier loss % per lot (check-in, seed 1991): Lot 13%, **Big-Box 0%**, Outlet 29%, Office 33%, Lifestyle 27%, Commons 46%, Exit 14 41%, **Campus 78%**, Phase II 45%, Galleria 46%. Seed 7: Campus 75%, Exit 14 50%. Target was 10–30% in every lot past the Parking Lot. Big-Box is a free lot. Campus is a brick wall.
2. **Overall losses are far above target.** Counting every fight: Office 31–45%, Commons 29–36%, Campus 42–58%, Phase II 37–42%. The doc target was 3–10% overall. With `FALL_BACK_AFTER = 1`, every frontier loss drops the crew a fight. It then farms a fight it already beat, so most of the receipt is "Lost… Falling back…" lines.
3. **Boss walls at the end of the Bypass.** Boss tries: Phase II 13–32, **Galleria 53–87** (all modes). The target was 1–4. The Galleria is won by grinding retries, not by getting stronger.
4. **Offline is a loss treadmill.** `simulateAway(8h)` from a 2h save takes 305 ms and comes back with **1,127 wins / 902 losses, 3 fights cleared, 0 lots**. The away crew can't renovate or train, so it runs into the first wall and loses 44% of fights all night. The title screen then reports a pile of losses as "what happened while you were away".
5. **Dead stretch late in Route 9.** The last Route 9 lease lands at 8h (Party Supply). From Lifestyle (6h12) to Commons (14h39) nothing new unlocks: no shop, no machine, no slot. That's 8.5h of watching numbers in the longest lot (14 fights, need 9–10 wins each).
6. **Active and room players run fast in the Bypass.** Galleria: active 27h30 / 28h22 (target ~30h), active+room 20h00 / 18h10 (target 22–25h). Route 9 is on target, so the Bypass is where room and active income over-scale. Equity from Pool plus the shuffleboard % stacks with the paving loop.
7. **Paving is a loop, not a choice.** The `--pave=1` bot paves **5 times** between 15h40 and 25h30 (+144 asphalt each, +2% per asphalt). Asphalt is uncapped and linear, so "pave every ~2.5h" is simply optimal. The win card says "do it again faster", but a pave takes 2–3h and there is no new content in it.
8. **The Fun Zone opens at 19–23 min** (target ~50). It's placed at Big-Box fight 5 for $8K, and $8K is about 10 minutes of rent at that point. Its first machine (pusher) pays $ in a phase where $ isn't the bottleneck.
9. **Renovation is 70–97% of all $ and the only real decision.** Patrol contracts and Overtime are rounding errors. Check-in buys every patrol within minutes of reaching a lot. Per-lot contracts priced at about 15 min of rent never make you choose.
10. **Wins to clear (3 → 10) mostly add length.** The crew farms each fight 3–10 times at far below its power, then hits a wall at the next one. Most of the clock is spent below the wall, where nothing can be lost or learned.

**B. Arcade and bar**

11. **The room is required for good pacing, yet invisible to idle players.** It's tuned to take 15–20% off the run (Route 9 12h15 → 9h59 active). Attract Mode at 40% skill once every 12–30 min is too small to notice. The prize counter's slot perks (slots 6 and 7) put power behind the arcade.
12. **The machines don't talk to the main game.** Every machine shows "INSERT COIN" and a cost. Nothing on the plaza tells you a ticket perk is affordable, a toy expired, or a machine unlocked (it only shows as a receipt line). The Back Office "ARCADE · 0 TK" tab appears before tickets exist. Tickets show in the room header before Skee-Ball unlocks (the doc said to hide them until then).
13. **The cabinets use the wrong input metaphors.** Click-to-insert and click-to-play share one canvas, so the first click starts the game and the next does the game action. Pool needs a drag that has no visual affordance until you press. Pinball "left half / right half" has no on-screen flipper labels. A missed first click wastes a play.
14. **Video poker suits:** the 5×5 diamond reads as a cross at 2×, and hearts and diamonds are both red blobs. Card faces are 14×20 art px, which is small inside a 288-px cabinet.
15. **The arcade room layout at 1920 px:** 3×2 cabinets plus the counter leave the right ~35% of the screen empty (`screenshots/v6/07-arcade.png`). There's no change machine, plush wall, or jukebox/TV props (`11. Art list` in the v0.6 doc). The bar is 4 pieces in one row with nothing behind the counter.
16. **No room SFX.** Only the existing register/jingle. No coin drop, ticket chatter, claw whine, flipper thock, dart thunk, pool break or card flip (all listed in the v0.6 doc §11).

**C. UX and copy**

17. **The boss "walks out" line repeats on every re-win.** `battle.ts:111` logs it whenever `f.boss && c.streak === 0`. After a fall-back and re-clear, the receipt fills with "The District Loss Prevention Manager walks out. Oversees eleven stores and a golf cart." (`screenshots/v6/03-receipt-history-open.png` shows it 4× in 20 lines).
18. **The receipt is mostly noise.** It logs every win ("Won fight 2/12… 4/6 to move up") and every fall-back. Interesting events (captures, new shops, machine unlocks, toys) get buried in the 60-line history.
19. **Explainer copy is still in tooltips**, against Josh's rule: `Lot.tsx:76` "Move up a fight now instead of waiting." / "This lot moves up by itself after the crew farms a while." `BackOffice.tsx:73` "Patrolled. The crew moves up here on its own." `GameRoom` Attract tip "Plays itself while you are away. Badly." (that one is fine in tone, but says the design out loud). The CUT regex in `check.ts` only catches exact phrases.
20. **Shop cards truncate names** ("Fun Zone Ar…", "Security O…", "Laundrom…") in `04-lineup-and-slots.png` and `06-combat-spread-hits.png`. The FIELD/BENCH chip took the space.
21. **The win card overlay** dims only the first viewport. On long pages the bottom half of the shop grid stays bright (`19-win-card.png`). The dawn card also shows a stale uncle note behind it.
22. **Two clicks between you and the arcade:** Back Office → Arcade tab → "Walk over". The room is a full screen with no way to see the fight while playing, so you can't react to a loss you just caused by leaving.
23. **The Back Office panel is short.** At 1920×1080 it ends about 300 px down, leaving the right column mostly empty again (Josh's original complaint), see `02-` and `06-` screenshots.

**D. Code and tooling**

24. **Region branches are creeping back.** 23 `r === 0 / r === 1 / view === …` checks across `src` (room.ts alone: payouts, attract prices, slot source, toy buffs, troll walk-ins). Two parallel high-score systems (`HOUSE_SCORES`/`postScore` vs `BAR_HOUSE`/`postShuffle`) and two buff tables (`BUFFS` + `BAR_BUFFS`).
25. **`src/ui/machines.ts` is 832 lines.** It's the largest file in the repo (17% of `src/`, total 4,962). Ten games each hand-roll their own state machine, input, end-of-game delay and label. Three of them are timed-stop, three are power+aim.
26. **Every cabinet runs its own `requestAnimationFrame` loop**, plus the main loop and a 500 ms `setInterval` re-render in `GameRoom`. That's 8 timers on the room screen (the 57 fps / 33 ms worst frame).
27. **Balance tooling lives in game code.** `knobs.ts` has 16 `env()`/`list()` hooks read in the shipped bundle. The bot (`bot.ts`) re-implements room skill models (`pokerQ`, `MIX`, `BAR_MIX`, per-machine q formulas) that drift from the real mini-games.
28. **Debug params sprawl in `main.tsx`** (14 query params, ~60 lines that mutate state at boot). `room=full` writes perks, scores and cash directly. Fine for screenshots, but it ships to players.
29. **`check.ts` has no balance guard.** It checks invariants, but nothing fails the build when a lot's loss % or boss tries go out of band, which is how Campus 78% and Galleria 87 tries shipped.

**E. Release hygiene**

30. **The `v0.6` tag (`cfdb874`) has only 8 of the 19 v6 screenshots.** A workspace reset during the build deleted untracked files. All 19 are on `main` in `c7db436`. The game build under the tag is unaffected.
31. **The tag-push redeploy rebuilds every version from scratch** (v0.1–v0.6) on every main push: about 1 min per deploy now, growing with each tag.

### Solutions

S1. **One power curve instead of three knobs (fixes 1, 2, 3, 10).** Replace `FIGHT_GROWTH` × `LOT_JUMP` × per-lot hand tuning with a single target: each fight's strength = the crew power a check-in player has *at the time the doc says they arrive there* × 1.0–1.15 (a wall ramp). Generate `LOT_JUMP` from the bot's power-over-time curve once, at build time, into a checked-in table, so tuning is "move the arrival time", not "binary-search a multiplier". Big-Box gets a real wall, and Campus drops to the band.

S2. **Wins to clear: flat 3, bosses 1 (fixes 2, 10).** Keep "more as you go" as **more enemies per fight** (already there), not more repeats. That cuts farm time below the wall by about 60%, and the time removed comes back as harder fights (S1), so the length stays but the clock spends less of it doing nothing. *Needs Josh, since he asked for 3 → 10 (Q1).*

S3. **Fall back after 2 losses, and a loss costs time, not position (fixes 2, 18).** On a loss the crew "regroups" for 10s, then retries. Only a second loss in a row drops it a fight. One-off unlucky losses stop flooding the receipt.

S4. **Bosses get a pity ramp (fixes 3).** Each failed boss attempt gives the crew +5% (shown as "The crew has seen this one before: +15%"), capped at +25%, and it resets on the capture. 87 tries becomes about 5 at most, and it's legible.

S5. **Offline plays it safe (fixes 4).** While away, the crew stops at the highest fight it can win 70%+ of the time (computed from the last 20 results) and farms there. The away summary shows wins, $ and "held at Campus 6/12", not 902 losses. It also spends a configurable share of $ on the cheapest renovations (Josh's "never block idle players").

S6. **Fill the late Route 9 gap with existing things, not new shops (fixes 5, 8).** Move the Fun Zone from Big-Box f5 to the Office Park boss (~3h). Move the Pinball and Cyclone unlocks into the Commons (fights 4 and 9). Slot 9 (Goodwill) unlocks at Commons f7. The room becomes the late-Route-9 reward, and the early game stays about the core loop.

S7. **Paving gives diminishing returns and a real change (fixes 7).** Asphalt bonus goes from linear to `+2% × asphalt^0.7`, and pave #2+ adds a **lot modifier** chosen at the pave (e.g. "Lot 3 is under construction: enemies are slower, rent −20%"). One or two paves stay strong; five in a row stops being the obvious move.

S8. **Give $ a second job (fixes 9).** Merge patrol contracts and Overtime into one **"Security budget"** slider per crew: x% of rent goes to patrols (auto-advance plus a small HP buff when funded) and the rest to renovations. The idle default is 10%. Active players crank it before a boss. This deletes the per-lot contract UI and the Overtime button (D2).

S9. **Room income scales with the crew, then caps (fixes 6, 11).** Machine payouts already price off current rent. Add a per-hour soft cap: after 20 min of play in an hour, payouts halve. Idle Attract Mode gets 3× its rate (every 10/6/4 min) but pays at 40% skill. Prize-counter slots move to Goodwill (slot 6) and the boss pity system, so the arcade buys convenience and toys, not power.

S10. **Room ↔ plaza signals (fixes 12, 22).** A tiny "FUN ZONE" marquee lights on the Fun Zone shop card when a machine unlocks, a perk is affordable, or a toy runs out. Clicking the shop card opens the room directly (deletes the Arcade tab's button). The room header shows a 1-line live fight strip ("Campus 6/12 · 4/9 wins · crew 72% HP"). Tickets are hidden until Skee-Ball.

S11. **One input grammar for all cabinets (fixes 13, 25).** Each cabinet has a coin slot button (insert), and the screen only takes game input after a "READY" beat. Games share three engines: `timedStop` (pusher, cyclone, darts), `powerAim` (skee, shuffleboard, pool shot strength), and `grid` (whac, poker holds, claw stop). Pinball and pool physics share one `balls.ts`. Draw flipper labels on pinball.

S12. **Poker cards at 2× size with real suits (fixes 14).** Cards become 28×40 art px in a 2-row layout. Hand-drawn 7×7 suits, red ♥♦ vs ink ♣♠ with a clear diamond outline.

S13. **Room layouts that fill the screen (fixes 15, 23).** The arcade becomes 2 rows of 3 cabinets centered, with a prize-counter wall on the right that shows the plush shelf as art, not CSS stripes. The bar adds a back-bar (bottles, neon, TV) above its 4 pieces. The Back Office grows a "Ledger" strip under its tabs (last 5 important receipt lines, see S15) so the right column is full at 1080p.

S14. **SFX through one table (fixes 16).** `audio.ts` gets a `sfx(name)` table of ~10 procedural blips. Each machine def lists its sounds, so no per-game audio code is needed.

S15. **The receipt prints only what matters (fixes 17, 18).** Log "walks out" only on the first capture (`cleared` flag), not on `streak === 0`. Wins collapse into one live line ("Campus 6/12: 4 of 9 wins") that updates in place. Losses print once per fall-back. The history keeps captures, leases, unlocks, toys and the away summary.

S16. **Copy pass (fixes 19, 20, 21).** Rewrite the four tooltips in voice ("The night guy has this lot." / "Nobody's watching this lot."). Widen the CUT regex to catch "on its own|by itself|instead of waiting|while you are away". Shop names ellipsize after the battler line, not the shop name: the chip moves under the portrait. The win-card overlay becomes `position: fixed` over the whole document.

S17. **One region shape (fixes 24).** Each `RegionDef` gets `room: { machines, scoreBoard, buffs, slotFromBoard }` and `currency` fields. `room.ts` loops over the current region's config, so the bar and the arcade are the same code path. That deletes `BAR_HOUSE`, `BAR_BUFFS`, `postShuffle`, `barDmg/barHp`, and the attract-price branch.

S18. **One loop on the room screen (fixes 26).** `GameRoom` owns a single rAF that ticks and draws all visible cabinets. Remove the per-cabinet loops and the 500 ms interval.

S19. **Tooling out of the bundle (fixes 27, 28, 29).** `knobs.ts` exports plain constants, and the balance script swaps them via a `--knob K=V` flag that patches an imported object (no `env()` in shipped code). Debug params move to `src/debug.ts`, imported only when `import.meta.env.DEV` or `?debug=1`. Add `scripts/balance-guard.ts` to CI: 2 seeds, check-in only, fails if any lot's frontier loss is outside 5–40%, boss tries > 6, or the Route 9 ending is outside 14–16h.

S20. **Release hygiene (fixes 30, 31).** Note in the v0.6 GitHub release that screenshots are in `c7db436` rather than moving the tag (moving it needs a force push and Josh's OK). Deploy caches each archived version's `dist` by tag SHA (`actions/cache`), so main pushes only rebuild main.

### Deletions

| Cut | Replaced by | Est. removed |
|---|---|---|
| D1. `FIGHT_GROWTH`, `LOT_JUMP`, `PAY_GROWTH` env plumbing and 16 `env()` hooks in `knobs.ts` | S1 generated table, S19 | ~40 lines, 3 interacting knobs → 1 table |
| D2. Per-lot patrol contracts (`buyPatrol`, `patrolPrice`, `patrolBlock`, Patrol tab, Security Office price logic) and the Overtime button/cost/fights/perk | S8 security budget slider | ~120 lines (economy ~60, BackOffice ~35, Calls ~25), 2 prize-counter perks |
| D3. Per-fight need ramp (`need = round(3 + 7g/(n−1))`) | S2 flat 3 | ~5 lines, but removes a whole tuning axis |
| D4. `BAR_HOUSE`, `BAR_BUFFS`, `postShuffle`, `barDmg`, `barHp`, attract region branch, 15 of 23 region checks | S17 region-config room | ~70 lines |
| D5. Ten hand-rolled game state machines in `machines.ts` | S11 three engines + shared `balls.ts` | 832 → ~500 lines |
| D6. Per-cabinet rAF + `setInterval` in `GameRoom` | S18 | ~25 lines, 7 timers |
| D7. Arcade tab "Walk over" button and its machine list | S10 shop-card click + marquee | ~30 lines |
| D8. Per-win receipt lines and the repeated "walks out" log | S15 live line | ~10 lines, ~80% of receipt volume |
| D9. Debug-param block in `main.tsx` from the prod bundle | S19 `debug.ts` (dev only) | ~60 lines out of prod |
| D10. Bot room models (`MIX`, `BAR_MIX`, `pokerQ`, per-machine q) | Bot calls the real game engines headless at a skill setting (S11 engines are DOM-free) | ~40 lines, no drift |
| D11. Prize-counter slot perk | S9 (slot 6 for Goodwill) | ~10 lines and one power source |

Net: about **−500 lines** against about **+250** for S1/S5/S8/S11/S15/S19. `src/` goes from 4,962 to about 4,700, with fewer systems.

### Open questions for Josh

Q1. **Wins to clear:** you picked "more and growing" (3 → 10). Pass 1 recommends flat 3 with growth coming from bigger enemy groups instead, because the repeats are mostly dead time (Problem 10). Keep 3 → 10, go flat 3, or a middle ground (3 → 5)?
Q2. **Patrol contracts + Overtime → one security budget slider (S8)?** It's simpler and gives $ a real choice, but it removes "buy auto-advance per lot", which you asked for in v0.6.
Q3. **Move the Fun Zone to ~3h (Office boss)** so it's the late-Route-9 reward, or keep it early (~20–50 min) as the first new toy?
Q4. **Prize-counter slots:** OK to move fighter slots out of the arcade (so the arcade never gates power), or do you like tickets buying slots?
Q5. **Paving:** diminishing asphalt plus a lot modifier per pave (S7), or keep paving simple and just cap it?
Q6. **Offline:** OK for the away crew to auto-renovate with a share of $ (S5)? It makes idle stronger. The alternative is holding position without spending.
Q7. **Boss pity ramp (S4):** visible "+15%, the crew has seen this one before", or hidden?

---

## Pass 2 (Toad)

*(placeholder: Toad reviews Pass 1 problems/solutions/deletions, adds anything missed, challenges solutions, and proposes further deletions)*

## Pass 3 (Code)

*(placeholder)*

## Pass 4 (Toad)

*(placeholder)*
