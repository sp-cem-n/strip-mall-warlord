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

Evidence: same tree (`654ddad`), `bun scripts/balance.ts 40 <seed> [--active] [--room] --pave=1` on seeds 1991 and 7. A throwaway copy in `/tmp` tested the one-clause change in 2.1 (patched in both `sim.ts:74` and `bot.ts:100`, retry = 10 farmed wins); nothing from that copy is committed. Pass 2 continues Pass 1's numbering: problems **32+**, solutions **S21+**, deletions **D12+**.

### 1. Problems Pass 1 missed, and problems in Pass 1's solutions

**A. The real loss engine (changes how 2, 3, 4 and 18 should be fixed)**

32. **Most losses happen below the frontier, not at it.** In Pass 1's own table (check-in, 1991), Commons has 140 frontier losses out of **600** total, Campus 226 of **531**, and Galleria 120 of **867**. The cause is `sim.ts:74`: `if (c.at + 1 < c.frontier || c.farmed >= retryAfter)`. Below the frontier a **single win steps the crew back up**, and a single loss steps it down (`FALL_BACK_AFTER = 1`). At a wall the crew does a random walk around the fight it wins about half the time, so it loses about half its fights there. `bot.ts:100` copies the same rule into the ▸ presses, so the active bot does it too. Pass 1 blames the fall-back (S3), but the fault is the climb back up.
33. **Security Office levels raise losses.** `retryAfter = max(3, 11 − level)`. Each renovation means the crew retries a wall it can't beat more often. The one buff the Security Office gives is a loss multiplier. It also makes S3 and S8 interact badly with any retry rule.
34. **`streak` is dead state, and it's why "walks out" repeats.** With `FALL_BACK_AFTER = 1`, `streak` resets to 0 on every loss (`sim.ts:49`), so `battle.ts:111` (`f.boss && c.streak === 0`) fires on **every boss attempt**, including all 63–87 Galleria tries, not just on re-wins (Problem 17 undercounts it). It also fires when the crew falls back onto a boss it already captured. The `×n` collapse in `log()` (`economy.ts:108`) can't merge the lines because a "Won…" line always lands between them.
35. **S15's fix is aimed at the wrong moment.** "Log only on the first capture (`cleared` flag)" would print the boss's intro *after* he's beaten. The line is an entrance. It should print once, on the **first attempt** at the frontier boss.

**B. The room pays for itself**

36. **The cash machines are profitable with no limit.** Coin Pusher: costs 5 s of rent and pays `cost × (0.4 + 2.6q) × pile`. The shelf refills 1 per 3 s and a play takes 4 s and uses 1, so the pile never runs down. At q = 0.5 that's **+87% income for as long as you click**; at q = 0.9 it's +217% (`room.ts:76-80`). Darts is the same shape with no pile at all: break-even at q = 0.23, and **+180% Bypass income** at q = 0.6 (`room.ts:116-120`). Whac, pinball, pool and shuffleboard turn rent into Goodwill or Equity at fixed multiples of a win. That's the mechanism behind Problems 6 and 11. A per-hour cap (S9) treats the symptom.
37. **Poker names the wrong hand.** Tiers collapse hands, so a flush or straight logs and buffs as "THREE OF A KIND: +20%" and two pair as "JACKS OR BETTER" (`POKER_HANDS[tier]`, `room.ts:136`; `BUFFS.call.name`). The cabinet shows the right name and the receipt shows the wrong one.

**C. Copy, leaks, release (not covered in Pass 1)**

38. **Explainer copy also lives in `src/game` log lines**, where S16's widened CUT regex (which only scans `src/ui/*.tsx`) can't see it: `economy.ts:190` "The crew moves up on its own there." and `sim.ts:102` "No patrol out there yet: press ▸ when the crew is ready."
39. **The pre-dawn leak test only covers data strings and one bot's receipt** (`check.ts:223-246`). Everything in the UI is protected only by hand-written `s.bypass &&` / `bar ?` guards (`Pylon.tsx:37`, `Lot.tsx:54`, `GameRoom.tsx:91` "+ EQUITY", `BackOffice.tsx:44`). If someone forgets a guard, the test doesn't notice.
40. **The public site spoils the Bypass outside the game.** The versions page (`.github/scripts/write-versions-page.py`) labels each row with the raw commit subject, so the v0.5 row reads "…the Route 9 Bypass (second crew, Equity, Goodwill bank)…", and "Latest" shows whatever the deploy commit happened to be called. `README.md:3` says "Then comes the Bypass."
41. **Stale leftovers:** `package.json` still says `0.1.0`. `screenshots/` keeps 5 unversioned PNGs plus `v2`–`v5` (~4.6 MB) that the tags already archive. M3 specced `log: Record<RegionId, LogLine[]>`, but it shipped as a flat `LogLine[]` with a per-region cap. It works, so this is a doc drift, not a bug.
42. **`bought()` is a no-op** called from 5 places (`economy.ts:124`). Its comment says "Any purchase lets auto-advance try the frontier again", which §14.2 says is no longer true.

**D. Problems in Pass 1's solutions**

- **S3** (fall back after 2 losses, plus a 10 s regroup) adds a state and leaves Problem 32 in place: after the second loss, one win still climbs back up.
- **S4** (pity ramp) and **S5** (offline "hold at 70%" tracker over the last 20 results) are two new systems for one cause. See 2.1: boss tries and offline losses mostly disappear without either.
- **S7** (a lot modifier per pave) is a new content system. Asphalt also multiplies three things at once (rent, stats and Goodwill, `economy.ts:66`), and they compound through renovations. That stacking is the real reason paving loops.
- **S8** (security budget slider) adds a continuous control, a new HP buff and an idle default, to give $ a job that Pass 1 says nobody wants (Problem 9).
- **S9** adds an hourly meter and a 3× Attract Mode rate on top of machines that are profitable (36). It also keeps `rentCost` pricing everywhere.
- **S10 + S13** add a live fight strip, a marquee, a prize-counter wall, a back-bar and a Back Office "Ledger", all to make a full-screen room feel connected and full. The full screen is the problem.
- **S11 + D10:** rewriting 10 working games into 3 engines is the riskiest item in the doc. And "the bot calls the real engines headless" isn't possible as written: the engines use `Math.random` and need simulated input, so the bot would need an input model for each game. That's more code, not less.
- **S1:** generating `LOT_JUMP` from the bot's power curve is circular, because the curve depends on `LOT_JUMP` (wins pay Goodwill, which pays for training). It needs 2–3 passes to settle, and it adds a codegen step and a checked-in artifact. The outliers are just two numbers: Big-Box's 1.259 and Campus's **8.59** in `knobs.ts:16`.
- **S19 guard** checks frontier loss % but not **overall** loss %, and overall loss is the target v0.6 missed (§9: 3–10%).

### 2. Better or cleverer solutions

S21. **Climb back slowly: delete the fast climb (fixes 2, 3, 4, 17/34, 18, most of 6; replaces S3, S4, S5).** Below the frontier, the crew moves up only after `RETRY_AFTER` farmed wins, the same rule as at the frontier. The change is one deleted clause in `sim.ts:74` and the matching one in `bot.ts:100`. Measured on seed 1991, retry 10, everything else unchanged:

| | v0.6 | S21 | target |
|---|---|---|---|
| Check-in overall loss, Office / Commons / Campus / Galleria | 31 / 31 / 44 / 22% | **7 / 7 / 9 / 7%** | 3–10% |
| Check-in Route 9 ending | 14h39 | 17h04 | 15h ±1 |
| Active overall loss, Office / Campus | 45 / 58% | **7 / 10%** | 3–10% |
| Active Route 9 / Galleria | 12h15 / 27h30 | **11h50 / 30h34** | ~12.5h / ~30h |
| Active + room Galleria | 20h00 | **24h04** | 22–25h |
| Galleria boss tries (active / +room) | 53 / 87 | **2 / 15** | 1–4 |
| Offline 8h (from a 1-min save) | 2,363 W / 934 L | 3,551 W / 312 L | — |

Seed 7 check-in (`sim.ts` patch only) agrees: overall loss 2–11% in every lot (v0.6: 4–43%), Galleria boss tries 85 → 4. Active play gets *faster* to the end of Route 9 because it stops paying for losses. Check-in Route 9 runs about 2.5h long and active + room Route 9 goes from 9h59 to 11h16 (target 9–10.5h). Those are the only things left to retune (via S2 or `need`, not a new system). The Campus *frontier* still loses 46–58%, so that's a real curve problem: fix the one `LOT_JUMP` entry (see D17). Also drop the Security Office's retry shortening (33), or it brings the oscillation back.

S22. **One `tries` counter per crew instead of `streak` (fixes 17/34/35).** It resets on a capture. The boss intro logs when `fight === frontier && tries === 0`. If Josh still wants a pity ramp after S21, it reads the same counter; the S21 numbers suggest he won't. Delete `streak` and `FALL_BACK_AFTER` (D12).

S23. **The room pays in toys, not currency (fixes 6, 11, 36; replaces S9).** Arcade machines pay **tickets only**. Tickets buy claw plays, prize-counter perks and Attract Mode. Bar machines pay **buffs only**, mapped onto the existing `BuffKind`s: darts → a rally (`ball`), pool → the `bat` damage buff, poker as now. Buffs are time-limited, so the active + room speedup is capped by buff uptime instead of clicks per hour. Idle and check-in rows stop depending on the room, which was §12's own risk. The two high-score boards (+6% per house score, capped at 5) stay as the one permanent, skill-gated hook. This deletes per-play `cash`/`goodwill`/`equity` payouts, most `winPay` and `rentCost` use, the 3× Attract Mode idea, and the soft cap.

S24. **The room opens in the right column, not full-screen (fixes 15, 22, 23; replaces S10's strip and S13).** The Back Office's ARCADE / BAR tab *is* the room. One cabinet at a time at 3× (about 288 px wide), with a row of machine thumbnails to switch between them, and the plaza and fight stay visible on the left. That fills the empty right column (23), removes the two-click "Walk over" (22), removes the empty 35% of the full-screen layout (15), and makes a live fight strip unnecessary. It also cuts the room's 8 timers to one visible cabinet's loop, which mostly solves 26 without S18.

S25. **Leasing the Security Office *is* auto-advance (fixes 9 and 33; replaces S8 and Q2's slider).** Each region gets one purchase instead of six contracts. Lease it for $50 from minute one and every lot in that region auto-advances, which keeps Josh's "Parking Lot contract $50 from the start" (answer 4). Renovating it does nothing for advance. It stays a $0-rent tank unit, a choice rather than a toll. "Renovation is the only $ decision" (9) is fine: the decision is *which* shop, and that's the lineup game.

S26. **Asphalt boosts rent only (fixes 7; replaces S7).** One multiplier instead of three, so it stops compounding through stats and Goodwill. Add √-diminishing (`+2% × asphalt^0.7`) only if the bot still paves every 2.5h.

S27. **Four-color deck for poker (fixes 14; replaces S12).** ♠ ink, ♥ red, ♦ blue, ♣ green (the standard online-poker fix). Change the diamond bitmap to a hollow outline so it stops reading as a plus. It's a palette swap: the cards stay 14×20 and the layout doesn't change. While there, log `handTier()`'s real name instead of `POKER_HANDS[tier]` (37).

S28. **A render-based leak test instead of more regex (fixes 39, and S16's coverage).** `scripts/screenshots.mjs` already drives Playwright. Its pre-dawn shots also dump `document.body.innerText` plus every `title` / `aria-label` / tooltip string, and the same `LEAK` regex runs on that. This catches any missing guard without parsing `.tsx`. The CUT regex extends to `src/game/*.ts` string literals (38).

S29. **Versions page without commit subjects (fixes 40).** Each row shows the tag and its date, and "Latest" shows `main @ <short sha>`. Delete `subject()`. If Josh wants blurbs, use the annotated-tag message, written for players. Cut "Then comes the Bypass." from `README.md:3`.

S30. **Ship-step chores (fixes 41).** M6 bumps `package.json` to the tag. Delete `screenshots/*.png` (root) and `v2`–`v5` (the tags keep them). Update V06 §7 to say the log is flat with a per-region cap, rather than changing the code to match the spec.

S31. **Fun Zone timing is one price, not a move (fixes 8; replaces S6's relocation).** Raise the Fun Zone lease from $8K (~10 min of rent at Big-Box fight 5) to ~35 min of rent (~$28K). That should land it near the ~50 min target in the same slot; confirm with the bot. Problem 5's dead stretch is a *length* problem: Commons is the longest lot (14 fights, 9–10 wins each). Cut it to 8–10 fights (D18) instead of moving pinball and Cyclone into it.

### 3. Deletions

| Cut | Replaced by | Removes |
|---|---|---|
| D12. `streak`, `FALL_BACK_AFTER`, the fast-climb clause (`sim.ts:74`, `bot.ts:100`) | S21 + S22 `tries` | 1 state field, 1 knob, the treadmill |
| D13. **S3, S4, S5's hold-at-70% tracker** (don't build) | S21 | 3 planned systems. S5's auto-renovate part stays a separate question (Q6) |
| D14. Patrol contracts *and* S8's slider: `buyPatrol`, `patrolPrice`, `patrolBlock`, `lotReached`, `PATROL_DISCOUNT*`, `retryAfter`'s Security term, Patrol tab, per-lot `patrol` prices in `content/*` | S25 | ~110 lines and a planned slider |
| D15. Per-play currency payouts in the room, `winPay`/`rentCost` pricing, S9's soft cap, the 3× Attract idea, bot `MIX`/`BAR_MIX` currency models | S23 | ~60 lines and a planned meter. The bot only needs a ticket and buff rate, so D10's "headless engines" isn't needed |
| D16. **Two machines: Cyclone and Shuffleboard** (*needs Josh*) | Skee-Ball (tickets), Back Office EQ for the 9th Bypass slot | Cyclone is a third timed-stop game with the only cross-region branch in a Route 9 machine (the Equity jackpot, "+ EQUITY" label). Shuffleboard duplicates Skee-Ball's power-aim *and* the high-score system (`BAR_HOUSE`, `postShuffle`, `SHUFFLE_TOP`, the slot special case). ~120 lines, and S11 gets smaller |
| D17. S1's generated table and codegen step | Hand-fix the two outlier `LOT_JUMP` entries (Big-Box 1.259, Campus 8.59) after S21, using the S19 guard | A build artifact and a circular tuning loop |
| D18. 4–6 Commons fights | S31 | ~1–2h of the dead stretch, no new unlock |
| D19. S13 (arcade wall, back-bar, Ledger strip), S10's live fight strip and marquee, D7's button (already listed), S18's shared loop | S24 | The full-screen room layout, `back()` and its "Back to the plaza" chrome |
| D20. `bought()` and its 5 calls | — | Dead code with a false comment |
| D21. Asphalt's stats and Goodwill multipliers; S7's lot modifiers (don't build) | S26 | A planned content system |
| D22. `subject()` in the versions script, the README spoiler, stale screenshots | S29, S30 | ~4.6 MB and a spoiler |

Against Pass 1: S21 is +0 lines and removes S3/S4/S5. S23 and S24 replace S9/S10/S13/S18. S11's rewrite becomes optional: do the input fixes (coin button separate from the screen, pinball flipper labels) and only rewrite if a third bug shows up. **Keep from Pass 1 as is:** S2's direction (Q1), S14, S15's receipt collapse (with S22's trigger), S16's copy rewrites, S17, S19 (add an *overall* loss ≤ 12% check), S20, D1, D9.

### Pass 1 open questions this narrows

- **Q1 (wins to clear):** S21 makes check-in about 2.5h longer. Flat 3 (or 3 → 5) is now how to get that time back, not just a way to cut dead time. Pick that together with S21.
- **Q2 (slider):** S25 replaces the choice: one Security Office lease per region, $50 at the start. Josh keeps "buy auto-advance" and loses the per-lot list.
- **Q3 (Fun Zone at 3h):** S31 hits the ~50 min target by price alone, so the Fun Zone stays the first new toy. Moving it to 3h is now only a question of taste.
- **Q4 (prize-counter slots):** under S23 the arcade pays tickets, so slots bought with tickets are the arcade's *only* power. Keep them, or move both to Goodwill. Either way the room can't speed up idle play.
- **Q5 (paving):** S26 first. Revisit modifiers only if the bot still loops.
- **Q6 (offline):** S21 cuts offline losses about 3× with no offline-specific code. What's left is only whether the away crew should spend $.
- **Q7 (pity ramp):** probably moot. After S21, boss tries are 1–15. Revisit only if the S19 guard trips.
- **New Q8:** OK to delete Cyclone and Shuffleboard (D16)?
- **New Q9:** OK for the room to stop paying $/Goodwill/Equity (S23)?

## Pass 3 (Code)

*(placeholder)*

## Pass 4 (Toad)

*(placeholder)*
