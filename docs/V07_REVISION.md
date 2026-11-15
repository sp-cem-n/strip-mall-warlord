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

Evidence: four scratch copies in `/tmp` built from `a02499a`, none committed. **A** = Toad's S21 exactly: fast-climb clause deleted in `sim.ts:74` and `bot.ts:100`, `retryAfter` = constant `RETRY_AFTER` 10 (Security term dropped). **B** = A, but below the frontier the crew climbs after 3 wins. **C** = A plus flat `need` 3 (Q1's option). **D** = A with `RETRY_AFTER` 6. **F** = A with the Fun Zone moved. Runs: `bun scripts/balance.ts 40|50 <seed> [--active --every=10] [--room] [--idle] --pave=1`, seeds 1991 and 7, and `simulateAway(8h)` from 2h and 6h saves. Numbering continues: problems **43+**, solutions **S32+**, deletions **D23+**.

### 1. Problems (including problems in Pass 2's solutions)

**Verification of Pass 2's numbers:** reproduced exactly on seed 1991 (A): check-in Route 9 **17h04**, active **11h50**, active Galleria **30h34**, active+room Galleria **24h04** (Route 9 11h16), Galleria boss tries 2 / 15. Overall loss per lot 3–9% at check-in. Pass 2's numbers are right. What they leave out:

43. **S21 as specced overshoots check-in and nearly erases the active advantage.**
    - **Check-in Galleria** is **43h21** (target ~35h); seed 7 doesn't finish in 40h.
    - **Seed 7:** check-in Route 9 is 15h30 but active is **13h51**, only 11% faster (target ~17%).
    - **Variant C (flat need 3):** active is *slower* than check-in on seed 1991 (13h29 vs 13h23), and seed variance blows out (13h23 vs 16h57).
    
    The 10-win wait after every fall-back is a fixed delay that hits whoever is ahead of the curve, and the active player is always ahead. So flat 3 (Q1) isn't the way to get the time back.
44. **Offline barely progresses in every variant.** 8h away clears **1–4 fights**:

    | | Loss % | Fights cleared |
    |---|---|---|
    | v0.6 | 44% | 1–4 |
    | A | 7% | 1–4 |
    | D | 11% | 1–4 |

    S21 fixes the *losses* (Problem 4) but not the feeling: the crew can't spend while you're away, so it parks at its wall. Waking up to "+2 fights" after 8 hours is the real complaint. Hiding it isn't the fix.
45. **S31 (Fun Zone at ~$28K) doesn't move the unlock.** Measured with the Fun Zone at Big-Box f5 for $28K:
    - Check-in leases it at **23:01 / 24:01** and active at **20:08 / 18:28** (v0.6: 23 / 19 min).
    - Rent at that point is ~500–1,000/s, so $28K is about one minute of rent, not 35. The gate is the fight slot, not the price.
    - It also delays the Big-Box capture on seed 1991 from 28 to **39 min**.
46. **Machine unlocks don't check for the Fun Zone.** `room.ts` gives Whac on the Big-Box capture, Skee on Outlet f6, and so on, whether or not the Fun Zone is leased. `roomOpen()` then shows the Arcade tab. In v0.6 this is hidden only because the Fun Zone is always leased first. Any move of the Fun Zone (S31 or ours) exposes it.
47. **S23 (arcade pays tickets only, bar pays buffs only) conflicts with Josh's own reward map** (t21u: "coin pusher can net more $, skee ball for tickets can get upgrades from gift shop. claw machine prizes are buffs"). It also conflicts with his ask for a mini-game that "could essentially cut down the game time by a large margin for active players". Pass 2 is right that Pusher and Darts are unbounded (verified: +87% / +180% of rent). The bug is the *missing bound*, not the currency. **Flag for Josh, don't override.**
48. **S24 (room in the right column) conflicts with Josh's ask** (t21u: "a separate tab that could take up more screen real estate to flesh them out better. would certainly want them to be bigger than the tiles"). Practical problems:
    - The right column is 380 px.
    - At ≤1720 px wide the Back Office drops *under the Lot*, so the room would be below the fold on most laptops.
    - Pinball is 480 px tall, so one cabinet at a time fills it.
    
    **Flag for Josh.**
49. **S25 (one Security Office lease per region) conflicts with Josh's ask** (t20u: "auto progression should be something you need to purchase for each new lot individually as you progress"). He reaffirmed it in t21s6 ("Parking Lot contract $50 from the start"). Pass 2 notes it ("Josh keeps 'buy auto-advance' and loses the per-lot list"), but as a replacement, not a conflict. **Flag for Josh, don't silently override.**
50. **S26 (asphalt boosts rent only) removes the reason Josh gave for paving** (t19u: pave Route 9 "to build up more goodwill to feed into region 2's equity"). Under S26, a repave gives no extra Goodwill per win. The compounding Pass 2 found comes from the *stats* term (through renovations), not the Goodwill term.
51. **D16 cuts Cyclone, which Josh picked by name** (t21s1 "all 3"; t21u "let's do all of the arcade machines… maybe even open to more arcade ideas"). Shuffleboard was ours, not his ("darts and pool and video poker etc."), so cutting it is in bounds. But its job (the 9th Bypass slot) needs a new home.
52. **S28's rendered-DOM leak test can't see tooltips.** `tip()` (`app.ts:48`) returns `onMouseEnter` handlers, so the text exists only while hovered. `innerText` and `title` scans miss every tooltip, and most guarded copy is tooltips (`Pylon.tsx:32/38`, `BackOffice.tsx:45`). It would also add a Chromium install to CI.
53. **The frontier curve is still lumpy after the loss fix.** D, check-in seed 1991, frontier loss: Big-Box **0%**, Commons 36%, **Exit 14 48%**, **Campus 66%** (seed 7 the same shape). S21 fixed the *overall* loss rate, not the walls.
54. **The active bot still grinds late bosses.** Under D: Phase II 5–16 tries and Galleria **27–28** for active and active+room, against 1–5 at check-in. The bot's Overtime trigger reads `c.streak > 0` (`bot.ts:103`), which S22 deletes. The pass-2 numbers silently depend on a field that's going away.

### 2. Better solutions

S32. **S21 + `RETRY_AFTER` 6, nothing else (fixes 43, and most of 2/3/4).** Variant D, measured:

| | Check-in 1991 / 7 | Idle 1991 | Active 1991 / 7 | Active+room 1991 / 7 | Target |
|---|---|---|---|---|---|
| Route 9 | **15h50 / 15h40** | **14h52** | **12h34 / 11h47** | **9h19 / 9h09** | 15±1 / ~12.5 / 9–10.5 |
| Galleria | 36h52 / 37h23 | 37h05 | **31h41 / 29h13** | **21h28 / 21h51** | ~35 / ~30 / 22–25 |
| Overall loss | 6–16% per lot (~10%) | | | | 3–10% |
| Offline 8h | 11% losses (v0.6 44%) | | | | |

- Every Route 9 row is inside its band on both seeds, and active is 20–25% faster than check-in again.
- The two long rows (Galleria check-in +2h, active+room just under 22h) are curve problems for S35, not a reason for another system.
- It's a one-number change on top of Toad's one-clause change. **Use D, not A, and not flat-3 (Q1 → keep the 3 → 10 ramp Josh chose).**

S33. **The pile is the cap (fixes 47 and 36 inside Josh's reward map; replaces S23 and S9).** Every machine that pays a currency pays out of a visible **float** that refills on the clock: the pusher's coin shelf (it already exists, but refills 1 per 3 s), a chalkboard "house pot" for darts, a ticket hopper.
- The shelf refills 1 coin per 60 s, cap 10. Skill decides how much of the float you capture; the clock decides the most anyone can take per hour.
- Set the float so an hour of play is worth about +25% of that hour's rent in $ (pusher, darts), or about 1.5× the hour's win pay in Goodwill/Equity (whac, pinball, pool).
- Josh's map stays: pusher → $, skee → tickets, claw → buffs, poker → buffs. The active speedup is a design number instead of clicks per second.
- Cost: ~10 lines (a `float` per machine in `RoomState`, refilled in `tickRoom`). It deletes S9's hourly meter and the 3× Attract idea.
- If Josh prefers S23, both fit the same data shape: S23 is "every float is tickets".

S34. **Per-lot patrols, folded into the lot track (49; the per-lot version of S25).**
- Keep one contract per lot (Josh's ask). Price each at that lot's first lease (Parking Lot $50 per answer 4; Big-Box $5K; Outlet $30K…), so it competes with a shop.
- Sell it with one button on the `ZoneTrack` lot chip ("Hire a patrol $5K"). That deletes the Patrol tab, `patrolBlock`, `PATROL_DISCOUNT*`, the Security Office's price and retry terms, and its "next renovation" line.
- The Security Office stays a $0-rent tank whose renovations make *all* patrols' fighters tougher (its +5% HP aura already exists). No new mechanic.
- Present S25 and S34 side by side to Josh (Q2).

S35. **Fix the walls with three numbers, guarded (53; agrees with D17).** After S32:
- Big-Box `LOT_JUMP[0][1]` 1.259 → ~1.45.
- Exit 14 `LOT_JUMP[1][0]` 2.5 → ~2.2.
- Campus `LOT_JUMP[1][1]` 8.59 → ~7.3.
- Commons stays long but loses 4 fights (D18).

The S19 guard checks frontier loss 10–40%, overall ≤ 12%, and boss tries ≤ 6 at check-in on both seeds. It runs in CI with `--quiet` (~40 s × 2).

S36. **Fun Zone at Outlet fight 1, $30K (fixes 8, 45; replaces S31 and S6).** Measured (F): check-in leases it at **1h00** on both seeds (the bot's first 10-minute look after arriving at ~40 min), active at **39:34 / 40:35**. The targets were ~50 / ~40 min. Big-Box is no longer delayed. Gate every machine on `funZone(s) && …` (fixes 46; one `&&` in `tickRoom`).

S37. **Asphalt boosts Goodwill per win only (fixes 50 and 7; replaces S26).** It's the paving loop Josh asked for (Goodwill → Equity) and it doesn't compound through renovations: the stats and rent terms are cut. Re-run the pave bot. Add `^0.7` only if it still paves more than twice.

S38. **"While you were out" ends in one button (fixes 44; replaces S5 and settles most of Q6).** The away card leads with what was earned ("$412M and 24K Goodwill came in. The crew held Office 8/14."), then shows **[Spend it]**. That runs the idle bot's existing buy step (`crewAct` leases → renovations → training) once, and the card lists what it bought.
- Idle players get the 8h of progress back with one click, with no offline spending simulation and no new rules.
- Active players can skip it and spend by hand.
- About 15 lines, reusing `bot.ts`.

S39. **Tooltip registry for the leak test (fixes 52; replaces S28's DOM scan).** In test builds, `tip()` pushes `title` and `lines` into a global `Set` *as it's called during render*. `check.ts` renders each screen with `preact-render-to-string` at four game states (fresh, Big-Box, Commons, pre-dawn win) and runs `LEAK` and `CUT` over the set plus the HTML text.
- It sees every tooltip without hovering and needs no browser in CI.
- One dev dependency, ~30 lines, and it replaces the per-file regex.

S40. **Keep Cyclone, drop its Equity branch (51; narrows D16).** The jackpot pays tickets before and after dawn. That deletes the only cross-region branch in a Route 9 machine, `"+ EQUITY"` and the `s.bypass` check in `pay`, with ~0 lines added. **Cut Shuffleboard** (ours, duplicative). The 9th Bypass slot becomes a 4th Equity slot in the Back Office (`SLOT_PRICES[1]` gets one more entry).

S41. **Overtime trigger reads `tries` (fixes 54).** After S22, the active bot's Overtime check becomes `f.boss && tries > 0`. Re-measure late boss tries after S35. If active is still above 6, the bot should also field the counter lineup before a boss attempt (`lineupOf(..., auto)` already exists). Again, no new mechanic.

S42. **Arcade at full screen, one click away, plaza header kept (fixes 15, 22 without S24; replaces S10's strip and S13).** If Josh keeps the separate screen (Q10):
- Clicking the Fun Zone shop card opens it (deletes the Arcade tab's button).
- The room renders the existing `<Pylon>` header (cash, Goodwill, the receipt printer, the lot counter), so a loss shows while you play with no new strip.
- The cabinet grid sizes to the viewport: 3-up at scale 3 under 1600 px, 6-up at scale 3 above, 4-up for the bar. CSS only, no wall or back-bar art.
- One rAF for the room (S18).

### 3. Deletions

| Cut | Replaced by | Removes |
|---|---|---|
| D23. Flat-3 `need` option (Q1 as an option) | S32 (`RETRY_AFTER` 6 gets the time back) | A tuning axis Josh already decided |
| D24. S23's ticket-only rewrite *if Josh keeps his map*; S9's meter and 3× Attract (already cut by Pass 2) | S33 floats | ~60 lines of payout rework, without changing what machines pay |
| D25. Patrol tab, `patrolBlock`, `PATROL_DISCOUNT*`, Security Office price and retry terms and its next-renovation line | S34 (or S25, Josh's choice) | ~90 lines either way |
| D26. S5 offline renovation sim, S38's alternative "auto-spend while away" | S38's [Spend it] button reusing `crewAct` | An offline-only rules path |
| D27. S28's Playwright DOM dump in CI | S39 registry plus render-to-string | A Chromium step in CI, and a test that misses tooltips |
| D28. Cyclone's Equity jackpot branch; Shuffleboard entirely (`BAR_HOUSE`, `postShuffle`, `SHUFFLE_TOP`, `shuffle`/`shuffleBest` state, slot special case, shuffle mini-game ~110 lines) | S40 | ~170 lines, 2 state fields, 1 cross-region branch |
| D29. Asphalt's stats and rent terms (Goodwill term kept) | S37 | Two of three compounding multipliers |
| D30. S31's price change | S36 slot move | A number that doesn't do anything |

### Current proposal (running list after Pass 3; superseded by the Final proposal at the end)

**Accepted (build these):**
- **Combat and pacing:**
  - S21 + **S32** (delete the fast climb, `RETRY_AFTER` 6, drop the Security retry term).
  - S22 (`tries` replaces `streak` and `FALL_BACK_AFTER`; boss intro on the first attempt).
  - S41 (bot reads `tries`).
  - **S35** (three `LOT_JUMP` fixes) + D18 (Commons −4 fights).
  - S19 guard (frontier 10–40%, overall ≤ 12%, boss tries ≤ 6, Route 9 14–16h, two seeds, CI).
- **Fun Zone:** **S36** (Outlet f1, $30K, machines gated on the lease).
- **Offline:** **S38** ([Spend it] on the away card).
- **Paving:** **S37** (asphalt → Goodwill per win only).
- **Room:**
  - S33 floats, *or* S23 (Q9).
  - S40 (Cyclone pays tickets always; cut Shuffleboard; a 4th Equity slot).
  - S27 (four-color deck; log `handTier()`'s real name).
  - Pass 1's input fixes from S11 (separate coin button, READY beat, pinball flipper labels), without the 3-engine rewrite.
  - S14 SFX table.
  - S18 one rAF.
- **Receipt and copy:**
  - S15's collapse (one live win line, history keeps captures, leases, unlocks, toys).
  - S16 copy rewrites (plus the `src/game` log lines from problem 38).
  - **S39** leak and copy test.
- **Code:**
  - S17 (one region-shaped room config).
  - S19's tooling moves (knobs as plain constants, `debug.ts` dev-only).
  - D20 (`bought()`).
- **Release:** S20 (release note, deploy cache), S29 (versions page without subjects; README spoiler cut), S30 (package version, old screenshots, V06 §7 note).

**Rejected or superseded:**
- S1 (generated curve) → S35.
- S2 / flat 3 → S32.
- S3, S4, S5 → S21/S32 and S38.
- S6 → S36.
- S7, S26 → S37.
- S8 → S34/S25.
- S9 → S33.
- S10, S13 → S42 (or S24).
- S11's engine rewrite, D10 → input fixes only.
- S12 → S27.
- S28 → S39.
- S31 → S36.
- D16's Cyclone cut → S40.

**Open questions for Josh (deduped):**
- **Q1 (settled by data unless he objects):** keep his 3 → 10 wins ramp. The time comes back through faster retries (S32), not fewer wins.
- **Q2 (conflict with his t20u ask):** auto-advance **per lot** (S34: one button per lot, priced like that lot's first lease) or **one Security Office lease per region** (S25, simpler, but not what he asked for)?
- **Q4:** fighter slots from tickets at the prize counter (as built), or Goodwill only?
- **Q6 (narrowed):** is a one-click [Spend it] on the away card enough for idle players (S38)?
- **Q7 (likely moot):** a boss pity ramp only if the S19 guard still trips after S35.
- **Q8 (narrowed):** OK to cut Shuffleboard (ours) and keep Cyclone (yours) with a tickets-only jackpot?
- **Q9 (conflict with his t21u map):** keep "pusher nets $, skee tickets, claw buffs" with a refilling float as the limit (S33), or switch to tickets-only arcade / buffs-only bar (S23)?
- **Q10 (conflict with his t21u ask):** arcade as its own full screen, one click from the Fun Zone shop with the header kept (S42), or inside the right column (S24)?
- **Q11:** paving boosts Goodwill per win only (S37, matches his Goodwill → Equity loop). OK?


## Pass 4 (Toad)

Evidence: a throwaway copy of `702ec59` in `/tmp` with env toggles; nothing from it is committed. Pass 3's variant D everywhere: fast climb deleted in `sim.ts:74` and `bot.ts:100`, retry after 6. Runs: `bun scripts/balance.ts 50 <seed> [--active] [--room] --pave=1`, seeds 1991 and 7. Rule for this pass: where a proposal conflicts with an answer Josh already gave, his answer is the default and the alternative becomes an open decision. Numbering continues: problems **55+**, solutions **S43+**, deletions **D31+**.

### 1. Problems (including in Pass 3's solutions)

**What checks out:** S32 (retry 6) reproduces exactly. Check-in Route 9 is 15h50 / 15h40, Galleria 36h52 / 37h23; active Route 9 12h34, Galleria 31h41; active + room Route 9 9h19, Galleria 21h28. S36 (Fun Zone at Outlet f1, $30K, machines gated on the lease) holds up: check-in leases it at **1h00** and active at **36:31**, and Big-Box isn't delayed.

55. **S37 (asphalt boosts Goodwill per win only) stalls the Bypass.** 50h check-in, seed 1991:

    | Asphalt | Paves | Galleria |
    |---|---|---|
    | As built (rent + stats + Goodwill, linear) | 15 (one every ~2h20) | 36h52 |
    | Rent + Goodwill, no stats | 11 | 39h33 |
    | All three at `asphalt^0.7` | 8 | **not reached** (Phase II at 37h21) |
    | **S37: Goodwill only** | **3** (run 2 takes 14h50) | **not reached** (Phase II at 34h43) |

    Fast reruns are how the Bypass gets its Equity, so any nerf to asphalt is also a Bypass retime. The loop is the one Josh asked for (t19u). The default is to keep it as built (decision 4).
56. **D18 (Commons −4 fights) undoes S32's pacing.** With S32 + S35, check-in Route 9 goes from 15h54 to **11h42**, well outside 15h ±1. The dead stretch (Problem 5) can't be fixed by cutting fights while Route 9 is on target. Note that the Commons has **18** fights, not 14 (correcting Pass 1 and Pass 2).
57. **S35's numbers don't clear S35's own guard.**
    - Big-Box 1.45 works: frontier loss goes from 0% to 5%.
    - Campus 7.3 brings its frontier from 66% only to **58%**, still above the 40% band.
    - Exit 14 2.2 changes **nothing** (37/34 either way). The Exit 14 losses come from the Bypass crew's cold start at dawn plus check-in's 10-minute looks, not from the jump. Active + room has 26% there.
    
    As specced, the CI gate would block every deploy from the day it lands.
58. **S38 [Spend it] reuses `crewAct`, which makes choices the player should make.** It buys patrols and slots, renovates the bot's lineup, and converts 50% of Goodwill to Equity (`bot.ts:65-100`). It also keeps `bot.ts` in the shipped bundle, which undoes S19's goal (today only `main.tsx`'s debug block pulls it in).
59. **S39 adds a dev dependency, a test-build hook in `tip()`, and a render harness at four game states**, all to detect leaks after the fact. The leak-prone strings are a short list (about 15, mostly tooltips in `Pylon.tsx`, `BackOffice.tsx`, `Shops.tsx:156-157`, `GameRoom.tsx`).
60. **The Security Office isn't a tank.** The Night Watchman is a control unit with a `mark` aura: enemies take +15% damage, and each renovation adds +4% (`battlers.ts:10`). Pass 2's S25 and Pass 3's S34 ("$0-rent tank", "+5% HP aura") are both wrong about it. Its renovations already have a job, so nothing new is needed when the patrol terms go.
61. **The "Losing?" hint can never show.** `Shops.tsx:162` checks `c.streak >= 2`, but with `FALL_BACK_AFTER = 1` `streak` never passes 1. S22 has to move it to `tries` along with the boss intro and the bot's Overtime check (S41).
62. **Active bosses still grind under D:** Galleria tries are **27** (active) and **28** (active + room), against 1–5 at check-in. S41 matters, and the guard should run the active row too, or it misses this.

### 2. Better solutions

S43. **Keep paving as built (fixes 55; replaces S37 and S26).** Josh asked for the loop, and the Bypass pace depends on it. If he wants fewer paves, the cheapest knob is the bot-free one: `asphaltGain` (one number). Re-time the Bypass in the same change.

S44. **Fill the dead stretch with an unlock that already exists, not cut fights (fixes 5, 56; replaces D18).** Move Cyclone's unlock from the Lifestyle capture (~6h50) to Commons fight 9 (~11h). One condition in `room.ts`. Pinball stays at the Office capture.

S45. **The guard is a flag, not a CI gate (fixes 57, 62; trims S19/S35).** `bun scripts/balance.ts --guard` checks frontier loss 10–40%, overall ≤ 12%, boss tries ≤ 6, and Route 9 14–16h, for check-in *and* active, on both seeds. It exits 1 on a miss. Run it in each milestone's "done when" step and before tagging, not on every deploy (copy fixes shouldn't wait ~90 s on balance). No new file. Campus needs one more number after S32 lands (7.3 isn't enough). Leave Exit 14 alone.

S46. **[Spend it] = renovations only, from one shared function (fixes 58).** Move the bot's "renovate the cheapest useful shop" loop into `economy.ts` as `renovateCheapest(s, r)`. The away card's button and the bot both call it. No patrols, slots, training or conversion, so the player's choices stay theirs, and `bot.ts` leaves the bundle with S19. Net lines ≈ 0.

S47. **A dawn copy table instead of a render harness (fixes 59; replaces S39).** Every string that may mention the Bypass, Equity or a second crew lives in one `DAWN` object in `content/bypass.ts`, and the UI reads them only from there. The test is a plain grep: the `LEAK` regex must not match any string literal in `src/` outside that file. That makes leaks hard to write instead of something caught afterwards, with no dependency and no `tip()` hook. The existing CUT regex scans `src/game/*.ts` too (Problem 38).

S48. **Arcade $ limit = one number (narrows S33).** Under Josh's map (the default), slow the pusher shelf refill from 1 coin / 3 s to 1 / 60 s. A full shelf (10) pays well and an empty one doesn't break even, so $/hr has a ceiling with no new state. Darts reuses the same shelf code. Goodwill and Equity machines (whac, pinball, pool) get floats only if the S45 guard's active + room row still runs fast.

### 3. Deletions

| Cut | Replaced by | Removes |
|---|---|---|
| D31. S37 / S26 asphalt rewrites, S7 modifiers | S43 (as built) | A Bypass retime nobody asked for |
| D32. D18 Commons cut | S44 | 4 fights' worth of tuning churn |
| D33. CI wiring of the balance guard; a separate `balance-guard.ts` | S45 flag on the existing script | A CI step and a file |
| D34. `crewAct` behind [Spend it]; `bot.ts` in the prod bundle | S46 | The bot's choices made in the player's name |
| D35. S39's `preact-render-to-string`, `tip()` registry, 4-state harness | S47 | A dev dependency and ~30 lines |
| D36. S33's per-machine floats (unless S45 says otherwise) | S48 | New `RoomState` fields |
| D37. S35's Exit 14 change | — | A number that did nothing |
| D38. `streak`, `FALL_BACK_AFTER`, the dead `streak >= 2` hint condition | S22 `tries` | 1 field, 1 knob, 3 readers |

## Final proposal for Josh (after Passes 1–4)

Defaults follow your earlier answers. Each conflicting alternative is an open decision below. Pass 3's running list above is superseded by this one.

### In v0.7

**Combat and pacing**
- Delete the fast climb. The crew retries the next fight after **6** farmed wins, above or below the frontier. The Security Office no longer shortens retries. Measured: losses drop from 22–58% to ~10% overall; Route 9 lands at 15h50 check-in / 12h34 active / 9h19 active + room; Galleria at 36h52 / 31h41 / 21h28.
- Your 3 → 10 wins ramp stays.
- One `tries` counter replaces `streak` and `FALL_BACK_AFTER`. The boss "walks out" line shows once, on his first attempt. The "Losing?" hint and the bot's Overtime check read `tries`.
- Wall fixes: Big-Box `LOT_JUMP` 1.259 → ~1.45, and Campus 8.59 → retuned until it's under 40% frontier loss. Exit 14 stays as is.
- Balance guard: `balance.ts --guard`, covering check-in and active on 2 seeds, run before each tag.

**Unlocks**
- Fun Zone at Outlet fight 1 for $30K (check-in ~1h00, active ~37 min). Every arcade machine also requires the lease.
- Cyclone unlocks at Commons fight 9 instead of the Lifestyle capture, to break up the long Commons stretch.

**Auto-advance (your per-lot ask)**
- One "Hire a patrol" button per lot on the lot track, priced at that lot's first lease (Parking Lot $50).
- The Patrol tab, discounts and the Security Office's price and retry roles go. The Night Watchman stays a $0-rent control unit (enemies take +15% damage).

**Offline**
- The away card leads with what came in, then **[Spend it]**: renovations only, through a shared `renovateCheapest()`.

**Arcade and bar (your reward map)**
- The coin pusher still nets $, skee pays tickets, the claw gives buffs. The pusher shelf refills 1 coin per 60 s (it's 3 s now), which caps $/hr. Darts uses the same shelf.
- The Cyclone jackpot pays tickets before and after dawn (no Equity branch).
- Video poker: four-color deck (♦ blue, ♣ green) with a hollow diamond. The receipt names the real hand.
- Cabinet input: a separate coin button, a READY beat, and pinball flipper labels. One SFX table. One animation loop for the room.
- Arcade stays its own full screen (your ask). Clicking the Fun Zone shop card opens it, and the plaza header stays visible.

**Receipt and copy**
- One live win line. The history keeps captures, leases, unlocks, toys and the away summary.
- Rewrite the explainer tooltips and the `src/game` log lines ("moves up on its own", "press ▸ when the crew is ready").
- Leak-proofing: all post-dawn strings move to one `DAWN` table, and a grep test fails on any Bypass, Equity or second-crew word anywhere else.

**Code**
- One region-shaped room config (the bar and the arcade use one code path).
- `knobs.ts` becomes plain constants, and the debug params go in a dev-only `debug.ts`.
- Delete the no-op `bought()`.

**Release**
- Versions page lists the tag plus date, and "Latest" shows `main @ sha` (no commit subjects, so no v0.5 spoiler).
- Cut "Then comes the Bypass." from the README.
- `package.json` takes the tag's version.
- Delete `screenshots/*.png` and `v2`–`v5`.
- The V06 §7 log note says the log is flat with a per-region cap.
- A v0.6 release note about where the screenshots are; deploy caches archived tags.

### Cut (not building)
- Flat 3 wins.
- Fall back after 2 losses, the boss pity ramp, the offline "hold at 70%" tracker.
- The generated power curve.
- The security budget slider.
- The hourly room cap and the 3× Attract rate.
- The live fight strip, marquee, arcade wall, back-bar and Ledger strip.
- The 3-engine rewrite of the mini-games and the headless-engine bot.
- The 2× card redraw.
- Playwright and render-to-string leak tests.
- The Fun Zone price-only move.
- Cutting 4 Commons fights.
- Per-pave lot modifiers and asphalt rewrites.
- The CI balance gate.
- `streak`, `FALL_BACK_AFTER`, `bought()`, the Patrol tab and patrol discounts.

### Open decisions for Josh
1. **Auto-advance:** a patrol per lot on the lot track (default, your ask) / one Security Office lease per region.
2. **Arcade rewards:** your map with a slower pusher refill as the $ cap (default) / tickets-only arcade and buffs-only bar.
3. **Arcade screen:** full screen, one click from the Fun Zone card (default, your ask) / inside the right column.
4. **Paving:** keep as built (default; the Bypass pace depends on it) / Goodwill-only asphalt (no Galleria within 50h) / diminishing `^0.7` (no Galleria within 50h).
5. **Shuffleboard** (ours, not yours): cut it and sell the 9th Bypass slot for Equity / keep it.
6. **Prize-counter fighter slots:** keep for tickets (as built) / move to Goodwill.
7. **Offline:** away card plus [Spend it] (renovations only) / away card only.
