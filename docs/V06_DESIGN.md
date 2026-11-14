# Strip Mall Warlord v0.6: design (built; see §14 for what changed)

Status: **built and shipped as v0.6.** §14 has the final numbers and every place the build differs from this doc. Answers to the open questions are folded in (§13). v0.5 stays live and archived at `/v0.5/`. Numbers marked *(start)* are starting values. The balance bot sets the final ones, and a build doesn't merge until the §9 targets pass. Tone stays Sodium Night: 1997, Rt. 9, dry.

Principle: **delete before adding.** Every new system in this doc replaces an older one or reuses its code.

## 0. What v0.6 fixes
1. **Fights never lose** (diagnosis in `/workspace/smw-diag/`).
   - Kill counts keep the crew ~15–20 fights stronger than the fight it's on.
   - Every lot restarts at 1 enemy.
   - Each renovation gives ×1.10 HP *and* ×1.10 damage (×1.21 power), which outgrows enemies' ×1.14 per fight.
   - Every enemy hit lands on the front tank, and every heal lands there too. Over 4h of sims, 4 losses total.
2. **Auto-advance is handed out.** The Parking Lot is free and Security levels cover the rest.
3. **The right side of the screen is empty.**
4. **The receipt truncates**, and it has no history.
5. **Copy explains the design** ("fights run themselves") and **hints at the Bypass** ("this crew only", "Each crew has its own till", "Both crews" on Start over).
6. **Active play is thin.** It's −11% to the ending, and nothing gives a reason to look at the screen between purchases.

## 1. Build order (Josh: cleanup, then combat, then features)
| Milestone | Contents | Done when |
|---|---|---|
| **M1 Cleanup** | §2. No gameplay change. | `check.ts` passes, balance bot output identical to v0.5 (same seed), net line count down |
| **M2 Combat** | §3, §4, §5 (wins per fight, enemy count, targeting, renovation, lineup + slots, paid auto-advance) | §9 rows "check-in" and "active" hit target; loss rates in range |
| **M3 Screen** | §6, §7 (Back Office panel, receipt history, copy pass, "?" How to Play) | Playwright screenshots reviewed |
| **M4 Arcade** | §8.1–8.3 (Fun Zone unit, shared Game Room screen, 6 machines, prize counter, auto-play) | §9 "active + arcade" row hits target |
| **M5 Bar** | §8.4 (Bypass bar, 4 games, reusing M4 code) | Bypass rows hit target |
| **M6 Ship** | Art polish, sweep, versions page, tag v0.6 | Deploy succeeds without a manual re-run |

Each milestone is its own commit, so we can play M2 before the arcade exists.

## 2. M1 Cleanup (delete list first)
**Delete:**
- `docs/balance-*.txt` from git (~4,000 lines). `scripts/balance.ts` writes them to an ignored `out/` folder.
- Dead exports: `crewOf`, `Grid.crop`. `cleared()` uses `fightIndex()` instead of its own `findIndex`.
- Knobs: `SMW_S1` / `REGION_START`, `SMW_K` / `KILL_SCALE`, `killBase` (per lot), `KILL_RAMP`, `need`. M2 replaces them with one constant.
- `SECURITY_LEVELS` and the "zone 0 is always covered" rule in `autoCovers()`. Paid contracts replace them (§5).
- The shared 80-line log cap. The log becomes a per-region ring (§7).

**Unify Route 9 and the Bypass.** This removes ~20 `r === 0 / r === 1` branches.
- **Purse helpers:** `bal(s, r, cur)`, `canPay`, `pay(s, r, cur, n)`, `earn(s, r, cur, n)`, with `Currency = 'cash' | 'goodwill' | 'equity' | 'tickets'`. `lease`, `train`, `convert`, Overtime, contracts and the arcade all go through them, so there's one "Not enough X" message.
- **`RegionDef` gets data instead of branches:**
  - `leaseIn` (`cash` | `equity`) and `trainIn` (`goodwill` | `equity`);
  - `chrome` (`{ mgmt: 'PINEWOOD PLAZA MGMT', plaza: 'Pinewood Plaza', ... }`);
  - `room` (`arcade` | `bar`) and `roomShop`.
- **Split the three biggest files:**
  - `defs.ts` (309) → `content/battlers.ts`, `content/route9.ts`, `content/bypass.ts`, `knobs.ts`;
  - `scenes.ts` (453) → `art/storefronts.ts`, `art/field.ts` (+ `art/cabinets.ts` in M4);
  - `Lot.tsx` (276) → `Lot.tsx`, `Field.tsx`, `Calls.tsx`, `ZoneTrack.tsx`.
- **Rename** the Shops "Back office" boss strip to **Break Room** ("they quit and joined"), so "Back Office" is free for the new panel.
- **Fix the deploy workflow** so a new `v*` tag doesn't break the root deploy (a v0.5 known issue).

## 3. M2 Combat
| Change | v0.5 | v0.6 |
|---|---|---|
| Wins to clear a fight | 12–60 base, ×1.1 per fight (up to ~300) | **More and growing, but gentle:** regulars need `round(3 + 7 × g / (N − 1))` wins, where g is the fight's place on the region's ladder of N fights (3 at the first Parking Lot fight → 10 by the end of Route 9; the Bypass runs the same 3 → 10). Bosses need 1. Strength still decides: the balance bot checks the crew is never more than a few fights ahead of its power. |
| Enemies per fight | 1→5 inside each lot, reset every lot | **Grows across the region:** lot k (0-based) fights field `min(6, 1 + k + floor(2i / fights))` regulars. The boss brings `min(5, 2 + k)` escorts. A new lot's first fight has as many bodies as the last one before it, plus the ×1.3 lot jump, so it's a real step up. The boss is the peak of each lot. |
| Enemy targeting | always the first alive crew member (the tank) | **60% front tank, 40% a random fielded crew member.** *Hard*-tell enemies and bosses hit the **lowest-HP%** crew member. Confuse and stun are unchanged. |
| Renovation | ×1.10 HP and ×1.10 dmg, ×1.15 rent | **One stat per role:** tank HP ×1.15; damage dmg ×1.12; heal heal ×1.12; control and buffer aura +6% of base (×1.06). Rent ×1.12 *(start)*. The ▲ card readout shows that one stat. |
| Enemy growth | ×1.066 per fight, ×1.3 per lot (Route 9) | Per enemy ×1.05 per fight *(start)*, ×1.3 per lot, plus the count growth above. The bot tunes it so frontier fights land at §9 loss rates. |
| Fall back | after 3 losses, retry after 10 farmed wins | Same rule. Security Office levels shorten the retry (§5). |

Why it works: power now comes only from $ (renovations), Goodwill (training) and slots/lineup. Wins don't pile up into free power, so walls exist and the play calls, Overtime and the arcade have something to break.

**Healers matter now:** hits spread out, so "heal the worst off" stops dumping into the tank, and Dig In / a second tank become real choices against *hard* enemies.

## 4. M2 Fighter slots and lineup
- **Buffers stand on the curb**, a sprite row in front of the storefronts. They're always active, need no slot and can't be hit. Route 9 has 8 (5 shop buffers plus Supervisor, Outlet GM and Developer); the Bypass has 5 (Detailer, Wedding Planner and three bosses).
- **Fighters** (tank / damage / control / heal) take slots. You **start with 5**. Control units only apply their aura while fielded, so they compete for slots too.
- **Slot sources (cap 9 per crew):**

| Slot | Route 9 | The Bypass |
|---|---|---|
| 6 | Prize counter, 1,500 tickets | Back Office, 50 EQ |
| 7 | Prize counter, 6,000 tickets | Back Office, 500 EQ |
| 8 | Back Office, 2,000 Goodwill *(start)* | Shuffleboard board, #3 rank (§8.4) |
| 9 | Back Office, 20,000 Goodwill *(start)* | Back Office, 20K EQ |

- **Auto lineup (default on):** re-picks at every new fight, in this order:
  1. The best tank; two tanks if the fight has a *hard* tell.
  2. One healer; two once you have 7+ slots.
  3. Counters for the fight's weakness badges.
  4. The highest power (dps × HP) for the rest.
- **Manual:** each unit card gets **FIELD / BENCH**. Touching it switches that crew to "Your lineup" until you press **Auto** in the Lot header. Benched shops still pay rent.
- **The field shows only fielded fighters** (5–9 against 1–6). This deletes the 4-deep / 17px / half-row 25-sprite layout and "N DOWN".

## 5. M2 Auto-advance: Patrol contracts
- **Without a contract,** the crew fights and falls back on its own, but only ▸ moves it up.
- **A contract (per lot, bought once, $ from that crew's till)** makes the crew push the frontier on its own in that lot.
- **Prices *(start)*:** Parking Lot **$50**, sold from minute one (about a minute of play). Each later lot costs ≈15 min of the rent you'll have when you get there, fixed in `content/*.ts`. At v0.5 rents that's ~$75K for Big-Box and ~$40M for Lifestyle. The Bypass is priced in its own till.
- **Lots 2+ require the Security Office**, leased after the Parking Lot boss as now. It's the one that sells the contracts.
- **The Security Office stays at $0 rent** (Night Watchman fights).
  - Each level gives **−5% on contract prices** (cap −50% at Lv 10).
  - Retry-after drops from 10 to `max(3, 11 − level)` farmed wins.
  - It's a pure buff unit: renovating it is a choice, not a toll.
- **Idle players buy contracts** like anything else. The check-in bot buys a contract when it can afford one.

## 6. M3 Back Office panel (right side)
A tall panel in the empty right column, in the same glass/neon style. It has three tabs, and the active crew follows the region tab.
1. **TRAINING:** the five tracks (moved here; the old Training section is deleted), the slot purchases from §4, and, after the reveal only, the Bank.
2. **PATROL:** one row per lot showing COVERED / $price / LOCKED, plus the Security Office level and its discount.
3. **ARCADE** (Route 9) / **BAR** (Bypass):
   - Before the Fun Zone lease, it shows a FOR LEASE sign.
   - After, it shows each machine with its status (ready / cooldown / auto-play timer) and a big **Open the Fun Zone** button that takes over the main area (§8).

## 7. M3 Receipt, copy, How to Play
- **Receipt.** The collapsed view keeps the last 5 lines for the viewed region, each clamped to 2 lines (no "…" dead ends).
  - **Click it** (or press Enter) to unroll the paper downward: a scrollable history of the **last 60 lines for that region**, fully wrapped, with timestamps and ×n repeats.
  - Click again or press Esc to close.
  - The log becomes `log: Record<RegionId, LogLine[]>`, 60 each.
- **Copy cuts** (the delete list, with any new copy held to the same rule):
  - "· fights run themselves" (Lot header)
  - "· every shop pays rent and sends one crew member" (Shops header)
  - "· this crew only" (Training)
  - "Each crew has its own till." (Pylon tip, pre-reveal)
  - "Both crews…" on Start over before the reveal (it becomes "Every lease and all the Goodwill…")
  - the field legend line ("Front to back… Enemies hit the front first…")
  - "Bypass leases cost Equity" on cards
  - "Applies from the next fight. Stays until you c…" tooltips (cut to one line)
  - How to Play's "They run themselves…" (rewritten as rules, not reassurance)
- **Rule:** no line explains *why* something is designed, and nothing before dawn may imply a second crew, region or currency. `check.ts` gets a grep test for "crew only|each crew|both crews|Equity|Bypass" in pre-reveal strings.
- **"?" button** next to mute opens the same How to Play screen as the title. It becomes one component used in both places, and its text is updated for slots, contracts and the arcade.

## 8. M4–M5 The Game Room (arcade on Route 9, bar on the Bypass)
One DOM-free module `game/room.ts` holds every machine as data: `{ id, region, unlock, cost: {cur, n}, payout(skill, s), cooldownAfterBig, auto }`. One full-screen UI `ui/GameRoom.tsx` draws the room. Each machine is a canvas at **≥3× shop-tile size** (cabinet ~96×160 art px at integer scale). Locked cabinets are dark with a paper sign giving the requirement. Rules for every machine:
- **Play cost** scales with that crew's current rent (or Goodwill rate), so it never goes stale.
- **No hard time limits.** You can play as long as you like. A natural round length is fine (a 30s whack round, 9 balls).
- **Cooldowns only after big wins** ("being serviced"), so a jackpot can't chain.
- **Mouse and tap, one or two inputs.** No keyboard required (Space works as a bonus).
- **Auto-play ("Attract Mode")** is bought per machine with $. It plays one game at **40% skill** every **30 min** (Lv 1) → 20 → 12 min (Lv 3, the floor), and it runs offline. A manual player at ~70% skill gets **≥30× more per hour** from the same machine.
- **The room is a bonus, never a gate.** Nothing in the main game needs a machine. Check-in and idle targets (§9) are tuned with the room unused except Attract Mode.

### 8.1 Unlock: the Fun Zone
New Route 9 shop: **Fun Zone Arcade** at Big-Box fight 5, lease **$8K** *(start)*, rent $25/s. It hires the **Token Kid**, a damage role: 55 HP, 8 dmg, 0.9s ("Has a roll of quarters in a sock."). It opens the room with the Coin Pusher. Route 9 goes to 20 shops and 26 battlers.

### 8.2 The machines (Route 9)
| Machine | Unlock | Play | Cost | Pays | Big win / cooldown |
|---|---|---|---|---|---|
| **Coin Pusher** | Fun Zone lease | A drop chute slides left-right; click to drop. Coins that land flat in front of the pile push coins off the ledge. | 1 quarter = 5s of rent | **$**. ~0.9× cost at random, ~1.6× when timed. The shelf pile is the throttle: it refills 1 coin / 3s, so spamming drains it. | A gold **Rent Check** coin worth 2 min of rent; shelf refill 2 min |
| **Whac-a-Shoplifter** | Big-Box boss | 3×3 aisle grid, shoplifters pop up for 0.6–1.2s; don't bonk the customers (−2). 30s round. | 20s of rent | **Goodwill**: 0.5 wins' pay per bonk (~15 wins' worth per good round) | none |
| **Skee-Ball** | Outlet fight 6 | Click-hold for power, release; an aim needle sways. 9 balls. | 15s of rent | **Tickets**: 10–40 / game, 100s ring = +25 | 450+ score: +100 tickets, 1 min |
| **Claw Machine** | Outlet boss | Press to send the claw across, press to stop; grip chance 90% dead center → 20% at the edge. | **50 tickets** | **Timed buffs** (10 min of game time, same kind refreshes): Plush Bat +30% dmg; Rubber Duck +30% HP; Troll Doll walk-ins ×2; Bouncy Ball free Rally; rare Gold Watch 5 free Overtime fights | after any prize: restock 60s |
| **Pinball** ("Night Shift") | Office Park boss | Left/right half of the table = flippers; 3 balls; ramps light letters | 20s of rent | **Goodwill**: ~1 min of the Goodwill rate on a good game. **High-score board:** 5 house scores (SAL, DEV, …). Each one you beat gives **+6% Goodwill per win, forever** (max +30%). | none |
| **Cyclone** | Lifestyle boss | 24 lights chase a ring; click to stop on the JACKPOT light. Speed rises each play. | 15s of rent | Adjacent: 50 tickets; else 2–10. **Jackpot: progressive tickets** (starts 500, +5 per miss). **After the dawn reveal only**, the jackpot sign flips to EQUITY and also pays 15 min of the bank's Equity rate. | jackpot: serviced 10 min |

**Prize counter** (in the room, spends tickets; all permanent for Route 9):
- slot 6 (1,500) and slot 7 (6,000);
- Overtime −25% (800, ×2);
- Overtime lasts 4 fights (2,000);
- walk-ins every 75s instead of 90 (1,200);
- Attract Mode upgrades (300 / 900).

**What survives a pave:** tickets, prize-counter upgrades, high scores and Attract Mode levels. Machine unlocks re-earn by progress (same lots), and the Fun Zone must be re-leased.

### 8.3 How the room shortens the game
While you play, it roughly doubles the resource you're short on: $ via the pusher, Goodwill via whack and pinball, burst power via the claw, and slots and Overtime via tickets. Target: an active player who also plays the room reaches the Route 9 ending **30–40% sooner** than check-in (§9). The bot models it as "plays the room 50% of online time at 70% skill."

### 8.4 The Bypass bar: The Off-Ramp
New Bypass shop: **The Off-Ramp** (bar) at Exit 14 fight 4, lease **2 EQ** *(start)*. It hires the **Bartender**: tank, 180 HP, 6 dmg, 1.6s, takes 10% less damage ("Has heard it all. Hits back."). Same room screen, wood paneling and neon beer signs instead of carpet. Each game reuses an arcade control scheme:

| Game | Unlock | Reuses | Cost | Pays | Big win / cooldown |
|---|---|---|---|---|---|
| **Darts** | Off-Ramp lease | Cyclone/skee sway-and-click; 3 darts | 15s of Bypass rent | **$** (Bypass till), bull ×5 | 3 bulls: 2 min of rent; 1 min |
| **Pool** | Exit 14 boss | drag back to aim and set power; one rack, 6 shots | 20s of rent | **Equity** per ball sunk (~1 min of the Bypass win rate per good rack) | run the rack: +5 EQ ×lot; 3 min |
| **Video Poker** | Campus fight 6 | claw's buff table; Jacks or Better, click to hold, Deal | 10s of rent | **Timed buffs** by hand: pair J+ 5 min +10% dmg … four of a kind 10 min +30% all … royal flush 15 min +50% all | royal: 10 min |
| **Shuffleboard** | Phase II boss | skee-ball power + needle | 15s of rent | **Board ranks:** beat house scores for +6% Equity per win each (max +30%); rank #3 gives **slot 8** | none |

Same Attract Mode rules. The bar has no tickets: Bypass slots come from Equity and the shuffleboard. Target: active + bar takes the Galleria **~25–30% sooner** than active alone.

## 9. Balance targets (balance bot, seed 1991 + seed 7)
| Milestone | Check-in (acts every 10 min) | Active (every 10s: calls, Overtime, lineup) | Active + room |
|---|---|---|---|
| First win | < 1 min | < 1 min | < 1 min |
| Parking Lot boss | 12–18 min | 10–15 min | same |
| Fun Zone leased | ~50 min | ~40 min | ~40 min |
| Outlet | ~1.5h | ~1.3h | ~1.1h |
| **Route 9 ending** | **15h ±1h** | **~12.5h (−15–20%)** | **9–10.5h (−30–40%)** |
| Galleria (pave + convert) | ~35h | ~30h | ~22–25h |

- **Losses:** frontier attempts lose **10–30%** in every lot past the Parking Lot. Overall, 3–10% of fights are losses. Bosses take **1–4 attempts** for a check-in player.
- **Idle** (buys everything affordable including contracts, auto lineup, never plays the room) stays within +10% of check-in. Nobody stalls for more than 90 min without a fight cleared.
- **Offline:** 8h cap and full rate unchanged. Attract Mode runs offline, and timed buffs tick in game time, so they're mostly spent while you're there.
- **$ split** (check-in): renovations 70–85%, leases 5–15%, contracts 3–8%, and Overtime + room only for active players. That gives $ three real jobs instead of one.

**Knobs** (all in `knobs.ts`; the bot sweeps the *(start)* ones): `WINS_TO_CLEAR=3`, `FIGHT_GROWTH`, `LOT_JUMP`, `RENT_GROWTH`, `RENO_GROWTH`, `MAIN_STAT_GROWTH`, `PAY_BASE/GROWTH`, contract minutes, room cost-seconds and payouts.

## 10. Currencies (one purse API)
| Currency | Shown | Comes from | Goes to |
|---|---|---|---|
| **$** (per crew till) | always | rent; Tip walk-ins; Coin Pusher; Darts | Route 9 leases, renovations, Patrol contracts, Overtime, room plays, Attract Mode |
| **Goodwill** | always | Route 9 wins; Referral walk-ins; Whac; Pinball (+ board %) | Route 9 training, slots 8–9; the Bank (after the reveal) |
| **Tickets** | once Skee-Ball unlocks | Skee-Ball; Cyclone; Attract Mode | Claw plays, prize counter |
| **Equity** | **after the reveal only** | the Bank (10 GW → 1); Bypass wins; Pool; Cyclone jackpot (post-reveal); Shuffleboard % | Bypass leases, training, slots |
| **Asphalt** | after a pave | paving Route 9 | nothing; +2% Route 9 rent, stats, Goodwill |

Rule of thumb: $ builds buildings and buys convenience (contracts, Overtime, plays). Goodwill trains Route 9. Tickets buy permanent arcade perks. Equity grows the Bypass.

## 11. Art list (Sodium Night palette, 1px outline, integer scale)
- **Room backgrounds (2):** Fun Zone (patterned carpet, black-light glow, change machine, prize counter with plush wall); The Off-Ramp (wood paneling, neon beer signs, jukebox, TV on a bracket).
- **Cabinets (6), each ~96×160 with a lit and dim state plus a locked/dark variant:** Coin Pusher (glass dome, shelf, coin sprites), Whac (mole-hole aisles; shoplifter and customer sprites, 2 frames each), Skee-Ball (lane, rings, ball), Claw (glass box, claw 3 frames, 5 prize sprites), Pinball "Night Shift" (playfield, flippers, backglass with a sodium lamp), Cyclone (ring of 24 lamps, jackpot marquee in TICKETS and EQUITY versions).
- **Bar (4):** dartboard + darts; pool table top-down with 15 balls and a cue; video poker cabinet with card faces (4 suits, 13 ranks, built procedurally); shuffleboard table with pucks.
- **Two storefronts and two hires:** Fun Zone facade (+ Token Kid), The Off-Ramp facade (+ Bartender).
- **UI:** the curb row for buffers; the Back Office panel frame and 3 tab plates; FIELD / BENCH chips; receipt unroll (a long-paper sprite with a torn edge); the "?" button; ticket and slot icons.
- **Audio** (procedural, reuses `audio.ts`): coin clinks, a ticket chatter, a claw whine, flipper thocks, a jackpot bell, a dart thunk, a pool break, a card flip.

## 12. Risks
- **Balance is the whole release.** Removing kill counts changes every curve. Mitigation: M2 ships alone and only merges when §9 passes on two seeds.
- **The room could become mandatory** if its payouts are too high or check-in is tuned assuming it. Mitigation: check-in and idle are tuned with the room off except Attract Mode, and the room's numbers only move the "active + room" row.
- **Six machines plus four bar games is a lot of UI.** Mitigation: one `room.ts` data shape, one `GameRoom.tsx`, and three shared control schemes (timed stop, power + aim, grid tap). Pool's ball physics is the one real new system, and it's shared with pinball. If it runs long, pinball and pool ship last in M4/M5.
- **Lineup UI on mobile:** FIELD / BENCH on cards stays tappable; there's no drag-and-drop.
- **Saves:** v0.5 saves can't map onto the new curves. On load, the old save is copied to the `smw-v0.5:` key, so it keeps running at `/v0.5/`, and the root starts fresh with a title notice.
- **Spoilers:** the Equity jackpot flip and the bar must not leak pre-reveal. Covered by the `check.ts` string test and a pre-reveal screenshot set.

## 13. Josh's answers (locked)
1. **Wins to clear a regular fight:** more, and growing with progression, gently (3 → 10, bosses 1). Verified by the bot: losses at walls stay 10–30% and the crew never sits far behind its power.
2. **The claw costs tickets.**
3. **Arcade progress survives paving** (tickets, prize-counter perks, high scores, Attract Mode levels, machine unlocks).
4. **Parking Lot contract: $50 from the start.**
5. **9-slot cap as specced** (Route 9: 2 prize counter + 2 Goodwill; the Bypass: 3 Equity + shuffleboard).

## 14. As built (v0.6)

### 14.1 Final balance (balance bot, `--pave=1`, 50h)
| Milestone | Check-in 1991 / 7 | Idle 1991 / 7 | Active 1991 / 7 | Active + room 1991 / 7 | Target (check-in / active / +room) |
|---|---|---|---|---|---|
| Parking Lot boss | 14:47 / 17:02 | 14:47 / 17:02 | 14:00 / 11:45 | 14:00 / 11:45 | 12–18 / 10–15 min |
| Fun Zone leased | 23 min | 23 min | 19 min | 19 min | ~50 / ~40 min **(early)** |
| Outlet | 1h30 / 1h34 | 1h32 / 1h21 | 1h03 / 1h09 | 1h01 / 1h00 | ~1.5h / ~1.3h / ~1.1h |
| **Route 9 ending** | **14h39 / 15h05** | 14h10 / 15h39 | **12h15 / 12h43** | **9h59 / 10h23** | 15h ±1 / ~12.5h / 9–10.5h |
| Galleria | 34h43 / 36h05 | 33h46 / 37h01 | 27h30 / 28h22 | 20h00 / 18h10 | ~35h / ~30h / 22–25h |

- Losses: frontier fights lose 13–46% per lot (above the 10–30% band at the Commons and on the Bypass). Counting every fight, Route 9 lots lose 5–31% and the Bypass 4–44%; the overall 3–10% target is missed (the crew falls back to farm after one loss, and farm wins don't cover it).
- Bypass bar: active + room takes the Galleria 27% (1991) and 36% (7) sooner than active alone (target 25–30%).

### 14.2 Where the build differs from this doc
- **Combat:** fight strength is normalized by threat (sum HP × sum DPS of the enemy group), so adding enemies doesn't spike a fight. Enemy targeting is deterministic and spread: 60% of hits go to the front tank, the rest rotate; bosses hit the lowest-HP fighter, hard hitters do 75% of the time. One loss drops the crew back a fight (`FALL_BACK_AFTER = 1`). A purchase no longer forces a retry.
- **Renovations:** tanks gain HP only; everyone else gets main stat ×1.1 and HP ×1.08 per level. Shops have tiers (`tierOf`).
- **Knobs:** `RENT_GROWTH` 1.2, `RENO_GROWTH` 1.35; `FIGHT_GROWTH` Route 9 `[1.6, 1.07…]`, Bypass `[1.66, 1.0825…]`; `LOT_JUMP` Route 9 `[2, 1.259, 1.103, 1.286, 0.619, 1.089]`, Bypass `[2.5, 8.59, 1.01, 0.45]`. Patrol prices Route 9 $50 / 40K / 100K / 250K / 4M / 15M; Bypass 500 / 50K / 80K / 2M.
- **Balance bot:** check-in also acts every minute for the first 30 minutes (a new player watches the start).
- **The room:** machine unlocks survive a pave without re-leasing the Fun Zone (Josh's answer 3). Attract Mode Lv 1 costs 10 minutes of rent; at the bar, Lv 2/3 cost $ (30/90 minutes of Bypass rent) because the bar has no tickets.
- **Coin Pusher:** pays 0.4–3.0× its cost by timing and the shelf; the Rent Check is a rare 2-minute-of-rent drop on a near-perfect play.
- **The bar:** Pool pays 1.2 wins of Equity per ball (running the rack: 10 wins + 5 × lot). Video Poker buffs: Jacks or Better / two pair +10% dmg 5 min; trips / straight / flush +20% 8 min; full house / quads +30% dmg and HP 10 min; straight or royal flush +50% 15 min (10 min out of service). Shuffleboard: six pucks, 4/3/2/1 zones, house scores 10–22; each beaten is +6% Equity per win, the third adds the Bypass's 9th slot.
- **Not built:** bar and arcade sound effects beyond the register/jingle, the jukebox / TV / change-machine room props.
