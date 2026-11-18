# Wall map (internal reference)

Design reference for the bottleneck spine in `V10_PLAN.md` (Bottleneck design, 15 Nov). Not player-facing, so it names the Bypass freely. No source changes come with this file. "Today" means branch `v09` at `338c426` plus the uncommitted Grapevine WIP. Times come from `bun scripts/balance.ts 20 1991` (check-in, active, active + room) run on 15 Nov 2026, which still includes the boss auto-overtime this plan cuts. Anything marked *est.* is a design estimate, not a sim result.

---

## 1. How a wall works today (the honest version)

| Lever | Code | What it actually does |
|---|---|---|
| Fight strength | `FIGHTS[r][g].strength`, `FIGHT_GROWTH`, `LOT_JUMP`, `BOSS_STRENGTH` 1.15 | The real wall. +7% per fight on Route 9, +8.25% on the Bypass, a step at each lot. |
| Enemy stats | `E(name, title, hp, dmg, interval, weak, tell)` | **Mostly cosmetic.** `fightScale` rescales every lineup to the same Lanchester threat, so an enemy's base HP and damage only set the *shape* of a fight (who is thick, who hits hard), never its total. |
| Head count | `regularsIn` = `1 + zone + floor(2i/fights)`, max 6; bosses bring `2 + zone` escorts, max 5 | Later lots field more, smaller enemies. Overkill is wasted (a hit never carries over), so crowds already favor fast hitters a little. |
| Tells | `TELL`: `tanky` +40% HP / −20% dmg; `hard` +30% dmg / −20% HP and 75% of hits go to the lowest-HP crew | The only real behavior difference between enemies. |
| Bosses | `pickTarget`: every boss always hits the lowest-HP crew member | Every boss is the same "do you have a healer / spare HP" check, whatever its tell. |
| Weakness | `weak: battlerId`, `WEAK_BONUS` 0.25 | +25% damage from one named battler. Worth about 2.3 renovations on that one unit (`1.1^2.3`), or about 3 fights of growth. |
| Crew power | `powerLevel` = renovation level + `tierOf(shop)`; joined bosses fight at the crew's average level | A dollar of renovation buys about the same strength on any shop, so late shops are not stuck behind early ones. Good: benching a unit costs you its spend, not a broken curve. |
| Auto lineup | `autoLineup`: best tank (two vs hard hitters at 6+ slots), a healer (two at 7+), **then up to two counters from `weak`**, then raw power | Already solves the counter puzzle for you. Today it is always on. |
| Buffers | Curb, never take a slot | Always on; never a lineup choice. |

### Weakness pointers today (Route 9, 24 enemies including bosses)

| Weak to | Count | Unit unlocks at |
|---|---|---|
| Hustler | 6 | Parking Lot fight 6 |
| Lawyer | 6 | Big-Box boss |
| Fixer | 5 | Start |
| Bouncer | 4 | Parking Lot fight 1 |
| Groomer, Mattress Guy, Regional PM | 1 each | Office, Lifestyle, Lifestyle boss |

15 of 24 point at the three Parking Lot hires, 21 of 24 at units you own by the end of Big-Box, and none at a control, heal or buffer unit. Five point at tanks (Bouncer, Mattress Guy), which hit for about 3 damage a second, so the +25% does nothing.

### Where the time actually goes (sim, seed 1991, 15 Nov)

| Lot | Check-in captured | Active captured | Active + room captured | Check-in time in lot |
|---|---|---|---|---|
| Parking Lot | 0:17 | 0:13 | 0:13 | 17m |
| Big-Box | 0:34 | 0:27 | 0:27 | 17m |
| Outlet | 1:33 | 1:21 | 1:18 | 59m |
| Office | 3:45 | 2:47 | 2:35 | 2h 12m |
| Lifestyle | 6:27 | 6:17 | 3:53 | 2h 42m |
| **Commons** | **15:55** | **15:29** | **9:36** | **9h 28m (60% of Route 9)** |
| Exit 14 | 16:52 | 15:50 | 9:54 | 57m after dawn |
| Campus | 18:31 | 17:04 | 10:37 | 1h 39m |
| Phase II | not by 20h | 19:30 | 12:23 | |
| Galleria | not by 20h | not by 20h | 13:34 | |

Route 9 is one long grind wall (Pinewood Commons, 18 fights at +7% each plus a 1.089 step) after five short lots. The bot never renovated Video Rental, Driving School, Cell Phone Kiosk, Party Supply or the Fun Zone hire past level 1, and Tanning only in room mode: the control and second-heal units never mattered. The Bypass in the current build runs far shorter than the V09_BYPASS target (about 4h post-dawn in room mode against ~20h), because the M4 knobs (reno 1.50, 20 GW per EQ, `LOT_JUMP` by guard) are not in yet.

### Verdict: can strengths and weaknesses carry the bottleneck design?

**Not as built.** Walls today are number walls with a light skin: enemy stats are normalized away, the named weakness is small and points mostly at starter units, every boss uses the same targeting, and auto lineup reads the counters for you. The pieces that *do* work (two tells with real behavior, overkill, `tierOf` making any shop worth leveling, buffers as specializers) are enough to build on. The fix below is mostly deletion plus two small targeting rules.

---

## 2. Proposed system (delete over add)

**Delete:**
1. The per-enemy `weak` battler id (about 40 strings), `WEAK_BONUS`, and the battler-specific line in `lossReason`.
2. The counter step in `autoLineup`. Auto lineup fields best tank, healer(s), then raw power. It is for farming; walls are solved by hand (or by the check-in player when they check in).
3. "Bosses always hit the weakest." A boss uses its own tell's rule, at boss strength.
4. The Parking Lot patrol (the lot is 17 minutes; it teaches advancing, not farming).

**Keep:** `tanky`, `hard`, `fightScale`, `tierOf`, curb buffers, overkill.

**Add (two small rules, both in `pickTarget` / `hit`):**
- `armored`: hits from units with an attack interval under 1.4s do half damage. Slow, heavy hitters are unaffected.
- `bruiser`: +30% damage, and every hit goes to the front tank (or the front unit if you have no tank).

That gives four tells, each with one readable counter. The weakness is now the tell itself, shown on the hover and the roster as "Beats / Beaten by":

| Tell | Beats | Beaten by | Route 9 answers | Bypass answers |
|---|---|---|---|---|
| Thick (`tanky`) | Low damage, runs out the 30s clock | Raw damage, Mark (Watchman, Usher), damage buffers | Hustler, Lawyer, Karaoke Host, Night Watchman | Golf Pro, Auction Hunter, Wedding Planner, Usher |
| Hard hitter (`hard`) | Fragile back lines | Healers, crew HP (Outlet GM), slow and weaken | Medic, Hygienist, Building Manager, Late-Fee Collector, Driving Instructor | Urgent Care Nurse, Medic (Wash-n-Fold), Tax Preparer |
| Armored (new) | Fast builds (Hustler, Token Kid, Groomer) | Slow heavy hitters and their buffers | Lawyer + Notary, Regional PM, Fixer | Auction Hunter, Lawyer (Payday), Leasing Director |
| Bruiser (new) | Crews with no real tank | Tanks and tank support | Bouncer, Mattress Guy, LP Manager, Personal Trainer, Tanning | Bartender, Bail Bondsman, Pretzel Kid |
| Crowd (not a tell: a lot with more, smaller regulars) | Heavy hitters (overkill), single targets | Fast hitters, haste, Stun and Confuse | Hustler + Nail Tech, Token Kid, Kiosk, Clown | Golf Pro + Detailer, Clown (Party Supply) |

Armored and Crowd are deliberate opposites inside the damage role: build fast for one, bench it and build heavy for the next. That is the Dojo-then-Payday shape Josh described. Crowd needs only a per-lot `crowd` count override on `regularsIn` if the formula alone does not give enough bodies; try without it first.

---

## 3. Route 9, lot by lot

Units listed are what you can lease by that point (shop fight index in brackets). Joined = bosses who quit and fight at crew-average level.

### 3.1 The Parking Lot (8 fights + boss) — learn rent and renovation
- **Today:** Rent-a-Cop (weak Fixer), Lot Attendant (weak Hustler), Cart Wrangler (weak Bouncer). No tells. Boss: Night Shift Supervisor (weak Hustler, hits weakest).
- **Units:** Pawn/Fixer (start), Dojo/Bouncer [1], Laundromat/Medic [4], Smoke Shop/Hustler [6], Fun Zone/Token Kid [6, $20,000], Security/Watchman [boss].
- **Beats it today:** renovating anything.
- **Proposed:** regulars plain. **Boss = Bruiser.** First real wall: the Supervisor flattens whoever stands in front, so the lesson is "put a renovated Dojo up front." Clears in about 15–20 min (*est.*, matches today).

### 3.2 Big-Box Plaza (10 + boss) — learn the heal
- **Today:** LP Associate (weak Fixer), Greeter (weak Bouncer, tanky), Rent-a-Cop Sr. (weak Hustler). Boss: District LP Manager (weak Fixer, tanky).
- **New units:** Video Rental/Late-Fee Collector [3], Payday/Lawyer [boss]. Joined: Supervisor (crew haste).
- **Proposed:** Greeter and LP Associate become **Hard hitters**. **Boss = Hard hitter.** The Medic and the Late-Fee Collector's slow answer it. The Hustler you just built gets picked off; you learn the healer.
- **Unlocks after:** Auto lineup (V10 plan). Lands right before the first role swap, so it is worth having for farming but cannot solve the next wall for you.
- **Patrol:** the first patrol (Big-Box), now Goodwill, on sale once the Parking Lot is captured. Proposed ~500 GW, about 20 min of farming at ~4.5 wins a minute (*est.*).

### 3.3 Outlet Mall (12 + boss) — learn fast damage and buffers
- **Today:** Code Enforcement (weak Lawyer), HOA President (weak Lawyer, hard), Mall Walker (weak Hustler). Boss: Outlet GM (weak Fixer, hard).
- **New units:** Nail Tech (Hustler haste) [2], Tanning (tank regen) [6], Karaoke Host (damage +10%) [10], Notary (Lawyer +25%) [boss]. Joined: LP Manager (tank, −10% damage taken). Skee-Ball opens at fight 6.
- **Proposed:** **Crowd** lot (Mall Walkers come in numbers). Fast build wins: Hustler + Nail Tech, Token Kid. **Boss = Thick.** You need damage through the clock: Karaoke Host + Hustler + Watchman's mark.
- **Patrol:** ~1,000 GW (*est.*, ~20 min farming).

### 3.4 Sunrise Office Park (14 + boss) — bench the fast build, go heavy
- **Today:** Badge-Reader Guard (weak Hustler), Parking Validator (weak Lawyer, hard), Facilities Guy (weak Groomer, tanky). Boss: Building Manager (weak Lawyer, tanky).
- **New units:** Driving Instructor (weaken) [3], Groomer (twin) [7], Copy Guy (copy aura) [11], Dentist/Hygienist (big heal) [boss]. Joined: Outlet GM (crew +10% HP).
- **Proposed:** **Armored** lot. The Hustler/Nail Tech build from the Outlet stalls. Bench it, renovate the Lawyer, and the Notary you just earned finally pays off. **Boss = Armored + Thick.** Lawyer + Notary + Watchman.
- **Patrol:** ~3,000 GW (*est.*, ~25 min farming).

### 3.5 Lifestyle Center (16 + boss) — the tank wall
- **Today:** Developer Private Security (weak Hustler), Placemaking Consultant (weak Fixer, hard), Valet (weak Bouncer, tanky). Boss: Regional PM (weak Lawyer, hard).
- **New units:** Mattress Guy (tank, most HP) [3], Kiosk Pitchman (stun) [7], Personal Trainer (tanks +20% HP) [11], Party Clown (confuse) [boss]. Joined: Building Manager (revive).
- **Proposed:** **Bruiser** lot. Rebuild the front: Mattress Guy + Trainer + Tanning regen + LP Manager. **Boss = Hard hitter with Bruiser escorts.** Two tanks *and* two healers (Dentist, Building Manager revive): the 7-slot crew, so a Goodwill slot buy lands here.
- **Patrol:** ~9,000 GW (*est.*, ~25 min farming).

### 3.6 Pinewood Commons (18 + boss) — the final exam
- **Today:** Leasing Agent (weak Lawyer, hard), Survey Crew (weak Mattress Guy), Bulldozer Operator (weak Bouncer, tanky). Boss: The Developer (weak Regional PM, tanky). 9h 28m check-in: 60% of Route 9.
- **New units:** none. Joined: Regional PM (heavy hitter).
- **Proposed:** the lot rotates in thirds: Crowd (fights 0–5), Armored (6–11), Bruiser (12–17). The lineup that clears one third loses the next, so this is where hand lineups and auto lineup's limits both show. **Boss = Thick with mixed escorts.** Control earns its slot here (Kiosk stun, Clown confuse, Driving weaken). Target 4–5h check-in (*est.*), down from 9.5h; the time moves into the earlier walls.
- **Patrol:** ~30,000 GW (*est.*, ~30 min farming).

---

## 4. The Bypass, lot by lot (9 lots, DRAFT, Nov 18)

New crew, Equity wallet. The player already knows all four tells, so the Bypass remixes them in a different order, with new answers. Josh's call, Nov 18: **9 lots and 21 units**, because the longer road needs more milestones. The 4 existing lots keep their bosses; 5 lots are new. The full table (units, bosses, skylines, times) is in `V10_PLAN.md`, "Josh notes, Nov 18", item 11. This is the wall spine only. *est.* throughout.

| # | Lot | Wall (regulars) → counter | Boss → counter | Answers it adds |
|---|---|---|---|---|
| 1 | Exit 14 Power Center | Armored → Auction Hunter (start) | Leasing Director, Bruiser → Bartender up front | Detailer, Bartender |
| 2 | Frontage Road (new) | Hard → Nurse + Bouncer | The Franchisee, Thick → Auction Hunter + Leasing Director | Bouncer, Nurse, Watchman (on capture) |
| 3 | Corporate Campus | Bruiser → Temp Worker + Bouncer + Bartender | VP, Hard + Thick → Tax Preparer + Nurse + Day-Care Teacher | Temp Worker, Day-Care Teacher, Tax Preparer |
| 4 | County Center Drive (new) | Thick → Lawyer + Watchman + Leasing Director | County Commissioner, Armored → Lawyer + Auction Hunter | Bondsman, Lawyer |
| 5 | Fairway Pointe (new) | Hard → Nurse + Day-Care Teacher + Tax Preparer | Club Treasurer, Bruiser → Bondsman + Temp Worker | Golf Pro, Groomer |
| 6 | Town Center, Phase II | Crowd → Golf Pro + Groomer + Barista + Detailer | Managing Partner, Armored → Lawyer + Wedding Planner | Barista, Wedding Planner |
| 7 | Bargain Square (new) | Thick → Lawyer + Golf Pro + Watchman + Planner | Liquidation Manager, Hard → Medic + Nurse + Day-Care Teacher | Party Clown, Medic |
| 8 | Crossroads 16 (new) | Armored → Lawyer + Auction Hunter + Usher | Megaplex GM, Crowd → Golf Pro + Groomer + Barista + Clown | Usher, Pretzel Kid |
| 9 | Bypass Galleria | Rotating thirds (Hard, Bruiser, Thick) | The Chairman, Thick with Bruiser escorts | Photographer, Record Clerk |

The shape to keep: a fast build is built twice (Crowd at 6 and 8) and benched twice (Armored at 4, 6 and 8). The tank front is rebuilt at 3 and 5, and the two-healer back line lands at 7, right before the final exam. No lot's wall needs a unit that arrives later in the same lot.

---

## 5. Patrols and auto lineup against the walls

| Lot | Wall (proposed) | Patrol (proposed price, *est.*) | Auto lineup |
|---|---|---|---|
| Parking Lot | Bruiser boss | none (cut) | not yet |
| Big-Box | Hard hitters | ~500 GW, after Lot captured | **unlocks on capture** |
| Outlet | Crowd, Thick boss | ~1,000 GW | farms; does not read tells |
| Office | Armored | ~3,000 GW | farms; hand lineup for the wall |
| Lifestyle | Bruiser, Hard boss | ~9,000 GW | farms |
| Commons | Rotating thirds | ~30,000 GW | farms; this is where it visibly falls short |
| Exit 14 | Armored, Bruiser boss | Equity, price after PAY_BASE retune | Bypass crew gets it at dawn (*proposed*: the skill carries over) |
| Frontage Road | Hard, Thick boss | Equity | |
| Campus | Bruiser, Hard + Thick boss | Equity | |
| County Center | Thick, Armored boss | Equity | |
| Fairway Pointe | Hard, Bruiser boss | Equity | |
| Phase II | Crowd, Armored boss | Equity | |
| Bargain Square | Thick, Hard boss | Equity | |
| Crossroads 16 | Armored, Crowd boss | Equity | |
| Galleria | Rotating thirds | Equity | |

- Patrol prices are about 20–30 minutes of farming at that lot's last regular fight (Route 9 pay 3 → 238 GW a win), assuming ~4.5 wins a minute from the sims. Asphalt multiplies Goodwill, so a repaved run buys every patrol early, which is exactly the "resets break walls faster" feel.
- Patrols plus auto lineup make farming idle. Neither solves a wall: that stays the player's job. A check-in player solves it at each check-in by reading the loss hint.
- The new `lossReason` names the tell: "Bruisers went through your front line. Put a tank up front." / "Armored. Fast hits bounce off: try a heavy hitter."

## 6. Open items for the build

1. Sim both bots with the four tells before tuning `LOT_JUMP`; the Commons time should drop and the walls should spread out.
2. The check-in bot needs a "read the tell" lineup step, or it will stall on Armored lots. The skilled bot does this every fight.
3. Copy: the Bypass ending ("Route 9 North is still being surveyed.") and dawn `hintDone` ("Somebody is surveying Route 9 North. Not yet.") both imply a third road. Josh: dawn must not imply another zone. Rewrite both in the copy pass.
4. Hover and roster: each enemy shows its tell as "Beats / Beaten by"; each unit card shows which tells it answers.
