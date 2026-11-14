# Strip Mall Warlord v0.5: design (built)

Status: **built and shipped as v0.5.** This replaces the v0.5 proposal. Josh's answers are folded in, and every number here comes from the code (`src/game/defs.ts`) or the balance bot (`docs/balance-*.txt`, seed 1991). Tone stays Sodium Night: 1997, Rt. 9, dry.

## 1. Pitch
Your uncle left you his pawn shop and a note: *don't let them pave it.* Every storefront in Pinewood Plaza pays **rent** and puts one person on the crew. The crew fights across six lots of Route 9. Each fight has to be won a set number of times before the next one opens, and every win pays **Goodwill**. Rent renovates buildings; Goodwill trains people. Shops arrive in a fixed order, one of each, until there are 19 storefronts and 25 battlers (19 shop hires plus 6 bosses who quit and join). Beat the Developer at dawn and the plaza is yours.

Then, with no warning beforehand, the state opens **the Route 9 Bypass**: a second region with a new crew, new shops and a new currency, **Equity**. Goodwill feeds it through the bank. Route 9 can be paved and replayed to farm more Goodwill.

## 2. Josh's answers (locked)
| Question | Answer | Built as |
|---|---|---|
| 25 sprites on the lot | All of them, in a readable formation | Ranks 4 deep, columns 17px apart (no side-by-side overlap), odd columns half a row lower. Order runs front to back: tank, damage, control, heal, buffer. Fallen fighters fade out in ~0.8s, and an "N DOWN" counter replaces the bodies. HP bars show only when damaged. Damage numbers show only on enemies. |
| Bosses | Quit and join | Each lot boss joins the crew that beat him. Route 9 gets 6, the Bypass 4. They live in the **Back office** at the crew's average shop level, so they can't be renovated. |
| Training | 5 role tracks | Conditioning (tank HP), Sparring (damage), First Aid (heal), Paperwork (control auras), Team Building (buffer auras). +5% per level. Cost is 20 × 1.3^L Goodwill on Route 9 and 2 × 1.3^L Equity on the Bypass. Each crew has its own tracks. |
| Time to the Route 9 ending | ~15 h | 14h52 checking in; 13h11 active (§9) |
| Advance before Security | Lot 1 auto from the start | The Parking Lot always auto-advances. A Security Office level of 1 + 5(k−1) covers lot k (Lv 1 → Big-Box, 6 → Outlet, 11 → Office, 16 → Lifestyle, 21 → Commons). |
| After the ending | Both: pave or keep the lights on; no hint first | The dawn card offers **Keep the lights on**, **Pave Route 9 (+144 asphalt)** and **Drive north**. The Bypass is revealed only on this card. |
| Second region | Hidden, much higher thresholds, own currency, Goodwill → Equity, complete and beatable | §4 |
| Walk-ins | Stay at 3 kinds | Tip (30s of rent), Rally (+25% for 30s), Referral (10 wins of pay). They appear only for the crew you're watching. |
| Also locked | | Heat and rebrands cut. Weaknesses +25% only. Fixed unit card with a next-renovation readout. Receipt log up top by the pylon. Fall back after 3 losses. Offline at full rate, capped at 8h. Bulldoze/pave only after the ending. v0.4 saves reset with a title notice. |

## 3. Currencies
| Currency | Comes from | Buys |
|---|---|---|
| **$ (rent)**, one till per crew | every open storefront, every second, offline too | Route 9 leases, renovations (both regions), Security levels (a renovation), Overtime |
| **Goodwill** | Route 9 wins | Route 9 training; the bank |
| **Equity** | the bank (10 Goodwill → 1 EQ, one way) plus a thin trickle from Bypass wins | Bypass leases, Bypass training |
| **Asphalt** | paving Route 9 (+144 per pave) | nothing; +2% each to Route 9 rent, stats and Goodwill per point, forever |

Rule of thumb: $ grows buildings, Goodwill grows the Route 9 crew, Equity grows the Bypass. Route 9 is the Bypass's bank.

## 4. Region 2: the Route 9 Bypass
- **Reveal:** the dawn card after the Developer. "One more thing. The state opened the Route 9 Bypass this morning…" Before then, nothing on screen points north (the lot sign says RT 9; the old EXIT 14 sign was removed).
- **Switching:** tabs on the Lot panel (ROUTE 9 / THE BYPASS) switch which crew you manage. **Both crews fight all the time, in parallel**, and offline too. The view only changes what you see, and walk-ins come only for the viewed crew.
- **Whole new crew:** a separate roster, till, training and Security Office. It starts with one Lv 1 Self Storage (Auction Hunter) and $10. The Route 9 crew (with its 6 bosses) never comes north.
- **Shops: new kinds first, then Route 9 franchises trickle in.** There are 15 shops: 9 new kinds plus 6 franchises (Dojo, Security, Laundromat as Wash-n-Fold, Payday, Party Supply, Pet Grooming). With the 4 bosses, the Bypass crew is 19.

| Shop | Unlocked by | Lease | Reno Lv1 | Rent/s | Hire | Role |
|---|---|---|---|---|---|---|
| Self Storage | start | — | $5 | $2 | Auction Hunter | damage |
| Car Wash | Exit 14, fight 3 | 1 EQ | $10 | $3 | Detailer | buffer |
| Dojo (Exit 14) | Exit 14, fight 6 | 3 EQ | $62 | $6 | Bouncer | tank |
| Urgent Care | Exit 14, fight 8 | 8 EQ | $300 | $14 | Urgent Care Nurse | heal |
| Security Office (Bypass) | Exit 14 boss | 15 EQ | $750 | $0 | Night Watchman | control |
| Bail Bonds | Campus, fight 3 | 30 EQ | $1K | $30 | Bail Bondsman | tank |
| Tax Prep | Campus, fight 10 | 80 EQ | $8.75K | $90 | Tax Preparer | control |
| Wash-n-Fold | Campus boss | 200 EQ | $22.5K | $160 | Medic | heal |
| Golf Superstore | Phase II, fight 4 | 500 EQ | $62.5K | $330 | Golf Pro | damage |
| Payday Loans (Bypass) | Phase II, fight 8 | 1.2K EQ | $163K | $600 | Lawyer | damage |
| Bridal Boutique | Phase II, fight 11 | 3K EQ | $400K | $1.1K | Wedding Planner | buffer |
| Party Supply (Bypass) | Phase II boss | 7K EQ | $1M | $2K | Party Clown | control |
| Cineplex | Galleria, fight 4 | 16K EQ | $2.5M | $3.8K | Cineplex Usher | control |
| Pet Grooming (Bypass) | Galleria, fight 8 | 35K EQ | $6.25M | $7K | Groomer (and Dog) | damage |
| Pretzel Stand | Galleria, fight 12 | 80K EQ | $15M | $13K | Pretzel Stand Kid | heal |

| Lot | Fights | Wins per fight (base, ×1.1/fight) | Boss → joins as |
|---|---|---|---|
| Exit 14 Power Center | 10 + boss | 25 | Leasing Director: damage, heavy hitter |
| Corporate Campus | 12 + boss | 35 | VP of Real Estate Strategy: buffer, crew +10% damage |
| Town Center, Phase II | 14 + boss | 45 | Managing Partner: buffer, crew +15% HP |
| Bypass Galleria | 16 + boss | 55 | The Chairman: buffer, +10% Equity per win |

- **Higher thresholds:** enemies grow ×1.12 per fight and ×1.5 per new lot (Route 9: ×1.07 and ×1.3). Each lot has new regulars with **tells** (tanky or hard-hitting), and wins-to-advance are 25–55 per fight.
- **Ending:** "The Bypass is yours. Route 9 North is still being surveyed." The Bypass is beatable, and the data model is `REGIONS[]` / `FIGHTS[r]`, so a third region is a data entry plus art.
- **Conversion: 10 Goodwill → 1 Equity.** It's one way and manual (Half / All in the Bank). Bypass wins pay a deliberately thin 0.2 × 1.09^fight Equity, so the bank is ~65% of all Equity. **Skipping conversion means the Galleria isn't taken by 60 h** (vs 44h04).

## 5. Paving and the Goodwill loop
- **Pave Route 9** (only after the ending): the Route 9 crew restarts at a Lv 1 pawn shop with $10, and banked Goodwill goes to zero, so **bank first**. You gain +144 asphalt (one per fight), worth +2% Route 9 rent, stats and Goodwill each. Training, the Bypass and Equity are untouched.
- **Why it's worth it:** a fresh run with +288% climbs 6 lots in ~7h, and its Goodwill rate passes the old farm within hours. Each pave stacks.

| Strategy (check-in bot) | Galleria taken | Total |
|---|---|---|
| Never convert | not by 60h | — |
| Convert, never pave | 44h04 | ~29h after Route 9 |
| Convert, pave right away and each time Route 9 is done again | **35h14** | ~20h |
| Pave after 3h of farming | 35h49 | |
| Pave after 8h of farming | 36h09 | |
| Active, never pave | 32h40 | |
| Active + pave right away | **32h01** | |

Converting is mandatory. For a check-in player, paving saves about 9h, and long farming between paves is worse. An active player gets most of that time back through calls and Overtime instead.

## 6. What the active player does
Idle is never punished: fights, auto-advance, rent and offline all run without you. Attention buys three things.

1. **Call the play** (*The play:* Even / Rush / Dig In). From Big-Box on, about half of all enemies show a **tell** (13 of 24 on Route 9, 12 of 16 on the Bypass): *tanky* (+40% HP, −20% dmg) or *hard* (+30% dmg, −20% HP). Rush (crew HP ×0.8, dmg ×1.3) beats tanky; Dig In (HP ×1.3, dmg ×0.8) beats hard. On a loss, the receipt says which call would have helped. It's free and instant, and it's a reason to look at the lot.
2. **Overtime**, the active $ sink: pay 2 minutes of that crew's rent for +25% HP and damage on the next 3 fights. Use it to break a boss wall now instead of renovating for an hour.
3. **Timing decisions** that idle can't make well:
   - **Push:** ◂ / ▸ manual Advance past the auto line, plus falling back to farm.
   - **Walk-ins:** a Rally lands +25% exactly when you push.
   - **Goodwill split:** Route 9 training vs the bank.
   - **When to pave:** bank first; pave when Route 9 is done.

Measured: the active bot (calls the play by tell, Overtime after a boss loss) reaches the Route 9 ending 11% sooner (13h11 vs 14h52) and takes the Galleria at 32h vs 35h–44h.

## 7. $ economy (with numbers)
**Sources:** rent, a per-crew till. Route 9 rent was $83/s at the first boss, $1.9K/s at Outlet, $47K/s at Lifestyle and $384K/s at the ending. Tip walk-ins add 30s of rent.

**Sinks** (share of Route 9 $ spent, check-in bot):

| Sink | Price | Share |
|---|---|---|
| Renovation | reno × 1.35^(L−1); +10% HP/dmg (×1.1), +15% rent per level | **87–97%** |
| Leases (Route 9 only) | $15 → $350M along the order | 3–13% |
| Security levels | a Security Office renovation; 1 + 5(k−1) to cover lot k | 0–2% |
| Overtime | 120s of rent per use | active only |

**Timing vs Goodwill:** a lease unlocks on a fight win (Goodwill side), and its price runs from seconds of rent early to about an hour by the Lifestyle Center. Between leases, all $ goes to renovations. The ▲ readout on each card shows what the next level buys. Goodwill can't touch buildings, and $ can't touch training. On the Bypass, $ only renovates; leases cost Equity, so the Bypass till is the renovation budget, and the bank decides how fast you grow wide.

**What we added:** Overtime only. It's the one meaningful active $ sink.

**What we deleted:** Heat, rebrands, the sample Book, per-lot enemy strength (one global ramp now), and any asphalt bonus on the Bypass.

## 8. UI (v0.5)
- **Pylon** (top-left): the viewed crew's Cash, Goodwill, Equity (after the reveal) and Asphalt (after a pave).
- **Receipt** printer by the pylon: the last 5 lines for the viewed region, with repeats collapsed.
- **LED:** W-L, play time and lots taken.
- **Shops:** fixed unit cards. Each shows the facade, sprite, HP / DMG, rent, a two-line ▲ readout of the next renovation (HP, DMG/HEAL, rent) and one button (Renovate / Lease). New storefronts are whitewashed with a scaffold and a NEW tag. Back office cards show the bosses.
- **Lot:**
  - the zone track (??? for locked lots, AUTO / SEC n);
  - region tabs, ◂ / ▸, the status line with tells;
  - the field (25 battlers), The play buttons, Overtime and the legend.
- **Training:** five tracks plus the Bank.
- **Dawn card:** Keep the lights on / Pave / Drive north.

## 9. Pacing (balance bot, seed 1991, acting every 10s)
| Milestone | Target | Check-in | Active |
|---|---|---|---|
| First win | < 1 min | 0:05 | 0:05 |
| First boss (Parking Lot) + Security Office | ~10–15 min | 12:03 | 12:03 |
| Big-Box | | 35:26 | 33:49 |
| Outlet | | 1h18 | 1h16 |
| Office Park | | 2h51 | 2h44 |
| Lifestyle | | 6h00 | 5h35 |
| **Route 9 ending** | ~15 h | **14h52** | **13h11** |
| Exit 14 | | 15h21 | 13h39 |
| Campus | | 16h11 | 14h29 |
| Phase II | | 18h27 | 16h44 |
| **Galleria (Bypass done)** | much higher thresholds | 44h04 no pave / **35h14 paving** | 32h40 / **32h01 paving** |

- Pure idle (never presses Advance) reaches the ending at 14h48, because Security covers every lot.
- Offline: 8h away after 1 minute of play pays +$66.6K, +3.99K Goodwill and +7 fights.
- Seed 7 is within 30 minutes of seed 1991 everywhere.
- The files: `docs/balance-checkin.txt`, `-active`, `-idle`, `-noconvert`, `-pave0`, `-pave3`, `-pave8`, `-activepave`, `-seed7`.

## 10. Known issues
- The active edge is real but modest (−11% to the Route 9 ending). The Parking Lot has no tells on purpose, so the first 12 minutes play the same either way.
- The Bypass is front-loaded: the banked Goodwill from Route 9 buys Exit 14 through Phase II in ~3.5h, and then the Galleria is the long haul (~16h with paving). That's intended as the endgame, but it's lumpy.
- Balance knobs are still env-tunable in `defs.ts` (SMW_G0/G1/J0/J1/S1/K/A/P1/R) for sweeps. In the browser they fall back to the defaults.
