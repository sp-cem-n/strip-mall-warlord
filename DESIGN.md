# Strip Mall Warlord: design (prototype v0.2)

**Pitch.** Fall 1997. Your uncle left you Pinewood Plaza, a dying strip mall on Rt. 9 with four empty units. Every storefront you open earns rent and sends one crew member out to the lot. The crew fights on its own, row by row, toward the rival lots. Your job is deciding what each storefront *is*. Tone is grounded and dry. See `docs/REVISION.md` for why v0.1's systems were cut.

## The whole game in five rules
1. **One storefront = one shop = one crew member.** The shop type sets the fighter. The storefront's level sets income and fighter stats.
2. **Counters.** Every enemy is weak to one crew type, which deals ×2.5 to it. Everyone else deals ×0.5. Enemies hit your front crew member first, so you still need a tank and a medic.
3. **Rebrand.** Any storefront can become any unlocked shop for that shop's opening fee. Renovations belong to the building, so the level stays.
4. **Lots.** Win a fight to take the row. Lose and you retry the same row, and the log says why you lost. Taking a lot's boss row captures it: more storefronts, and sometimes a new tenant type.
5. **Bulldoze.** After Big-Box Plaza, pave everything for Asphalt (1 per row taken). Each point gives +2% income and crew stats, forever.

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

## Lots
| Lot | Rows | Strength | Weak to (regulars → boss) | Capture gives |
|---|---|---|---|---|
| The Parking Lot | 5 | ×1.35 | Rent-a-Cop H, Lot Attendant H → Night Shift Supervisor H | 1 storefront, Pawn Shop |
| Big-Box Plaza | 6 | ×2.6 | Loss Prevention F, Senior Rent-a-Cop H → District LP Manager F | 2 storefronts, Payday Loans |
| Outlet Mall | 7 | ×7 | Code Enforcement L, HOA President L → Outlet GM F | 2 storefronts |
| Lifestyle Center | 8 | ×18 | Private Security H, Placemaking Consultant F → **Regional Property Manager** L | 3 storefronts, region taken (fighting stops) |

H = Hustler, F = Fixer, L = Lawyer. Enemy stats are × strength × (1 + 0.22 × row) × (1 + Heat). Rows have 1–5 enemies, and the boss row is the boss plus one regular. A fight that runs 30s counts as a loss. Regroup takes 3s.

## Offline
On reopen or tab refocus, the sim replays the elapsed time (capped at 8h) at the same 0.2s step, then shows a summary: earned, W/L, rows taken, lots captured.

## Balance (scripts/balance.ts, seed 1991, bot acts every 10s)
| | v0.1 | v0.2 mixed | v0.2 static (never rebrands) | v0.2 Dojo-only |
|---|---|---|---|---|
| Parking Lot | 3:21 | **3:05** | 3:04 | 16:22 |
| Big-Box Plaza | 7:52 | **6:26** | 23:47 | stuck on its boss at 60 min |
| Outlet Mall | 19:44 | **16:44** | stuck on its boss (needs a Fixer) | — |
| at 60 min | Lifestyle 4/8 | Lifestyle 7/8 (wall) | Outlet 7/7 | Big-Box 6/6 |
| with prestige | region at ~56 min (run 4) | region at **~62 min** (run 4) | | |

In v0.1 the Dojo-only bot *beat* the mixed bot (Lifestyle 6/8 vs 4/8). Now it's stuck in the second lot.
