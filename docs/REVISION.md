# Revision v0.2: three passes of problems, solutions, cuts

Method (Josh's rule): (1) identify every problem, (2) find a clever solution, (3) delete before adding. The plan was listed before any code changed. Each pass critiques the plan from the pass before it.

Baseline v0.1 (greedy bot, acts every 10s, seed 1991): Parking Lot 3:21, Big-Box 7:52, Outlet 19:44, then a wall in the Lifestyle Center (rows 4–7 of 8 from 25 to 60 min). **A Dojo-only bot did as well or better**: Lot 5:39, Big-Box 10:20, Outlet 38:10, and it reached Lifestyle row 6/8 at 60 min, ahead of the mixed bot's 4/8. That's the main proof that composition didn't matter.

v0.1 system count: 19 (shops, fighters, training timers, bench caps, bench bonus, squad draft/size, gear, fixer debuff, stun/DoT/dodge specials, leasing, duplicate-cost scaling, zones/rows, win pay, loss rent, fall-back-a-row, heat meter + decay, raids, prestige with a two-term formula and two bonuses, offline).

---

## Pass 1: problems in v0.1

| # | Problem | Clever solution | Deletes | Adds |
|---|---|---|---|---|
| 1 | Composition doesn't matter. Dojo spam wins. | **Weak-to counters.** Every enemy names one crew type that hits it ×2.5. Everyone else hits it ×0.5. | dodge, stun, DoT, fixer debuff (the specials that blurred roles) | one `weak` field per enemy |
| 2 | Five overlapping stat multipliers (level, bench, gear ×3, fixer debuff, asphalt ×2). Nobody can read a fight. | Keep one: storefront level. | gear system, bench bonus, fixer debuff | — |
| 3 | Roster ≠ squad ≠ cap. Fighters sit on a hidden bench, and the draft order is hidden. | **One storefront = one crew member.** The shop *is* its fighter. Slots become the only limit and the core decision. | training timers, bench caps, squad size, squad draft, roster state | — |
| 4 | The pawn shop has two jobs (fixers + random auto-equipped gear with no agency). | Pawn just fields Fixers. | gear.ts, gear panel, pawn clock | — |
| 5 | Three ways to get slots (lease, duplicates at ×2.2, captures). | Captures are the only way to grow. Delete leasing. All 4 home units start vacant. | leasing, lease costs, "for lease" state | — |
| 6 | Heat is mostly upside (raids pay 3×). | Heat is just the price of Payday: a visible % added to enemy strength. | raids, raid enemies, heat reward bonus | — |
| 7 | Losses don't hurt (rent is noise, and the crew ping-pongs a row). | Make a loss *diagnose* itself: the log says which counter you're missing. | — | loss reason line |
| 8 | Fights are unreadable. | Enemy tokens show a "weak to" chip in that crew type's color, and hits show a damage number. | Crew panel (redundant once shop = fighter) | weak chip, damage number |
| 9 | Lifestyle wall, and the prestige panel is easy to miss. | Put Bulldoze at the end of the zone track as a 5th stop. | separate prestige panel | — |
| 10 | "Buy the cheapest upgrade and wait." | Flatten: one geometric curve for cost and one for income/stats, with no 10-level doublings. | LEVEL_INCOME doubling rule | — |
| 11 | Code: module-global `carry` in `tick()` is shared across states (bug after a bulldoze, and in the bot). | The UI loop owns its accumulator. Delete `tick()`. | `tick`, module state | — |
| 12 | Code: `fmt` lives in the sim, and `economy.log` noise. | Move formatting to `ui/format.ts`. | — | — |
| 13 | UX: 3 cramped columns and sign text noise. | 2 columns: Plaza and The Lot. | right column | — |

Net after Pass 1: −13 systems, +2 (counters, loss reason). About 8.

## Pass 2: problems in the Pass 1 plan

| # | Problem the plan creates or leaves | Solution | Deletes | Adds |
|---|---|---|---|---|
| 14 | One fighter per shop locks you in. The Lifestyle Center needs a different crew than the Lot, and with no way to change, early picks become traps. | **Rebrand:** a storefront can be any shop. Renovation levels belong to the *building*, so rebranding keeps the level and costs the new shop's opening fee. | close/refund logic (never built) | rebrand button (reuses the open buttons) |
| 15 | If upgrade cost depends on shop type, rebranding to Dojo to renovate cheaply and back is an exploit. | Renovation cost depends only on level ($20 × 1.3^(L−1)). | per-type upgrade bases | — |
| 16 | Three currencies of reward (win pay, rent, asphalt formula with an earnings term) blur what fights are for. | **One source per currency:** cash ← shops only, slots ← captures, asphalt ← rows taken. | win pay, loss rent, √earnings term | — |
| 17 | Fall-back-a-row plus rent existed to punish losses. With no rent, falling back just adds noise. | Loss = retry the same row after the regroup. The cost of losing is being stuck, which counters (#1) and the loss reason (#7) explain. | fall-back rule, separate loss regroup timer | — |
| 18 | Heat as a decaying meter is a hidden timer. | Heat is derived: +4% enemy strength per Payday level you own. Rebrand away and it's gone. | heat state, heat decay | — |
| 19 | Two asphalt bonuses (shop speed + crew stats). | One bonus: +5% to everything (income and crew stats) per asphalt. | second bonus | — |
| 20 | Holding the region repeats boss fights for pay nobody needs. | Once the region falls, fighting stops. The track says "Pave it." | post-win farming | — |

Net after Pass 2: about 8, with rebrand added and win pay, rent, fallback and heat decay cut.

## Pass 3: problems in the Pass 2 plan

| # | Problem | Solution | Deletes | Adds |
|---|---|---|---|---|
| 21 | Counters could make every zone "rebrand everything to X." | Enemies hit the *front* crew member. Without Bouncers, glass cannons die. Without a Medic, long fights are lost. Lifestyle mixes all three weaknesses. A good crew is tank + medic + the right counters, and the slot count makes that tight. | — | — |
| 22 | Hustler, Fixer and Lawyer could feel identical apart from color. | Distinct profiles: Hustler fast/fragile, Fixer steady, Lawyer slow/huge hits. Each card states *who* they counter in plain words. | — | (text only) |
| 23 | The Payday tradeoff: Lawyers are needed at the Outlet, and Payday brings Heat. Is that a trap? | It's the intended tension: the best income and the key counter both make every fight harder. The Heat meter states the exact %. | — | — |
| 24 | Early game with 1 slot is a 1v1 a Bouncer can't win (×0.5). | Intended first lesson: open a Vape Shop ($50) in Unit B. The loss reason says "needs a Hustler." All 4 units are open from the start (#5). | — | — |
| 25 | Stalemate when the crew can't deal damage (all Medics). | Keep the 30s timeout, which already counts as a loss with a reason. | — | — |
| 26 | The offline summary listed raids, rent and trained crew, which no longer exist. | Summary = earned, W/L, rows taken, lots captured. | 4 summary rows | — |
| 27 | The bot can't play the new game (it needs to rebrand). | The bot plans a crew per zone (1 Bouncer per 4 slots, 1 Medic from 3 slots, the rest counters), keeps matching shops, rebrands the rest. Add a `--strategy=dojo|static` bot to prove choice matters. | old greedy weights | strategy flag |

### Final plan (implemented)
- **Kept (8 systems):** shops-as-fighters (5 types), counters (`weak`), rebrand, zones/rows with capture → slots + unlock, derived Heat, prestige (rows → asphalt, one bonus), offline replay, fight timeout + loss reason.
- **Deleted (14):** training timers, bench caps, bench bonus, squad size/draft, gear, fixer debuff, stun/DoT/dodge, leasing, duplicate-cost scaling, win pay, loss rent, fall-back, raids + heat decay, second asphalt bonus (plus the Crew panel, Prestige panel, `tick()` module state, LEVEL_INCOME doubling).
- **Added (3):** `weak` per enemy, rebrand (reuses the open UI), loss-reason log line. Damage numbers and weak chips are display only.
- **Net:** 19 → 8 systems.

---

## Pass 4 (v0.3): flavor, visuals and the leftover problems, in one pass

Josh's ask: add flavor back and real visuals, define the core loop (`docs/CORE_LOOP.md`), then run steps 1–3 once. Art rules are in `docs/ART_DIRECTION.md`.

| # | Problem | Clever solution | Deletes | Adds |
|---|---|---|---|---|
| 28 | It's all text on screen, and nothing says "strip mall". | The plaza *is* a strip of pixel facades (one per storefront, in the captured lot's own material). The lot is a pixel battlefield with sprites, lunges, knockback, hit flashes and floating damage. | HTML unit tokens, rows of rebrand buttons (now one select), "does" text on cards (now a tooltip), the 40-line log (now 7) | `src/art/` sprite code, canvas field |
| 29 | Flavor was cut along with systems. | Bring flavor back **only as readouts of existing mechanics**: the Lawyer's weak hits show **C&D**; bosses get a walk-out line with their job title; income is called **rent**; heat shows as cruiser lights at the lot entrance; one sign tube is always burnt out. | — | text and visual tags only (no new stats) |
| 30 | Pawn-shop finds were fun, but gear was a hidden stacking system. | **Walk-ins**: the finds come back as the *active-play* hook. They appear only while you're watching, last 25s, give one temporary +50% damage for 60s, and never stack. | gear slots, gear rolls (stay deleted) | walk-in (1 field + 1 button) |
| 31 | Offline: hundreds of hopeless losses at a wall (v2: 0W/1,354L in 8h). | **Smoke break:** after 3 straight losses the crew waits 1, 2, 4… min (cap 15) between tries. Any renovate or rebrand sends them straight back out. | the meaningless retries | 1 counter |
| 32 | The harsh first minute (a lone Bouncer can't win, and the screen sits empty). | Your uncle's unit is already a **Vape Shop**: the first win comes at 0:05, and the first decision (open a Dojo for a front line) is obvious. | the "dead" first minute | — |
| 33 | The Lifestyle Center grind is unclear. | Keep the wall (it's what bulldozing is for) but **signpost it**: the smoke break sets the Pave it stop glowing, and the away summary says why the crew stopped. | the separate "stuck for X" hint | — |
| 34 | Counters are "solved" once you read the badges. | Accept it on purpose. Counters are for *readability*, not a puzzle. The real decision is the slot budget (tank + medic + counters vs Payday rent and its Heat). | — | — |
| 35 | Cruft: the `?bot=1` live-bot mode and raid-era sprite entries. | Delete them. | `app.bot`, live bot loop, unused sprite | — |

Net: no new stats or currencies. Systems are 8 → 9 (walk-ins). The smoke break replaces retry spam rather than adding a choice. The rest is presentation.
