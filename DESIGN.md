# Strip Mall Warlord: design (v0.5)

The full current design, with numbers, is **[docs/V05_DESIGN.md](docs/V05_DESIGN.md)**. This page is the one-screen version.

## The whole game in eight rules
1. Every storefront pays **rent ($)** and sends one battler. 19 shops on Route 9 open in a fixed order, one of each.
2. Six lots, fight by fight. A fight must be won N times to open the next one, and every win pays **Goodwill**.
3. **$ renovates** (×1.1 stats, ×1.15 rent per level). **Goodwill trains** five role tracks (+5% each level).
4. Lot bosses **quit and join** the crew, so Route 9 ends with 25 battlers.
5. The Parking Lot auto-advances. The **Security Office** (Lv 1 + 5 per lot) extends that to later lots. Three losses in a row means the crew falls back a fight.
6. Enemies have weaknesses (+25%) and **tells** (tanky / hard). The player calls **Even / Rush / Dig In** and can buy **Overtime** with $.
7. After the Developer comes dawn: keep the lights on, or **pave** for asphalt (+2% each, Route 9 only). Then the hidden **Bypass** opens. It has a new crew, 15 shops and 4 lots, and runs on **Equity**: 10 Goodwill buys 1, one way.
8. Both crews fight in parallel, offline too (8h cap). Tabs choose which one you manage.

## Balance (seed 1991, check-in bot / active bot)
| | Check-in | Active |
|---|---|---|
| First boss + Security | 12:03 | 12:03 |
| Route 9 ending | 14h52 | 13h11 |
| Bypass done, no pave | 44h04 | 32h40 |
| Bypass done, paving | 35h14 | 32h01 |

Full runs are in `docs/balance-*.txt`.
