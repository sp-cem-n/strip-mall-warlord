# Strip Mall Warlord: design (prototype v0.4)

**Pitch.** Fall 1997. Your uncle left you Pinewood Plaza, a dying strip mall on Rt. 9: his vape shop and three empty units. Every storefront you open earns rent and sends one crew member out to the lot. The crew fights on its own, row by row, toward the rival lots. Your job is deciding what each storefront *is*. Tone is grounded and dry. See `docs/CORE_LOOP.md` (what the player does), `docs/ART_DIRECTION.md` (the look) and `docs/REVISION.md` (why things were cut).

## The whole game in seven rules
1. **One storefront = one shop = one crew member.** The shop type sets the fighter. The storefront's level sets income and fighter stats.
2. **Counters.** Every enemy is weak to one crew type, which deals ×2.5 to it. Everyone else deals ×0.5. Enemies hit your front crew member first, so you still need a tank and a medic.
3. **Rebrand.** Any storefront can become any unlocked shop for that shop's opening fee. Renovations belong to the building, so the level stays.
4. **Lots.** Win a fight to take the row. Lose and you retry the same row, and the log says why you lost. Taking a lot's boss row captures it: more storefronts, and sometimes a new tenant type.
5. **Bulldoze.** After Big-Box Plaza, pave everything for Asphalt (1 per row taken). Each point gives +2% income and crew stats, forever.
6. **Smoke break.** After 3 straight losses on one row, the crew waits 1, 2, 4… min (cap 15) between tries. Any renovate or rebrand sends them straight back.
7. **Walk-ins** (only while the game is open, one at a time, never offline, never required): about every 90s somebody walks into one of your shops and waits 25s. What you get depends on the shop (table below).

Currencies have one source each: **cash ← shops**, **storefronts ← captures**, **asphalt ← rows**.

## Shops → crew
| Shop | Open / rebrand | $/s @Lv1 | Crew | HP | dmg | every | Note |
|---|---|---|---|---|---|---|---|
| Dojo | $15 | 1 | Bouncer | 130 | 4 | 1.4s | front line (crew order: Bouncer, Fixer, Hustler, Lawyer, Medic) |
| Vape Shop | $50 | 2 | Hustler | 50 | 9 | 1.0s | counters contract security |
| Laundromat | $200 | 3 | Medic | 60 | heals 15 | 1.6s | heals the worst-off ally, never attacks |
| Pawn Shop | $800 | 8 | Fixer | 75 | 14 | 1.4s | counters retail and management; unlocked by the Parking Lot |
| Payday Loans | $4,000 | 35 | Lawyer | 55 | 26 | 2.2s | counters code and HOA; unlocked by Big-Box. **Heat: +2% enemy strength per level** |

Level L: renovation costs $20 × 1.35^(L−1) (the same for every shop, so a rebrand can't be used to dodge prices). Income is ×1.15^(L−1) and stats are ×1.1^(L−1).

## Walk-ins (by shop)
| Shop | Who walks in | Click for |
|---|---|---|
| Pawn Shop | someone pawning a tire iron, a chirp phone… | crew +50% damage, 30s |
| Dojo | a sparring partner ("Ex-Golden Gloves (Regional)") | Bouncers take 40% less damage, 30s |
| Laundromat | something found in a dryer | crew heals 2% max HP/s in fights, 30s |
| Vape Shop | a reseller | 30s of rent, now |
| Payday Loans | a desperate borrower | 2 min of rent now **and +25% Heat for 3 min** (the one walk-in you might skip) |

## Lots
| Lot | Rows | Strength | Weak to (regulars → boss) | Capture gives |
|---|---|---|---|---|
| The Parking Lot | 5 | ×2 | Rent-a-Cop H, Lot Attendant H → Night Shift Supervisor H | 1 storefront, Pawn Shop |
| Big-Box Plaza | 6 | ×2.6 | Loss Prevention F, Senior Rent-a-Cop H → District LP Manager F | 2 storefronts, Payday Loans |
| Outlet Mall | 7 | ×7 | Code Enforcement L, HOA President L → Outlet GM F | 2 storefronts |
| Lifestyle Center | 8 | ×18 | Private Security H, Placemaking Consultant F → **Regional Property Manager** L | 3 storefronts, region taken (fighting stops) |

H = Hustler, F = Fixer, L = Lawyer. Enemy stats are × strength × (1 + 0.22 × row) × (1 + Heat). Rows have 1–5 enemies, and the boss row is the boss plus one regular. A fight that runs 30s counts as a loss. Regroup takes 3s.

## Heat
Heat is derived, never stored: +2% enemy health and damage per Payday Loans level you own, plus +25% while a borrower's 3-minute window is open. Rebrand Payday Loans away and it's gone. Shown on the pylon's Heat panel and as cruiser lights at the lot entrance (two cruisers during a borrower window).

## Offline and the title screen
Every page load opens the title screen (the plaza at night, your first four units on it). On reopen or tab refocus after 60s+, the sim replays the elapsed time (capped at 8h) at the same 0.2s step and the title screen shows it under **Resume**: rent collected, W/L, rows taken, lots captured, and whether the crew is on a smoke break. New Game over an existing save asks first, then plays a six-line story (skippable) that ends with the uncle's P.S. about the pawn shop. In the game, the uncle's note under the strip always says the one next thing to do.

## Flavor (readouts of real mechanics, never extra stats)
Lawyer weak hits show **C&D**. Bosses walk out with their job title. Income is **rent**. Heat shows as cruiser lights at the lot entrance. One sign tube is always out.

## Balance (scripts/balance.ts, seed 1991, bot acts every 10s)
| | v0.3 mixed | **v0.4 mixed (idle)** | v0.4 + every walk-in | v0.4 static |
|---|---|---|---|---|
| Parking Lot | 2:28 | **2:28** (first win 0:05) | 2:01 | 2:12 |
| Big-Box Plaza | 5:39 | **5:39** | 4:14 | 12:30 |
| Outlet Mall | 16:13 | **16:13** | 14:15 | stuck on its boss |
| at 60 min | Lifestyle 7/8 (wall) | Lifestyle 7/8 (wall) | Lifestyle 8/8 | Outlet 7/7 |
| with prestige | region 58:41 (run 4) | region **58:41** (run 4) | | |
| 8h offline after 1 min of play | 2W / 37L | **2W / 37L** | | |

Walk-ins never run in the idle sim, so idle numbers are identical to v0.3 by construction. The "every walk-in" bot clicks each one the instant it appears, which no person does; on seeds 7 and 42 it takes the whole region at 52–54 min without bulldozing.
