# v0.9: The Bypass as New Game Plus

Design doc only. No game code is on this branch. The numbers come from throwaway balance-bot runs (`--knob` patches on a scratch worktree at v0.8's `bcf1f36`, not committed). Every run is 100h with seeds 1991 and 7 in three modes: check-in (`ci`, acts every 10 min), active (`ac`, `--active --every=10`) and arcade (`ar`, active plus `--room`).

Companion doc: `docs/V09_POLISH.md` (branch `v09-polish`) covers unlocking the Fun Zone and Off-Ramp sooner and keeping minigames relevant after the Bypass. This doc only touches those where they move the Bypass economy (see §9).

**Josh's direction (pt45u).** (a) a worse Goodwill→Equity rate and (c) steeper Bypass renovation costs. The Bypass is hidden like a prestige mode or new game plus, and it should take about **2× as long as Route 9**, through more battles and less growth between battles. Beating Route 9 is an accomplishment and repaving is the replay loop. The game is actually complete only after the Bypass. Completing it unlocks a full reset and a unique skill tree with permanent buffs for later runs.

**Decided (15 Nov 2026, Josh's answers to the Bypass card):**
1. **a + c**: a worse, flat Goodwill→Equity rate (10 → 20) and steeper Bypass renovations. "d" is ignored.
2. **Bypass renovation growth 1.50.**
3. **Ease check-in by raising the offline cap.** It's raised on the Bypass only: 8h → 12h after dawn (§5b).
4. **The arcade resets on the sale.** "Keep the room" becomes a Rolodex node, and the tree is repriced (§6, §7).
5. **The Bypass hides again until dawn** on later runs.
6. **Names are good in concept**, open to workshopping. Alternatives are in §7b.
7. **Wall limits OK**: ≤60% frontier loss per Bypass lot, ≤30 boss tries.

---

## 1. Problems

| # | Problem | Evidence (v0.8 main, 100h runs) |
|---|---|---|
| P1 | The Bypass is shorter than Route 9, not twice as long. | Ratio (Bypass length ÷ Route 9 time): ci 0.97 / 0.91, ac 0.81 / 0.57, ar 0.69 / 0.43. |
| P2 | Cash carries in, so renovations are trivial (t44u). | Cash is **already** per region (`s.crews[r].cash`); nothing carries over. Renovations feel trivial because Bypass rent compounds at ×1.2 per level while cost grows only ×1.35. The fix is the cost curve, not a bank split. |
| P3 | Equity is not the gate. | Goodwill-per-Equity at 20, 40 or 100 (flat) keeps the ratio inside the noise band (0.59–0.97). Leases and training never wait on Equity for long. |
| P4 | "More fights" alone makes it *shorter*. | Fights ×2 with the same total climb (growth rooted): 0.36–0.54. Wins ×2: 0.46–0.90. Each extra fight pays, and farming between fights is the slow part that got skipped. |
| P5 | Completing the Bypass leads nowhere. | `s.ending = 2` shows a win card. Then the crew farms the fight before the last boss forever. |
| P6 | Existing Bypass walls. | Galleria boss tries are already 54–67 on main (ci-7, ac-1991). Steeper renovations add a Campus wall (below). |

## 2. Target hours

Route 9 on main: ci ~15h, ac ~12.5–15h, ar ~10h. The Bypass opens at dawn (end of Route 9), so:

| Mode | Route 9 | Bypass length target (2×) | Bypass done at | Accept band |
|---|---|---|---|---|
| Check-in | 15h | ~30h | ~45h | 1.6–2.8× |
| Active | 12.5–15h | ~25–30h | ~40h | 1.6–2.8× |
| Arcade | 10h | ~20h | ~30h | 1.6–2.8× |

The band is wide on purpose: seeds 1991 and 7 differ by up to 0.6× on the same knobs.

## 3. What the knobs do (all experiment results)

Ratio = Bypass length ÷ Route 9 time, seed 1991 / seed 7. "reno" = renovation growth per level **on the Bypass only** (Route 9 stays 1.35). "f1.5" = 1.5× fights per Bypass lot with growth per fight rooted (`g^(1/1.5)`), so the total climb per lot is unchanged. "gpe" = Goodwill per Equity, flat. "dbl N" = diminishing rate: Equity's Goodwill price doubles every N Equity banked.

| Config | ci | ac | ar |
|---|---|---|---|
| main (v0.8) | 0.97 / 0.91 | 0.81 / 0.57 | 0.69 / 0.43 |
| gpe 20 / 40 / 100 | 0.70–0.97 | 0.61–0.91 | 0.59–0.75 |
| dbl 2000 | 0.71 / 0.71 | 0.94 / 0.79 | 0.95 / 0.85 |
| wins ×2 | 0.90 / 0.84 | 0.64 / 0.59 | 0.53 / 0.46 |
| fights ×2 | 0.52 / 0.54 | 0.44 / 0.36 | 0.51 / 0.44 |
| reno 1.45 | 1.77 / 2.69 | 1.16 / 1.06 | 1.28 / 1.02 |
| reno 1.50 | 2.62 / 2.41 | 1.97 / 1.55 | 2.17 / 1.63 |
| reno 1.55 | 3.59 / 3.97 | 2.76 / 2.25 | 2.64 / 2.39 |
| reno 1.50 + dbl 2000 | >5.6 (not done in 100h) | >5.6 | 4.38 / 3.99 |
| reno 1.50 + dbl 10000 | 4.77 / 4.94 | 4.90 / 4.54 | 3.09 / 3.35 |
| reno 1.50 + gpe 20 | 2.77 / 2.70 | 2.23 / 1.82 | 1.68 / 1.54 |
| reno 1.50 + f1.5 + dbl 10000 | 2.91 / 3.45 | 3.71 / 2.58 | 2.50 / 2.44 |
| reno 1.52 + f1.5 | 2.75 / 2.75 | 2.23 / 1.75 | 1.78 / 1.71 |
| reno 1.55 + f1.5 | 3.25 / 3.41 | 2.68 / 2.20 | 2.27 / 2.11 |
| reno 1.50 + Campus jump smoothed | 2.74 / 2.46 | 1.91 / 1.56 | 1.46 / 1.51 |
| reno 1.52 + f1.5 + gpe 20 | 3.01 / 2.69 | 2.42 / 2.01 | 2.28 / 2.16 |
| **reno 1.50 + f1.5 + gpe 20 (recommended)** | **2.50 / 2.46** | **2.24 / 1.64** | **1.71 / 1.62** |

Takeaways:
- **Renovation growth is the lever.** Every 0.05 adds roughly 1× to the ratio.
- **The diminishing rate is explosive with steep renovations.** Both squeeze the same resource late in the run and the effect multiplies: 3–5× ratios and runs that never finish. It is also hard to read on a button. Flat it is.
- **The rate (a) is about feel, not length.** Even at 20:1, Equity is rarely the bottleneck. It matters because leases and training stop being free, and Josh asked for it.
- **More fights are for feel too.** f1.5 alone shortens the Bypass, but paired with steeper renovations it gives Josh's "more battles, less progression between battles": smaller steps, more of them, and a slower economy feeding them.

## 4. Recommendation: the numbers

| Knob | Now | v0.9 |
|---|---|---|
| Bypass renovation growth (new `BP_RENO_GROWTH`) | 1.35 (shared) | **1.50** |
| Route 9 renovation growth `RENO_GROWTH` | 1.35 | 1.35 (unchanged) |
| `GOODWILL_PER_EQUITY` | 10 | **20**, flat |
| Bypass fights per lot (Exit 14 / Campus / Phase II / Galleria) | 10 / 12 / 14 / 16 | **15 / 18 / 21 / 24** |
| Bypass `FIGHT_GROWTH` per fight | 1.0825 | 1.0825^(1/1.5) ≈ **1.054** (same climb per lot) |
| Bypass shop unlock indices (which fight opens which unit) | per lot | ×1.5, same position in each lot |
| `WINS_FIRST` / `WINS_LAST` | 3 / 10 | unchanged (wins ×2 made it shorter) |

**Recommended config, per run:**

| Mode / seed | Route 9 | Bypass done | Bypass length | Ratio |
|---|---|---|---|---|
| ci 1991 | 15.2h | 53.4h | 38.1h | 2.50 |
| ci 7 | 15.1h | 52.2h | 37.1h | 2.46 |
| ac 1991 | 12.6h | 40.7h | 28.2h | 2.24 |
| ac 7 | 15.2h | 40.2h | 25.0h | 1.64 |
| ar 1991 | 9.6h | 26.1h | 16.5h | 1.71 |
| ar 7 | 10.3h | 26.9h | 16.6h | 1.62 |

Check-in comes out long (~37h against 30h) and arcade short (~16.5h against 20h). Steep renovations hurt the player who can't spend often. 1.52 evens nothing out: it lengthens all three. **Decided: 1.50.** Check-in is eased by the Bypass offline cap (§5b).

**Renovation cost curve.** `cost(L) = reno × growth^(L−1)`. Rent grows ×1.2 per level in both regions, so the payback time per level grows ×1.125 on Route 9 and ×1.25 on the Bypass.

| Level | Route 9 (×1.35) | Bypass now (×1.35) | Bypass v0.9 (×1.50) |
|---|---|---|---|
| 10 | ×15 | ×15 | ×38 |
| 20 | ×300 | ×300 | ×2,200 |
| 30 | ×6,000 | ×6,000 | ×127,000 |
| 40 | ×121,000 | ×121,000 | ×7,400,000 |

(Multiples of the unit's base `reno`.) `tierOf()` keeps reading `RENO_GROWTH`, since it ranks base prices, not levels.

## 5. More fights vs less growth between fights

Both, in one change: 1.5× fights with rooted growth (§4), so each fight is a smaller step and the economy behind it is slower. The bot shows the trade-off:

- **More fights alone**: the player gets paid more often and overshoots. Shorter.
- **Less growth alone** (steeper renovations): longer, but the steps are bigger and the walls are bigger.
- **Together**: the length comes from the economy and the texture comes from the fights. The walls are what is left (next).

**Walls (recommended config, frontier loss % / boss tries):**

| Lot | ci 1991 | ci 7 | ac 1991 | ac 7 | ar 1991 | ar 7 | main ci-7 |
|---|---|---|---|---|---|---|---|
| Exit 14 | 57% / 13 | 59% / 6 | 50% / 5 | 52% / 4 | 58% / 33 | 54% / 13 | 48% / 4 |
| Campus | **68% / 17** | **73% / 56** | 60% / 1 | 57% / 2 | 40% / 1 | 51% / 2 | 35% / 6 |
| Phase II | 38% / 9 | 37% / 3 | 44% / 9 | 40% / 5 | 37% / 18 | 41% / 2 | 40% / 11 |
| Galleria | 28% / 13 | 21% / 34 | 32% / 23 | 21% / 2 | 0% / 1 | 1% / 3 | 40% / **67** |

- Campus is the new wall: check-in spends 12–16h there (it's the ×4 `LOT_JUMP[1][1]`).
- Smoothing the jump to `[2, 2, 2.02, 0.45]` alone just moved the wall to Phase II (67–70%).
- So the build sets the Bypass `LOT_JUMP` by guard, not here: lower Campus's ×4 and raise Phase II until both are under the Bypass frontier limit.
- The Galleria boss gets better (67 → ≤34 tries) for free.

**New Bypass guard in `check.ts`** (Route 9 guard unchanged), seeds 1991 and 7, 70h:
- Bypass ratio 1.6–2.8× in every mode.
- Frontier loss ≤60% per Bypass lot (Route 9 is ≤50%; the Bypass is meant to be harder).
- Boss tries ≤30.

## 5b. Offline cap: Bypass-only, 8h → 12h

**Problem.** The cap can't move the 2.5× headline number. That number comes from the bot's standard check-in player, who acts every 10 minutes forever and never goes offline. So raising the cap leaves the Route 9 guard (15h ±1) untouched by construction. The cap matters for real people, who are away for longer than 8h: a workday or a night.

**How it was measured.** A scratch calendar mode for `balance.ts` (not committed):
- The player checks in for 30 minutes at fixed times of day and acts every 10 minutes during each session.
- Between sessions the game runs offline exactly like `simulateAway`, up to the cap. Anything past the cap is lost.
- Times are calendar hours from the first session (07:00).
- Recommended Bypass knobs, seeds 1991 / 7, check-in only.

| Schedule (gaps) | Cap pre-dawn / post-dawn | Route 9 | Bypass length | Ratio |
|---|---|---|---|---|
| 4 a day: 7, 12, 18, 22 (gaps 4.5–8.5h) | 8 / 8 (today) | 26.3h / 26.4h | 57.4h / 47.9h | 2.18 / 1.82 |
| | **8 / 12** | 26.3h / 26.4h | 53.0h / 53.4h | 2.01 / 2.03 |
| | 12 / 12 | 26.5h / 26.1h | 56.5h / 70.4h | 2.13 / 2.69 |
| Workday: 7, 18, 22 (gaps 10.5h, 3.5h, 8.5h) | 8 / 8 | 39.2h / 39.3h | 69.1h / 77.6h | 1.76 / 1.97 |
| | **8 / 12** | 39.2h / 39.3h | 69.4h / 68.2h | 1.77 / 1.73 |
| | 12 / 12 | 36.8h / 37.5h | 60.5h / 60.0h | 1.65 / 1.60 |
| Twice a day: 7, 19 (gaps 11.5h) | 8 / 8 | 49.2h / 50.1h | 96.1h / 94.3h | 1.95 / 1.88 |
| | **8 / 12** | 49.2h / 50.1h | **74.5h / 73.6h** | 1.52 / 1.47 |
| | 12 / 12 | 48.1h / 48.2h | 84.1h / 83.9h | 1.75 / 1.74 |
| (8 / 16 gave the same result as 8 / 12 on every schedule, since no gap is over 12h.) | | | | |

Reading it:
- **Route 9 is untouched by a Bypass-only cap.** The pre-dawn cap stays 8h, the Route 9 times in every row match, and the standard guard player (15.1–15.2h) never goes offline anyway.
- A **global** 12h cap moves calendar Route 9 by 1–2.4h on the long-gap schedules. That is why this doc scopes the cap to the Bypass.
- **Twice-a-day players gain the most:** the Bypass goes from ~95h to ~74h of calendar time (−22%).
- The workday seed 7 gains 9h, while seed 1991 is flat. The 4-a-day schedule only loses 0.5h a day at 8h, so its rows are within seed noise (±5–10h).
- 16h buys nothing over 12h for these schedules.
- In calendar time, real check-in schedules already land at **1.5–2.2×**. The 2.5× figure is the continuous-check-in worst case.

**Decided change.** Add `OFFLINE_CAP_BYPASS = 12 * 3600`. `simulateAway` uses it when `s.bypass` is set; before dawn it's still `OFFLINE_CAP_SECONDS` (8h). The away card's "capped at" line reads whichever applies. It's post-dawn, so the copy lives in `dawn.ts` and the leak rule holds.

**Still true:** the continuous check-in bot stays at ~2.5×. The thing that actually closes that gap is spending cadence, not offline time. Consultants with auto-renovation (§8b) are the candidate; the guard measures it in M4.

## 6. The full reset: "Sell to the REIT"

Mid-90s fiction: strip-center REITs went public in 1993–97 and bought plazas by the dozen. After the Galleria falls, a new button appears in the Bypass Back Office: **SELL TO THE REIT**. A REIT out of Hartford buys both plazas, mostly for paper. Uncle Sal keeps his Rolodex.

**Delete over add.** The reset is paving with a wider scope, not a new system:

| | Pave (today) | Sell to the REIT (new) |
|---|---|---|
| Route 9 crew, units, cash | reset | reset |
| Goodwill | reset | reset |
| Plaza Management | reset (it's a Route 9 unit) | reset |
| Bypass crew, units, cash | kept | **reset** |
| Equity | kept | **reset** |
| Asphalt, paves | kept / +gain | **reset to 0** |
| `s.bypass` (revealed) | kept | **reset**: dawn happens again |
| The room (machine unlocks, Attract, perks, shelf, buffs, jackpot, pusher field, Grapevine slips) | kept | **reset**, unless the *Keep the Room* node is bought |
| Tickets | kept | **reset**, unless *Keep the Room* |
| High-score boards and bests (names, not power) | kept | kept |
| Late cash sinks on both roads (consultants, landmarks, crew contracts, marketing; §8b) | Route 9's reset on pave | **reset** |
| Rolodex cards and nodes | — | **kept** |
| `stats` lifetime, sales count | — | kept, +1 sale |

- **Decided: the arcade resets on the sale.** The room survives *paving* (unchanged), but not the sale. Keeping it is the *Keep the Room* node (§7).
- This matters more now. V09_POLISH opens the Fun Zone at about 10–15 minutes, rebuilds a deeper prize counter with real ticket income, persists the coin-pusher field, and adds the bar's Grapevine slips. A room that carried all of that into run 2 would shorten Route 9 and the arcade Bypass noticeably.
- V09_POLISH §25 still says "the room survives the sale". That line is out of date and should be corrected on `v09-polish` (not edited from this branch).
- **Decided: the Bypass hides again until dawn.** The dawn reveal plays again, with a shorter card ("You know the way to Exit 14."). The leak rule doesn't change.

## 7. The skill tree: Uncle Sal's Rolodex (rebalanced)

**Currency: Rolodex cards**, paid only at the sale.
- `cards = 10 + min(paves this run, 5)`, so 10–15 per sale (unchanged).
- Plaza Management is not a source; its level resets on every pave.

**What changed in the rebalance:**
- **Added:** *Keep the Room*, priced as the tree's biggest node (8). After V09_POLISH, the room is a real engine: an early Fun Zone, a fed prize counter, persisted pusher coins and Grapevine slips.
- **Deleted:** *Contractor's Discount* (Bypass renovation 1.50 → 1.47). It bought back the decided curve.
- **Changed:** *Night Manager* now gives Route 9 the 12h cap that the Bypass gets by default (§5b), since the Bypass no longer needs it.
- **Moved:** WPNE to the Exit 14 branch, and Night Manager to Route 9.
- **Total:** 12 nodes, **39 cards** (was 34). About three sales fill the tree (10–15 per sale).
- **No prerequisites.** *Keep the Room* can be bought on the first sale for 8 of its 10–15 cards. That's a real choice: the room, or four or five smaller buffs.

| Branch | Node | Cost | Effect | Line |
|---|---|---|---|---|
| Route 9 | Friend on the Zoning Board | 2 | First lease of every Route 9 unit −50% | "He owes Sal for the variance." |
| Route 9 | Bulk Paint Account | 3 | Route 9 renovations −10% | "Forty gallons of Navajo White." |
| Route 9 | Old Paving Crew | 3 | Start each run with 20 asphalt | "Same guys. Same truck." |
| Route 9 | Night Manager | 3 | Pre-dawn offline cap 8h → 12h | "Sleeps on the cot by the safe." |
| Route 9 | Union Card | 4 | 6 starting fighter slots (`START_SLOTS` 5 → 6) | "Local 371 sends one more." |
| Exit 14 | County Assessor | 2 | First 1,000 Equity each run at the old 10:1 | "Reassessment is next year." |
| Exit 14 | WPNE 1490 AM Spot | 3 | +10% Goodwill per win | "Between the traffic and the polka hour." |
| Exit 14 | Retired Cop | 3 | Overtime gives +2 fights | "Thirty years in. Still has the stick." |
| Exit 14 | Uncle Sal's Keys | 5 | Plaza Management comes leased at Lv 1 after each dawn | "He never changed the locks." |
| Back Room | Cousin at the Sign Shop | 1 | Fixes the dead O. A starburst ray goes out instead. | "He did his best." |
| Back Room | Pager | 2 | Walk-ins every 60s (90s now, 75s with the perk) | "Beeps twice for a walk-in." |
| Back Room | **Keep the Room** | **8** | The Fun Zone, the Off-Ramp and everything in them survive the sale: machine unlocks, Attract, prize-counter perks and shelf, claw buffs, tickets, the pusher field, Grapevine slips | "The REIT didn't want the arcade. Nobody asked about the arcade." |

Per branch: Route 9 15, Exit 14 13, Back Room 11.

- **Overlap to watch:** WPNE (+10% Goodwill per win) sits next to V09_POLISH's permanent marketing. If marketing ships as a stacking Goodwill or rent buy, WPNE should become "your first marketing level is free each run" instead of a second Goodwill multiplier.
- **Pacing with the tree.** The bot doesn't model nodes yet. A full tree (with *Keep the Room*) should take Route 9 from 15h to ~10–11h and the Bypass from ~37h to ~28h in check-in. The build adds `--rolodex=all` and checks run 2: Route 9 ≥ 8h, Bypass ratio ≥ 1.4. It also adds `--rolodex=room` alone, because *Keep the Room* is the node most likely to flatten run 2.

## 7b. Name alternatives (working titles stay until Josh picks)

All grounded, dry and pre-1998. The leak grep (§10) gets whichever words are picked.

| Working title | Alternatives |
|---|---|
| **Sell to the REIT** (the reset) | Take the Buyout · The Closing · Sign Over the Deeds · Sell to the Pension Fund · Sale-Leaseback |
| **Uncle Sal's Rolodex** (the tree) | Sal's Little Black Book · The Back Booth · Who Sal Knows · Sal's Christmas Card List · The Favor Board |
| **Rolodex cards** (the currency) | Favors · Markers · IOUs · Business Cards · Handshakes |

They pair up naturally: The Closing / Sal's Little Black Book / Markers reads harder-edged. Sell to the Pension Fund / Sal's Christmas Card List / Favors reads warmer.

## 8. Interactions

- **Paving.** Unchanged, and it stays the inner loop of a run. Paving resets Route 9 while the Bypass keeps going. Paves now also pay Rolodex cards at the sale (cap 5). Old Paving Crew gives a head start on asphalt.
- **Plaza Management / Uncle Sal.**
  - Unchanged: 40 Equity to lease, +3% rent on both roads per level, resets on pave.
  - At 20:1 its lease costs 800 Goodwill instead of 400.
  - With steeper Bypass renovations, its +3% on Bypass rent is worth relatively more, which is fine since it's the same ~3%.
  - Uncle Sal's Keys makes him free after dawn on later runs. Sal "keeps his Rolodex" in the sale copy, which ties the tree to him.
- **Equity.**
  - Flat 20 Goodwill per Equity. `convert()` stays one line; only the knob changes.
  - Bypass leases and training cost twice the Goodwill they did.
  - Any copy that prints the rate must read it from the knob (the build checks the bank row).
  - Equity resets at the sale.
  - The County Assessor softens the start of each run without a diminishing curve.

## 8b. Late cash sinks inside the Bypass

V09_POLISH.md specifies the late-game cash sinks Josh picked:
- **consultants**, which run older lots, with an auto-renovation upgrade;
- **plaza landmarks**, big one-time buys with a small permanent buff;
- **crew contracts**, which sign or retain fighters at growing cost;
- **permanent marketing**, a stacking buy whose price keeps rising;
- **high-stakes tables**, pricier minigame plays.

Rival buyouts are cut. This doc only decides whether each applies inside the Bypass, which has its own bank (`s.crews[1].cash`). Today that bank has nothing to buy but renovations.

| Sink | On the Bypass? | Why / how |
|---|---|---|
| Consultants (run older lots) | **Yes**, paid in Bypass cash | Exit 14 and the Campus get farmed for hours while the crew pushes Phase II and the Galleria. Same rule as Route 9: price scales with the lot's rent. |
| Consultant auto-renovation | **Yes, with care** | It doesn't cut the 1.50 curve, only the spend cadence. That is exactly the check-in gap (2.5× continuous vs 1.9× active), so it's the real fix for check-in. It could also pull check-in toward active, so price it as a sink and let the Bypass guard (1.6–2.8×) decide. |
| Plaza landmarks | **Yes, a Bypass set** | Highway-scale, not plaza-scale: an interstate pylon at Exit 14, the Campus water tower, a Galleria billboard. Strings go in `bypass.ts`. Same small permanent buffs, priced off Bypass rent. |
| Crew contracts | **Yes** | Bypass training is paid in Equity, so contracts give Bypass cash a crew outlet without touching the Equity rate. |
| Permanent marketing | **Yes, per road** | Each road keeps its own levels and price curve, so a rich Route 9 can't buy Bypass marketing. Watch the overlap with the WPNE node (§7). |
| High-stakes tables | **Off-Ramp yes; Fun Zone stays Route 9** | The Off-Ramp already pays and charges Bypass cash, so its high-stakes plays drain the Bypass bank naturally. |

Rules for all of them:
- **Separate banks hold.** A Bypass sink is paid only from Bypass cash, and nothing transfers between roads.
- **Everything resets at the sale**, like the rest of each road. None of it is kept by a node.
- **The bot doesn't model them yet.** Sinks that buy buffs compete with renovations for Bypass cash, so the net effect on length is unknown. M4 re-measures, and `BP_RENO_GROWTH` stays at 1.50 unless the guard says otherwise.
- **Leaks:** Route 9 versions use Route 9 words only. Bypass versions live in `bypass.ts` and are shown only after dawn.

## 9. Interaction with V09_POLISH

- V09_POLISH unlocks the Fun Zone and Off-Ramp sooner. The arcade numbers above (16.5h Bypass) use v0.8's unlock times, so arcade will likely get *shorter*.
- **Order:** land polish first, then re-run §4 and tune `BP_RENO_GROWTH` (1.50–1.52) with the new guard.
- Minigame buffs that stay relevant after the Bypass (polish's job) shorten the Bypass in arcade mode. The same guard catches it.
- The room **resets** at the sale (§6) unless *Keep the Room* is bought. Polish's room additions (prize counter, pusher field, Grapevine slips) therefore reset with it. V09_POLISH §25's "room survives the sale" line should be updated to match.
- V09_POLISH's Fun Zone at ~10–15 minutes and the ticket retune make *Keep the Room* worth more. Its price (8) is set with that in mind and gets re-checked in M4.

## 10. Leak rules

- Before dawn: unchanged. No hint of the Bypass, Equity or a second crew. `DAWN_WORDS` and the `dawn.ts`/`bypass.ts` exemption stay.
- **Before the first sale: no hint of the sale or the tree.** No locked button, no "???" node, no Rolodex in the Back Office.
  - The SELL TO THE REIT button appears only when `regionDone(s, 1)`.
  - The Rolodex tab appears only once `s.sales > 0` (or the button is showing).
- All new strings go in a new `src/game/content/rolodex.ts`.
- `check.ts` gets `LATE_WORDS = /rolodex|reit|hartford|sell to the/i`, applied to every file except `rolodex.ts` and `debug.ts`, exactly like `DAWN_WORDS`.
- Node names that mention Exit 14 or Equity are in `rolodex.ts`, which is post-dawn by construction. Add `rolodex.ts` to the `DAWN_WORDS` exemption list.
- `bypass.ts` must not mention the sale, because the Bypass is shown before completion.

## 11. Change list

1. `knobs.ts`: add `BP_RENO_GROWTH = 1.50`; `renovateCost` uses it for Bypass units.
2. `knobs.ts`: `GOODWILL_PER_EQUITY` 10 → 20 (flat).
3. `content/bypass.ts`: Bypass lot fights 10/12/14/16 → 15/18/21/24, shop unlock fights ×1.5.
4. `knobs.ts`: Bypass `FIGHT_GROWTH` per-fight 1.0825 → 1.054 (rooted, same climb per lot).
5. `knobs.ts`: Bypass `LOT_JUMP` Campus ×4 down, Phase II up, tuned by the new guard.
6. `knobs.ts` + `sim.ts`: `OFFLINE_CAP_BYPASS = 12h`, used by `simulateAway` after dawn; pre-dawn stays 8h.
7. `check.ts`: Bypass guard (ratio 1.6–2.8×, frontier ≤60%, boss tries ≤30, seeds 1991/7, 70h).
8. `balance.ts`: a calendar mode (`--sched`, `--cap`) so the offline cap and real schedules are measurable.
9. `economy.ts`: `sellToReit()` resets both roads, Equity, asphalt, paves, `s.bypass`, the room and tickets, and pays cards. *Keep the Room* skips the room and tickets reset.
10. `state.ts`: `rolodex: { cards, nodes[] }`, `sales`; save migration defaults to empty.
11. `content/rolodex.ts`: sale copy, shorter repeat dawn card, 12 node names, lines and effects.
12. Back Office UI: SELL TO THE REIT button (Bypass done only) and the Rolodex panel (after the first sale only).
13. Node effects wired at their knobs: lease, renovation, asphalt, Route 9 offline cap, slots, convert, Goodwill per win, overtime, Plaza Management, walk-ins, sign, keep-the-room.
14. Sign: the dead-O fix plus the swapped dead ray for the cousin node.
15. Bypass versions of consultants (with auto-renovation), landmarks, crew contracts and marketing, paid in Bypass cash; Off-Ramp high-stakes tables.
16. `check.ts`: `LATE_WORDS` grep for the chosen names, plus `rolodex.ts` in the `DAWN_WORDS` exemption.
17. `balance.ts`: `--rolodex=all` and `--rolodex=room` flags and a run-2 check (Route 9 ≥ 8h, Bypass ratio ≥ 1.4).
18. Re-run §4 and §5b after V09_POLISH M2/M3 land (M4).

## 12. Decisions

**Decided (15 Nov 2026):**
1. a + c; "d" ignored.
2. Bypass renovation growth 1.50.
3. Check-in eased by the offline cap, Bypass-only: 8h → 12h after dawn.
4. The arcade resets on the sale; *Keep the Room* is an 8-card Rolodex node.
5. The Bypass hides again until dawn on later runs.
6. Names are good in concept: Sell to the REIT, Uncle Sal's Rolodex, Rolodex cards (working titles).
7. Bypass wall limits: frontier ≤60% per lot, boss tries ≤30.

**Still open:**
1. Final names: keep the working titles or pick from §7b.
2. Card formula `10 + min(paves, 5)` and the rebalanced costs (39 total, *Keep the Room* 8).
3. WPNE vs permanent marketing: keep +10% Goodwill, or change it to "first marketing level free"?
4. Consultant auto-renovation on the Bypass: ship it, accepting that it pulls check-in toward the active pace, subject to the guard?
