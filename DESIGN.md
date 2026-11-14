# Strip Mall Warlord — design (prototype v0.1)

**Pitch.** Fall 1997. Your uncle left you Unit A at Pinewood Plaza, a dying strip mall on Rt. 9. Open shops, and every shop earns money and trains one kind of fighter. Your crew fights its own way across the parking lot toward the rival lots. You get stronger between fights. Tone is grounded and dry: job titles, signage, rent.

## Core loop
1. **Shops** earn $/s and train fighters into a bench (cap per shop).
2. **The crew auto-fights** the next "row" of the current lot. Win = cash + advance a row. Lose = pay rent (half the win payout) and fall back a row, so the crew pushes at the wall and farms the row behind it.
3. **Clearing a lot's boss row captures it:** new storefront slots, a bigger squad (+2), and a new tenant type.
4. **Bulldoze** (prestige) once you have stalled: everything resets for Asphalt.

## Shops → fighters
| Shop | Open | $/s @Lv1 | Trains | Role | Base HP / dmg / interval | Special |
|---|---|---|---|---|---|---|
| Dojo | $15 | 1.2 | Bouncer | tank, front line | 110 / 5 / 1.4s | enemies hit the first crew member standing |
| Vape Shop | $60 | 2.2 | Hustler | damage | 45 / 13 / 1.0s | 25% dodge, hits the weakest enemy |
| Laundromat | $300 | 4 | Medic | healer | 55 / 2 / 1.6s | heals the most-hurt ally for 14 |
| Pawn Shop | $1,400 | 9 | Fixer | debuff + gear | 70 / 7 / 1.3s | −8% enemy HP & dmg per fixer (cap 40%); the shop rolls gear every 40s |
| Payday Loans | $6,000 | 40 | Lawyer | control | 60 / 4 / 1.8s | 30% stun (cease-and-desist, 1.6s), lawsuit DoT 6/s for 5s; +0.04 Heat/s per level |

- Opening another shop of the same type costs ×2.2 per copy. Unit B/C/D lease for $120 / $900 / $5,000.
- **Renovate (level up):** cost = base × 1.5^(L−1). Income = base × L × 2^floor(L/10). Fighter stats ×1.09^(L−1). Training speed +8%/level. Bench cap = 2 + floor(L/6) per shop.
- **Bench depth:** fighters that don't make the squad add +4% stats each to squad members of their type.
- **Gear** (pawn shop): three crew-wide slots (Weapon +dmg, Outerwear +HP, Kit +speed). Grade improves with pawn level; the best roll auto-equips.

## Lots (zones)
| Lot | Rows | Enemy strength | Win pay (row 1) | Enemies → boss | Capture gives |
|---|---|---|---|---|---|
| The Parking Lot | 5 | ×2.4 | $20 | Rent-a-Cop, Lot Attendant → Night Shift Supervisor | 1 slot, Laundromat |
| Big-Box Plaza | 6 | ×4 | $120 | Loss Prevention Associate, Rent-a-Cop (Senior) → District LP Manager | 2 slots, Pawn Shop |
| Outlet Mall | 7 | ×10 | $700 | Code Enforcement Officer, HOA President → Outlet Mall GM | 2 slots, Payday Loans |
| Lifestyle Center | 8 | ×24 | $4,000 | Developer Private Security, Placemaking Consultant → **Regional Property Manager** | region conquered |

Enemy stats are multiplied by (1 + 0.22 × row) and by (1 + 0.6 × Heat/100). Win pay is multiplied by (1 + 0.35 × row) and by (1 + Heat/200). Squad size is 4, then 6, 8, 10, 12 as lots fall. Fights time out at 30s, which counts as a loss.

## Heat & raids
Payday shops raise Heat, and it cools 0.05/s. At **60+ Heat** the next fight is a **raid** on your plaza (Code Enforcement plus a State Banking Examiner). Win: 3× boss pay and −35 Heat. Lose: −25% cash and −15 Heat. Heat is both a risk and a payout multiplier.

## Offline
On reopen (or tab refocus), the sim replays elapsed time up to **8h** at the same fixed step, then shows "While you were away": earned, W/L, rent paid, crew trained, raids, lots captured.

## Prestige: bulldoze into a parking lot
Unlocks after capturing Big-Box Plaza. Asphalt gained = 2 × lots held + floor(√(run earnings / 25,000)). Each Asphalt gives **+10% shop speed** (income and training) and **+3% crew HP/dmg**, permanently.

## Balance targets & results (scripts/balance.ts; greedy bot, acting every 10s)
- First capture: target 3–5 min, got **3:21**. Big-Box: **7:52**. Outlet Mall: **19:44**. Raids start at about 26 min.
- No prestige: stalls in the Lifestyle Center (rows 4–7 of 8) from ~25 to 60 min.
- With prestige: bulldozes at 16 / 33 / 46 min, and **conquers the region at ~56 min on run 4**. After that, runs take minutes.
