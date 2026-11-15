# v0.9: The Bypass as New Game Plus

Design doc only. No game code is on this branch. The numbers come from throwaway balance-bot runs (`--knob` patches on a scratch worktree at v0.8's `bcf1f36`, not committed). Every run is 100h with seeds 1991 and 7 in three modes: check-in (`ci`, acts every 10 min), active (`ac`, `--active --every=10`) and arcade (`ar`, active plus `--room`).

Companion doc: `docs/V09_POLISH.md` (branch `v09-polish`) covers unlocking the Fun Zone and Off-Ramp sooner and keeping minigames relevant after the Bypass. This doc only touches those where they move the Bypass economy (see §9).

**Josh's direction (pt45u).** (a) a worse Goodwill→Equity rate and (c) steeper Bypass renovation costs. The Bypass is hidden like a prestige mode or new game plus, and it should take about **2× as long as Route 9**, through more battles and less growth between battles. Beating Route 9 is an accomplishment and repaving is the replay loop. The game is actually complete only after the Bypass. Completing it unlocks a full reset and a unique skill tree with permanent buffs for later runs.

> **Flag: "a c and d".** "d" was "leave it", which contradicts a and c. This doc reads the message as **a + c** and treats "d" as "leave everything else (Route 9, paving, the room) as it is". If d meant something else, say so; it changes nothing below except that line.

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

Check-in comes out long (~37h against 30h) and arcade short (~16.5h against 20h). Steep renovations hurt the player who can't spend often. 1.52 evens nothing out: it lengthens all three. The Night Manager node (§7) narrows the gap on later runs. Decision 3 asks whether to accept this.

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
| The room (unlocks, Attract, perks, shelf, boards, jackpot) | kept | **kept** (same rule as paving) |
| Tickets | kept | kept |
| Rolodex cards and nodes | — | **kept** |
| `stats` lifetime, sales count | — | kept, +1 sale |

- Josh asked "maybe minigame unlocks?" The room already survives paving, so the cheapest answer is that it survives the sale too. No "coupon book" node is needed.
- One caveat: a full room makes the second Route 9 faster in arcade mode. V09_POLISH moving unlocks earlier makes this smaller anyway. Decision 4.
- The dawn reveal plays again, with a shorter card ("You know the way to Exit 14."). The Bypass is still revealed at dawn and hidden before it, so the leak rule doesn't change.

## 7. The skill tree: Uncle Sal's Rolodex

**Currency: Rolodex cards**, paid only at the sale.
- `cards = 10 + min(paves this run, 5)`, so the first sale pays 10–15.
- That rewards the existing replay loop (repaving) inside a run without making the player grind it.
- Plaza Management is not a source; its level resets on every pave, so it would just reward stalling.

**Nodes: 12 in three branches, 34 cards total.** About three sales fill the tree. Costs rise down each branch; any order inside a branch. Pre-1998 and dry.

| Branch | Node | Cost | Effect | Line |
|---|---|---|---|---|
| Route 9 | Friend on the Zoning Board | 2 | First lease of every Route 9 unit −50% | "He owes Sal for the variance." |
| Route 9 | Bulk Paint Account | 3 | Route 9 renovations −10% | "Forty gallons of Navajo White." |
| Route 9 | Old Paving Crew | 3 | Start each run with 20 asphalt | "Same guys. Same truck." |
| Route 9 | Union Card | 4 | 6 starting fighter slots (`START_SLOTS` 5 → 6) | "Local 371 sends one more." |
| Exit 14 | County Assessor | 2 | First 1,000 Equity each run at the old 10:1 | "Reassessment is next year." |
| Exit 14 | Contractor's Discount | 3 | Bypass renovation growth 1.50 → 1.47 | "Cash, no invoice." |
| Exit 14 | Retired Cop | 3 | Overtime gives +2 fights | "Thirty years in. Still has the stick." |
| Exit 14 | Uncle Sal's Keys | 5 | Plaza Management comes leased at Lv 1 after each dawn | "He never changed the locks." |
| Back Room | Night Manager | 2 | Offline cap 8h → 12h (`OFFLINE_CAP_SECONDS`) | "Sleeps on the cot by the safe." |
| Back Room | Pager | 3 | Walk-ins every 60s (90s now, 75s with the perk) | "Beeps twice for a walk-in." |
| Back Room | WPNE 1490 AM Spot | 3 | +10% Goodwill per win | "Between the traffic and the polka hour." |
| Back Room | Cousin at the Sign Shop | 1 | Fixes the dead O. A starburst ray goes out instead. | "He did his best." |

- The Night Manager is the check-in player's node (it targets the §4 gap).
- The cousin is a 1-card joke, so the first sale always buys something.

**Pacing with the tree.** The bot doesn't model nodes yet. Rough expectation: a full tree takes Route 9 from 15h to ~10–11h and the Bypass from ~37h to ~28h in check-in. Each later run is shorter, but never trivial: the 2× shape stays. The build adds a `--rolodex=all` bot flag and checks run 2 with a full tree: Route 9 ≥ 8h, Bypass ratio ≥ 1.4.

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

## 9. Interaction with V09_POLISH

- V09_POLISH unlocks the Fun Zone and Off-Ramp sooner. The arcade numbers above (16.5h Bypass) use v0.8's unlock times, so arcade will likely get *shorter*.
- **Order:** land polish first, then re-run §4 and tune `BP_RENO_GROWTH` (1.50–1.52) with the new guard.
- Minigame buffs that stay relevant after the Bypass (polish's job) shorten the Bypass in arcade mode. The same guard catches it.
- The room survives the sale (§6), so anything polish adds to the room carries into later runs. Polish should know that.

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
6. `check.ts`: Bypass guard (ratio 1.6–2.8×, frontier ≤60%, boss tries ≤30, seeds 1991/7, 70h).
7. `economy.ts`: `sellToReit()` = pave both regions + Equity/asphalt/paves/bypass to 0, + cards; room and tickets kept.
8. `state.ts`: `rolodex: { cards, nodes[] }`, `sales`; save migration defaults to empty.
9. `content/rolodex.ts`: sale copy, shorter repeat dawn card, 12 node names, lines and effects.
10. Back Office UI: SELL TO THE REIT button (Bypass done only) and the Rolodex panel (after the first sale only).
11. Node effects wired at their knobs: lease, renovation, asphalt, slots, convert, Bypass renovation, overtime, Plaza Management, offline cap, walk-ins, Goodwill per win, sign.
12. Sign: the dead-O fix plus the swapped dead ray for the cousin node.
13. `check.ts`: `LATE_WORDS` grep, plus `rolodex.ts` in the `DAWN_WORDS` exemption.
14. `balance.ts`: `--rolodex=all` flag and a run-2 check (Route 9 ≥ 8h, Bypass ratio ≥ 1.4).
15. Re-run §4 after V09_POLISH lands; final `BP_RENO_GROWTH` between 1.50 and 1.52.

## 12. Open decisions for Josh

1. **"a c and d"**: is d really "leave it"? This doc assumes a + c, and everything else unchanged.
2. **Renovation growth 1.50 vs 1.52.** 1.50 lands at 2.5× / ~1.9× / 1.65× (ci/ac/ar); 1.52 at 2.85× / 2.2× / 2.2×.
3. **Accept check-in at ~2.5× (37h Bypass) while arcade is ~1.65×?** Or ease check-in, e.g. offline cap 8h → 10h for everyone.
4. **The room survives the sale** (same as paving)? Or reset the room and put "keep the room" on a node?
5. **Re-hide the Bypass until dawn on later runs** (proposed), or leave it open from the start?
6. **Card formula** `10 + min(paves, 5)`: OK? A full tree takes about 3 sales.
7. **Names**: "Sell to the REIT", "Uncle Sal's Rolodex", Rolodex cards, the 12 nodes.
8. **Bypass wall limit**: frontier ≤60% (Route 9 is ≤50%) and boss tries ≤30 (Route 9 is ≤12)?
