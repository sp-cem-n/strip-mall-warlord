# v0.9 remainder and v1.0 plan

Prep only. No source changes ship from this doc. The economy map was reviewed here so Josh does not have to. `docs/V09_POLISH.md` and `docs/V09_BYPASS.md` stay the historical decision records; where this file disagrees (Off-Ramp logo, landmark stacking, smoke-break rules, patrols, Grapevine vs poker, room-on-sale already corrected in the Bypass doc), this file wins.

**v0.9** is the cohesive game: remaining polish, economy fixes, start-and-theme, copy, Grapevine, smoke-break rules, the rest of M3 (hotkeys, high-stakes, trivia batches), and M4 (REIT, Rolodex, 12-hour Bypass offline cap). Then `package.json` 0.9.0 and tag `v0.9`.

**v1.0** is the finished game: the minigame overhaul, the post-REIT achievement layer, sound, and a clean repo. After that, only minor changes and bug fixes.

Worktree note, leave as-is: Grapevine rumor slips are half-done and **uncommitted** in `/workspace/smw-v09` (`dawn.ts`, `room.ts`, `GameRoom.tsx`, `scripts/check.ts`). Do not mix them into unrelated commits.

---

## 1. Economy map (reviewed)

Play time, not raw dollars. Times below are typical check-in unless noted. Route 9 is about 15h check-in, 12.5–15h active, 10h arcade. The Bypass is meant to run about twice that after dawn. Two cash tills never transfer. Official bots still do not buy cash sinks, so Route 9 pacing stays on the fights.

### 1.1 Each currency and sink

**Cash (Route 9 till, and a second Bypass till after dawn).** The everyday wallet. Rent from leased shops is the engine; walk-in tips (30 seconds of rent) and a few games (Coin Pusher; after dawn, darts, pull-tabs, blackjack) chip in. It buys leases that cost dollars, renovations, overtime (2 minutes of rent for +25% HP and damage on the next 3 fights), Attract Mode level 1 (10 minutes of rent), and every cash sink below. The Fun Zone lease is $20,000 at Parking Lot fight 7, about 15 minutes check-in / 11.5 minutes active, and is meant to cost a renovation-spender about 2 minutes of income. Late Route 9 cash still piles into the hundreds of millions, then the billions; the sinks have to scale or the till has no register.

**Tickets.** The Fun Zone's prize currency. Skee-Ball is the early engine, the Coin Pusher can drop a ticket token, and the Cyclone is the late jackpot. They buy the prize-counter shelf (House mug, Attract nudge, service bell, whistle, overtime coupons, grip tape, doorbell, fighter slots, punch card; after dawn a short Bypass shelf: bar stool, bar bell, longer claw, souvenir shot) and Attract levels 2–3 on arcade machines (300 / 900 tickets). They are a global purse: they survive a Route 9 pave and reset on a REIT sale unless *Keep the Room* is owned. First shelf prices start at 250 tickets, so a player who visits Skee after it opens (Outlet fight 6, well into the first hour) should afford a first prize in a normal session. Tickets must not become a second cash, and they must not be the only way to get fighter slots.

**Goodwill (GW).** Route 9's fight pay. Wins at the current fight, Whac-a-Shoplifter, and Night Shift (pinball) all feed it. Each house score beaten on Night Shift is a permanent +6% Goodwill per win. Asphalt multiplies Route 9 Goodwill earnings. It buys the five Back Office training tracks (one per role, starting at 20 GW and growing ×1.3), Route 9 slot buys (2,000 then 20,000), and, after dawn, conversion into Equity. It resets on a pave and on a REIT sale. Training is this run's crew craft; conversion is how a strong Route 9 funds the Bypass.

**Equity (EQ).** The Bypass wallet for leases and training, not a second Goodwill. Bypass wins pay thin on purpose (`PAY_BASE` 0.2). Most Equity comes from the bank: 10 Goodwill per Equity today, **20 flat in M4** (already decided). The County Assessor Rolodex node (M4) sells the first 1,000 Equity of a later run at the old 10:1. Equity buys Bypass leases, Bypass training (base 2 EQ), Plaza Management (40 EQ, +3% rent on both roads per level), and Bypass slot buys. It is kept when you pave Route 9 and wiped on a REIT sale.

**Asphalt.** The Route 9 prestige layer from a repave. A finished Route 9 pays `FIGHTS[0].length + 10 × lots` = **144 asphalt** (84 fights, 6 lots). Each point is +2% Route 9 rent, stats, and Goodwill, forever, on that run of the paving loop — one pave is about **+288%**. The Bypass does not get it directly; it only sees Route 9 through Equity. Asphalt is kept across paves (it is the reward) and reset on a REIT sale. Old Paving Crew (Rolodex, M4) starts a later run with 20.

**Grapevine rumor slips (WIP, uncommitted).** The Off-Ramp's identity, not a top-bar currency and not a ticket copy. Watched bar games can drop a napkin (about 12–42% of a play, better plays hear more). You spend 1 slip for *Heard something* (+15% Bypass damage, 4 minutes) or 3 for *The inside word* (+25% damage and HP, 8 minutes). They reset with the room on a REIT sale unless *Keep the Room* is owned. **Problem, in the WIP already:** slips share a "best of" with video-poker buffs, so a Full House or Royal Flush makes the Grapevine strictly worse. See the call in §1.3.

**Rolodex cards (planned, M4).** Paid only when you Sell to the REIT: `10 + min(paves this run, 5)`, so 10–15 per sale. They buy the 12 permanent nodes (39 cards to fill, about three sales). They never reset. This is "who Sal still knows," not a combat potion and not a second asphalt.

**Achievement points (planned, v1.0).** A second wallet in the same post-sale shop, not a merge with Rolodex cards. The first REIT sale grants 1 point before fresh play, and that is also the first time the player learns the layer exists. Further points come from mostly-secret achievements that reward active play (bulbs clicked back on, a big Coin Pusher score that does not count Attract, walk-ins clicked, and a few that do not need active play). These buy the strongest upgrades in the game. The button lives on the pylons under the scoreboard, and only after the first sale.

**Consultants, with auto-renovation.** A lot's consultant appears once the *next* lot is captured. Hire for about 20 minutes of current rent; that lot keeps running. Auto-renovation is about 45 minutes of rent, then that lot's shops raise themselves when the till can cover twice the cost. They persist through a pave (that is the reason to buy before you pave) and reset on a REIT sale. Bypass lots follow the same rule, paid from the Bypass till. **Problem:** patrols on the lot track already auto-advance the same lots, and `autoCovers` treats either as enough. See the call in §1.3.

**Landmarks (billboards, water towers, neon pylons).** Visible plaza furniture. Today they are one-time: billboard after 1 lot captured, 30 minutes of rent, +2% Route 9 rent; water tower after 2 lots, 50 minutes, +3% Route 9 HP; neon pylon after 4 lots, 90 minutes, +4% Route 9 stats. After one pave (+288%), those buffs are a rounding error, and late cash has no reason to buy a second. Bypass gets its own set in M4, paid from the Bypass till. See the call in §1.3.

**Crew contracts (retainers).** A stacking crew-strength sink, opening around Sunrise Office Park, about 20 minutes of rent ×1.5 per contract, +2% stats each. Paid in cash so it does not touch the Goodwill or Equity rates. Persists through a pave (it lives on the save, not the crew). Bypass yes, from the Bypass till. Distinct from training (permanent role tracks) and from consultants (automation).

**Marketing blitzes (radio, newspaper, banner).** The repeatable cash sink that can actually soak late money. Permanent, stacking, escalating: first buys at about 15 / 30 / 50 minutes of rent after 1 / 2 / 3 lots, then ×1.5 per reprint. They add rent (+1.5% / +2% / +3% per level) and shorten walk-ins, floored at half the usual interval in `walkIns` (further stacks still add rent). Per road in M4, so a rich Route 9 cannot buy Bypass ads. **Overlap to watch in M4:** the WPNE Rolodex node is also +10% Goodwill per win. See the call in §1.3.

**High-stakes tables (not built).** A higher ante on an existing game — about 3× the usual price, with a higher prize ceiling — unlocked after that machine has been played a few times, or after the next machine in the room opens. Arcade tables spend Route 9 cash (or tickets where that is the ante); Off-Ramp tables spend Bypass cash. Roughly fair, a slight player edge, never a guaranteed win, in-game currency only. The official bot does not buy them.

**Attract levels.** Not a currency. Level 1 costs 10 minutes of rent; levels 2–3 cost tickets on the Fun Zone (300 / 900) and Bypass cash at the bar. The cabinet then plays itself badly every 5 / 3 / 2 minutes. The attract buttons and title boxes come off the room and the buy moves inside each open game; from the 2.5D room you only see the machine running and a YOU WON slip. Survives a pave; resets on a REIT sale unless *Keep the Room* is owned.

**Training, overtime, claw toys, patrols.** Training is the permanent role craft for the current run. Overtime is a short paid push. Claw toys are Fun Zone actives (bat +30% damage, duck +30% HP, troll doubles walk-ins, ball is a 30s rally, watch is 5 free overtime fights), and after dawn they apply to the crew that is actually fighting. Patrols are the early lot-track auto-advance and are merged in §1.3.

### 1.2 Problems found

1. **Patrols and consultants are the same auto-advance under two names.** Both set `autoCovers`. Patrols cost a flat lot price and reset on a pave; consultants cost play-time rent and persist. Players should not have to learn both, and the Back Office should not sell a second "keeps the lights on" after the lot track already sold a patrol.

2. **One-time landmarks do not survive contact with asphalt.** +2–4% is meaningless after a +288% pave, and a one-time buy cannot soak late cash. This is the sink that looks important and then disappears.

3. **The Grapevine WIP is invalidated by video poker.** `barDmg` / `barHp` already take the best of poker and slips, not the sum. A Full House (+30% damage and HP, 10 minutes) or a Royal (+50%, 15 minutes) makes a 1- or 3-slip spend pointless. Two Off-Ramp rewards should not eat each other. Trivia's +10% / +25% Equity per win is a different axis and is fine next to the shuffleboard board.

4. **Too many short +% combat edges sit on the same knob** (claw bat/duck, poker, shot glass, Grapevine, overtime, rally, retainers, the neon pylon, asphalt). They can coexist if each has a job, but they need a cap so a lucky night does not flatten the Campus wall.

5. **WPNE (+10% Goodwill per win) will stack with marketing** once both exist. Two Goodwill multipliers is one too many.

6. **The roster is loved and unused.** Auto lineup is always better for anyone who does not want to think. Break-room bosses (joined lot bosses) still eat a fighter slot if they are not buffers, which is the opposite of the rule Josh wants. Training purchases also do not show on the roster or on hovers, so Goodwill spent on team-building looks like it did nothing.

7. **High-stakes tables are the missing cash/ticket faucet on the machines themselves.** Decided, not built.

8. **A few stale wires, not new systems:** How to Play still says the Back Office holds the lease code (it does not; the floppy and the boot screen do). The SMW logo on the plaza still clicks through to the title screen. `GOODWILL_PER_EQUITY` is still 10 until M4. Trivia is 36 questions, not 1,200. `blitzWalkin` can report 0, while `walkIns` already floors the interval at 0.5× — one function should own that.

Nothing is a dead currency. Tickets, slips, cards, and achievement points all have jobs. The damage is overlap, not surplus. Josh's method applies: merge or cut, do not add a sixteenth wallet.

### 1.3 Calls

**Landmarks stack, with escalating cost, same curve as blitzes (×1.5 per reprint).** Do not replace them with one huge one-time buff — that still leaves late cash nowhere to go. Keep the buffs modest per stack so they do not try to outrun asphalt; asphalt is the pave reward, landmarks are the furniture you keep buying because the plaza should look like you spent money on it. One art per type in the plaza, with a count, and the stacked effect on hover (already the visual rule). Bypass landmarks follow the same stacking rule.

**Merge patrols into consultants.** One name, one system. The lot-track button stays (the Parking Lot can still be about $50 early on); it hires that lot's consultant. Once the next lot is captured, the Back Office offers auto-renovation. Consultants persist through a pave, so after a repave the lot track already shows them hired. Delete the word "patrol" from tips and How to Play. Early auto-advance is kept; the second product is not.

**WPNE becomes "your first marketing level is free each run,"** not a second Goodwill multiplier. Marketing keeps the Goodwill/rent job; the Rolodex node is a head start.

**Grapevine stacks with poker, and *The inside word* also names the next fight's tell.** They are different fiction (a rumor vs a lucky hand). Add the percentages, then cap the combined Bypass timed edge (poker + slips + shot glass) at +80% damage and HP so Campus still has a wall. The 1-slip tip stays a short cheap edge. That honors the original "intel or a short fight edge" without inventing a new currency.

**Timed combat edges (toys, poker, slips, shot, overtime, rally) stack, and the combined timed damage/HP bonus caps at +80%.** Permanent multipliers (asphalt, retainers, landmarks, training, Plaza Management) stay outside that cap; they are the long game. Show the live "tonight's edge" on the roster or a hover so the cap is readable, not a silent clamp.

**Auto lineup unlocks after Big-Box is captured, not at the start, and not as a ticket perk.** Early on the crew is small and setting the lot is the tutorial. After Big-Box, auto is quality of life, and the roster still earns its keep: break-room fighters, visible training, and the option to bench someone auto would keep. Do not remove auto, and do not invent a hidden synergy system just to justify the popup.

**Break-room crew (joined bosses) can be fielded or benched, and a fielded break-room fighter does not count against a slot.** Buffers stay on the curb, always on, never in a slot, as they are now. The roster and the fighter hover show which Goodwill (or Equity) training track buffs that person, including buffers, so a training buy is visible.

**No 1× / 5× / 10× / max strip on upgrades.** Auto-renovation is the late-game answer to repeated renovate clicks. A row of multipliers on every shop is noise, and it would make the till feel like a spreadsheet. If, after auto-reno is in a real player's hands, a shop still sits more than a few levels behind, add a single "Catch up" on that card — one control, not four. Revisit only if play or the bot says renovations are a chore.

**Rolodex cards and achievement points share a shop, not a wallet.** Cards come from the sale and buy the 12 nodes. Points come from active play (plus the first-sale free point) and buy the strongest upgrades. Merging them would let a slow check-in player skip the active-play layer, or let a grind skip Sal's tree.

**High-stakes tables stay in the decided set and ship with the rest of M3 / the room overhaul,** 3× ante, slight player edge, bot does not buy them. No other new currencies or sinks.

---

## 2. Sound plan

Today: procedural WebAudio in `src/ui/audio.ts`, nothing licensed, nothing on disk, mute saved in localStorage, silent until the first click. There is a 120 Hz sodium-lamp hum (starts with the context), a cash-register bell (rent tick every 30s, walk-in cash, renovations, game cash/ticket payouts), a throttled hit thump on blows and a couple of bar games, a cart squeak on walk-ins, and a four-note jingle on a captured lot. Battle hits are fine: not too flashy, not too loud. Leave them alone.

**The hum:** cut it from the default path. It is soothing and also the first thing anyone mutes. A muted game should feel like a quiet night, not like the real game is hidden. If a "lamp hum" toggle comes back, it is off by default and is not the master mute.

**Not every click.** No tick on tabbing, hovers, the roster, or opening a door. Renovation already rings the register; that is enough. A lease or a captured lot can keep the jingle. Attract slips and "you won" can share the register, not a new fanfare per machine.

### Ranked by impact

1. **Night Shift (pinball). Required** for the game to feel finished: flippers, bumpers, slingshots, rollovers, a drain, the punch-clock mode start, a jackpot. This is the one soundtrack that has to be designed with the table, not bolted on later.
2. **Cabinet and table verbs**, built with each overhauled game: pusher coins and the shelf thunk; Whac mallet and a wrong-target clack; Skee-Ball roll and a hole; claw motor, drop, and slip; Cyclone tick and a jackpot bell; dart hit vs wall; pull-tab rip; pool strike and a pocket; chip/card sounds in poker and blackjack; foosball clack; shuffleboard slide and a knock; a Fairway 9 tee and a splash; a trivia lock-in.
3. **Wins and payouts.** One family: the existing register for cash and tickets, a short paper-slip rustle for YOU WON / Grapevine napkins, a slightly bigger register for a jackpot or a ran rack. No unique anthem per game.
4. **Renovations and leases.** Keep the register on a raise. Keep the jingle on a capture and on a first lease. No hammer loop, no paint roll.
5. **Fights.** Keep the current hit. Optional, low: a very short hiss when a smoke break starts, nothing when it ends (battle resumes immediately under the new rules). No walk-up stinger. A quieter thump on a crew KO is enough.
6. **Dawn.** A one-shot: the sodium night lifts. Short, and only the first time each run (and a shorter cousin after a later sale, when the Bypass hides again).
7. **UI, lightly.** Walk-in squeak stays. Burnt-out bulbs that come back on can click or buzz once (not the SMW logo, which you cannot click back on). Floppy open is silent or a soft plastic click. Mute, hovers, and attract-level buys do not need a sound. Title-screen start ("Flip the sign") can share the jingle or a single click of a switch.

### How to make it ($0, GitHub Pages, no binary pack)

Stay on **procedural WebAudio**, the system already in `audio.ts`. No asset pipeline, no license sheet, no fetch on a static host, mute stays one gain node. Pinball and the cabinet verbs get a small toolkit (a few oscillators, a noise buffer, filters) behind named functions (`flipper()`, `bumper()`, `drain()`, `coin()`, `mallet()`), not a new library.

Licensed CC0 samples are a fallback only if a procedural pinball table still sounds thin after a real pass — and only a handful, short, checked for license, inlined or generated at build so Pages stays static. Do not start there.

Build the sounds with each minigame rework, then do one final listen-through before v1.0. Sound stays out of the v0.9 tag if the overhaul is not done; v1.0 should not ship without the pinball table and the cabinet verbs.

---

## 3. Minigame design briefs

**The room, first.** The Fun Zone and the Off-Ramp are each one 2.5D room, not a row of identical joystick cabinets. Click a machine to open its full game screen. Attract level buys live inside that screen. From the room you see Attract running on the machine itself, with a YOU WON slip (or a napkin at the bar) on the cabinet — no need to animate every autoplay in full. The plaza top bar can stay frozen; inside the room, scrolling and a frozen bar matter less because you are looking at a room, not a second plaza. Each machine looks like the thing it is. A joystick cabinet is right for the claw, and wrong for pinball, pool, shuffleboard, darts, or Fairway 9.

**House rule for all of them:** a slight player edge, never a guaranteed win, never a strong house edge, in-game currency only. Payout currencies stay as they are (Route 9 cash / Goodwill / tickets; Bypass cash / Equity / Grapevine slips). Toad mockups before each build, one or two games at a time. Keys are optional; every game still works by tap. Pool cue artifact (below) is patched in the quick fixes if the pool rework waits.

**Coin Pusher.** A real pusher, not a slot in a cabinet. A play drops a handful of coins; where they land matters; the field and the tower persist in the save. A bonus hole or a timed shelf drop can put coins (or a ticket token) you did not just pay for onto the shelf, so a visit can come out ahead. The Rent Check is a real coin, not a hidden roll. Attract is a weak player dropping badly. Sounds: coin, shelf thunk, a token, a heavy drop when the tower goes. Look: a glass-front pusher case, not a joystick cabinet.

**Whac-a-Shoplifter.** Read the turn: bag vs basket, do not bonk a customer. A shallow counter or cabinet face, not a long vanishing-point aisle. Misses and wrong targets cost the game. Sounds: mallet, a wrong-target clack, a miss. Look: a carnival hammer cabinet or a counter, not the claw's joystick box.

**Skee-Ball.** Nine balls, hold for power, visible holes, a real score. The 450-point song is a skill shot, not a pity timer. Sounds: wood roll, hole, the rare song. Look: an alley with a ball return, played full-screen from the room.

**Claw Machine.** The one that may keep a joystick. Hover a toy to read it, aim, grab; off-center grabs slip on the way up; misses are real, especially for Attract. Sounds: motor, claw clank, slip, a prize drop. Look: a glass claw case with a stick and a button.

**Night Shift (pinball).** Has to be fun on its own, with audio, or it is not done. A time-clock playfield: ramps, standups, lanes, a punch-clock mode, multiball. Flippers on A/D, arrows, and tap. House scores stay the Goodwill board. Sounds: see §2. Look: a real pinball body with a backglass, never a joystick cabinet.

**Cyclone.** Stop the light on the jackpot. Timing, not a hidden roll. Near-misses pay small; the jackpot is rare and then the machine is serviced. Sounds: the tick around the circle, a miss, a jackpot bell. Look: a carnival light box with a big button.

**Darts.** Three darts, a drifting board, click when you mean it. Three in the bull is the bar-goes-quiet win and needs the pot on the shelf. Sounds: a hit, a wire, a wall. Look: a cork board and a throw line, not a cabinet.

**Pool.** Six shots at a racked table, pull-back aim, real collisions and pockets. **Bug to patch if this rework waits:** pulling the cue back and changing the angle can leave dotted-aim and cue pixels on the background *behind* the table — the overlay is probably painting past the table canvas. Clip the aim and the cue to the table (or draw them on a layer that is fully cleared each frame). Sounds: cue strike, a click of balls, a pocket, a scratch. Look: a bar table with a hanging lamp, felt you can see, no cabinet.

**Video Poker.** Jacks or Better, hold and draw, already the right game. Keep the hand names and the timed Bypass buffs. Sounds: deals, holds, a modest win stinger (the Royal can be a little more). Look: a bartop poker machine, not an arcade cabinet.

**Foosball.** First to five. Aim a man (A/D or arrows or tap), shoot (Space or tap). The house is beatable, not asleep. Sounds: rod, kick, a goal. Look: a table you look down on, not a cabinet.

**Shuffleboard.** Six pucks against the house, aim, hold for power, collisions already in. The far end is worth more; knocking the house off is the skill. Beating the third house score still adds a Bypass fighter slot. Sounds: a slide, a knock, a thud at the end. Look: a long bar board.

**Bar Trivia.** Five questions, faster is more points, categories and a difficulty toggle, a 1,200+ pre-1998 original-or-open-licensed bank (36 are in today), a no-repeat bag per run. Three right and five right keep their Equity buffs. Sounds: a lock-in, a right, a wrong, a small end sting. Look: a bar TV or a quiz box, not an arcade cabinet.

**Pull-Tabs.** Three tickets from the box, peel every tab, three alike pays, blanks go in the bucket. Readable odds, a rare three-sevens, not a slot reel. Sounds: a paper rip, a small win, the sevens. Look: a cardboard box on the bar.

**Blackjack.** The bartender deals from a shoe. Hit, stand, **double down, and split** (H / S, and clear tap buttons for double and split). Dealer stands on 17. Blackjack pays the better prize; a push returns the ante; the house can win. Slight player edge, not a taught-to-lose shoe. Sounds: a deal, a chip, a soft win, a blackjack. Look: a bar felt and a shoe, not a cabinet.

**Fairway 9.** A short nine, par 18, aim and hold for power, water costs a stroke. Under par is the boast; losing balls is common. Sounds: a tee, a flight, a cup, a splash. Look: a tapper or a felt fairway on the bar, not a joystick cabinet.

---

## 4. Ordered Tuesday build plan

Small chunks. Push live after a checked chunk when Josh has said to. Usage is S / M / L: S is one or two files and a targeted test, no screenshot sweep; M is a few files and maybe one 1280 and one 390 shot of the changed screen; L is cross-cutting, or a full 1280 / 1366 / 1440 / 1920 plus 390×844 sweep, reserved for a live push or a room reveal.

### A. Quick fixes — first on Tuesday, before anything else (v0.9)

| # | Chunk | Cost |
|---|---|---|
| A0 | Add a short `CONTEXT.md` (code map, leak rules, current branch, do-nots) so later chunks do not re-read the v0.5–v0.9 docs. See §5 and §6. | S |
| A1 | Swap the Off-Ramp logo to the **painted matchbook** (`/workspace/smw-mockups/v09f/or-c1-matchbook-painted-*`), strike moved so it does not cut off "STRIKING". This is the one Josh meant (he counted the original as option 1). | S |
| A2 | Finish and commit the **Grapevine WIP** already in the worktree, then apply the §1.3 stack-with-poker and tell-on-*inside word* fix, plus the +80% Bypass timed-edge cap. Leave the uncommitted work untouched until this chunk. | M |
| A3 | **Smoke-break and fight-swap rules.** No walk-up after a smoke break; battle starts immediately. A smoke break only when advancing to a fight you have not unlocked yet, or on total crew death (and today's "someone went down" break can stay if it still reads, but swapping a cleared fight must not force one). Swapping between cleared fights queues the new enemies behind the at-bat and on-deck groups — you may have to win or lose those two, because they are already in. When you tier down, the new group is "in the hole" and walks out after the at-bat are defeated, becoming the next on-deck. After a smoke, the currently selected fight is immediately at bat. No waiting to finish the line before you swap. Attacks are not delayed by the walk-up; the walk-up takes the time the old poof did. | M |
| A4 | Clicking a burnt-out **unit** bulb flickers it back on. Not on the SMW logo. | S |
| A5 | **SMW logo burnout**, its own logic, not the unit flicker. Never two letters out at once, never two rays at once. One letter and one ray is fine. Most often: everything lit, or the O out, or the southwest ray out, or both the O and the southwest ray. Other letters or other rays are rare. You cannot click the logo back on. | M |
| A6 | The **receipt grows** with the top bar once the asphalt billboard is showing (the bar stretches a little taller to fit it). | S |
| A7 | **Roster and slots:** break-room crew can be fielded or benched and do not count against a fighter slot when fielded; roster and fighter hover show which GW / EQ training track buffs them, including buffers. Gate auto lineup until Big-Box is captured. | M |
| A8 | Stop the **SMW logo** from going to the title screen. The floppy stays the save path; the code lives in that popup and on the boot screen only. Confirm the lease code is gone from the Back Office. | S |
| A9 | **Pool cue artifact** patch if the pool rework has not started: clip or clear the aim dots and the pulled-back cue so they cannot paint the room behind the table. | S |

### B. Economy fixes from §1 (v0.9)

| # | Chunk | Cost |
|---|---|---|
| B1 | Landmarks become stackable with ×1.5 cost, modest stacked buffs, count on the plaza hover. Bypass set still waits for M4, but uses this rule. | M |
| B2 | Merge patrols into consultants (lot-track hire + Back Office auto-reno, persist through a pave). Copy pass on the word "patrol." | M |
| B3 | Consultants, landmarks, and contracts polish: one readable Back Office grid, hover text that states the job in game language, not a design note. | S |
| B4 | High-stakes tables (3× ante, slight player edge, bot does not buy). Can sit with the first room work in D if that lands sooner. | M |

No multi-buy strip. No new currencies.

### C. Game start, theme, and copy (v0.9)

| # | Chunk | Cost |
|---|---|---|
| C1 | Every fresh start (new game, repave, REIT sale) waits for a first click before the first fight. **Call: "Flip the sign"** — the OPEN sign in the pawn-shop window, which fits a night that ends at dawn better than "open the doors." After dawn, Self Storage can be "Cut the padlock" or the same flipped sign. It does not have to be deeper than that. | M |
| C2 | After dawn, the title screen becomes the "dawn on Route 9" scene, with the drive-north choice. Pre-dawn titles still show the lot filling in as shops unlock. | M |
| C3 | Copy pass: How to Play, hovers, prize text, uncle lines, and the stale "Back Office lease code" line. Game voice, short, no design-doc leftovers. | M |

### D. Minigame overhaul (starts late v0.9, finishes in v1.0)

| # | Chunk | Cost |
|---|---|---|
| D1 | Fun Zone as one 2.5D room: click a machine for its full screen, Attract buys inside the game, autoplay visible in the room with YOU WON slips, attract bars and title boxes removed. Toad mockup first. | L |
| D2 | Off-Ramp as one 2.5D room, same rules, napkins on the tables for slips. | L |
| D3 | Rebuild games one or two at a time from the briefs in §3, flagship first: Night Shift (with its sound), Coin Pusher, Claw, then pool (artifact gone for real), blackjack (double and split), and the rest. Split `machines.ts` / `arcade.ts` as each game is touched (§6). | L each, batched |
| D4 | Trivia bank in batches toward 1,200+ pre-1998 original or open-licensed questions. Existing 36 stay and get tagged. | M per batch |
| D5 | Hotkeys in How to Play as each door unlocks (Esc, roads, rooms, in-game keys). Everything still has a tap. | S |

v0.9 can ship with D1–D2 and a flagship or two if time runs out; the rest is required for v1.0.

### E. Post-REIT layer (M4 in v0.9; achievements in v1.0)

| # | Chunk | Cost |
|---|---|---|
| E1 | M4 knobs already decided: Bypass reno growth 1.50, Goodwill per Equity 20 flat, Bypass-only offline cap 8h → 12h after dawn, walls ≤60% / 30 tries, Bypass hides until dawn on later runs. Re-run the guard after rooms and sinks; do not shrink a played Route 9 under 15h ± 1. | L (sims, not a long weekend of them until knobs move) |
| E2 | Sell to the REIT, Uncle Sal's Rolodex (12 nodes, 39 cards, *Keep the Room* costs 8, WPNE as the free first marketing level). Arcade resets on the sale unless that node is owned. Shop opens after the first sale, before fresh play. Leak rule: no sale or tree words before the first sale. | L |
| E3 | Secret achievements, the point shop in the same post-sale UI, 1 point on the first sale, button under the scoreboard on the pylons only after that reset. Active-play first (bulbs relit, big pusher scores, walk-ins clicked); a few that do not need it. Most are ??? until unlocked. | L |

### F. Sound pass (v1.0, and with each D3 game)

| # | Chunk | Cost |
|---|---|---|
| F1 | Cut the default hum (optional lamp-hum toggle, off by default). Leave battle hits. | S |
| F2 | Pinball voice, then cabinet/table verbs with each rework, then one full listen before v1.0. Dawn one-shot, bulb click, no click-on-everything. | M–L |

### G. Repo cleanup, then tags

See §6 for the full cleanup. Do the safe, no-rewrite steps before the v0.9 tag (screenshots out of the tree, docs collapsed, `CONTEXT.md` already from A0). Split big files as D3 touches them. History squash or a force-push is **only with Josh's approval**, ideally as the v0.9 tag is cut, or deferred to v1.0 if he would rather not rewrite `main`.

Then bump to 0.9.0, tag `v0.9`, and send the live link. v1.0 gets its own tag when §D, §E3, §F, and §6 are done.

---

## 5. Usage

Coding costs more as the game grows because each change has more to read, more to risk, and more to prove. The hot files are already long (`machines.ts` 788, `arcade.ts` 491, `GameRoom.tsx` ~391, `room.ts` 426, `scripts/check.ts` ~370). Agents re-read `V09_POLISH.md` (555 lines) and friends because there is no short current map. A "quick look" becomes a four-size screenshot sweep. `balance.ts` and full `check.ts` runs are right when knobs move, and expensive when the chunk was a logo or a typo. WIP commits and 235 screenshots in the repo also make every checkout and review heavier.

**Concrete cuts, in order of savings:**

1. **A short `CONTEXT.md`** (and this file as the forward plan). What is live, what is next, where economy / rooms / leak checks live, the Bypass leak rule, "do not reopen" decisions, and "do not commit screenshots." Agents should not have to open v0.5–v0.8 docs to change a bulb.

2. **Targeted tests and cheaper default sweeps.** A chunk adds or runs the checks it can break, not the whole of `check.ts` plus twenty PNGs. Screenshot only the changed screen, at 1280×800 and 390×844, while building. The full 1280 / 1366 / 1440 / 1920 plus 390 sweep is for a live push or a new room, not for every typo. Use a cheaper effort level on routine S chunks (logo swap, copy, a clip fix). Batch related fixes (A4–A6, A7, B1–B3) in one session.

3. **Smaller files, and less junk in the repo.** Split `machines.ts`, `arcade.ts`, and `room.ts` by game when the overhaul touches them, so a blackjack change does not load the pusher. Move screenshots and mockups out (§6). Do not run long `balance.ts` sims unless a knob or a sink curve changed; two seeds are enough for a smell test.

Other habits that help: commit the Grapevine WIP as its own slice before starting the next file; keep comments to the *why*; do not paste design-doc voice into game copy (that is also a copy bug). Complexity will still cost something — the game is bigger — but it should grow near-linear with the chunk, not with the whole history of the plaza.

---

## 6. Repo cleanup

Josh asked how this repo looks next to Mall Bats, and whether we have built an objectively working mess. The honest answer: **the game code is not the mess.** `src` is about **8,200 lines across 55 files**. Mall Bats, for reference, is about **12,500 lines across 35 files**. We are smaller, not a larger spaghetti bowl. A human can still get lost, but the volume is fine.

**Why we have more files with less code:** we split too eagerly. Our average file is about 150 lines; Mall Bats sits closer to 350. At one end, `machines.ts` is 788 lines and should be broken up. At the other, **a dozen files are under 50 lines** — a constructor helper, a mute button, a 13-line RNG — each with its own import path. That is why 8,200 lines became 55 files instead of ~35. The target is to group by thing, at roughly **150–400 lines** per file: merge the crumbs into their neighbors, and split the oversized ones when the minigame rework touches them. Do not flatten everything into a handful of 800-line dumps, and do not keep a file just to hold one function.

**The mess is around the code**, and that is what makes the repo look like it was assembled in a hurry:

- **235 screenshots committed** under `screenshots/` (plus 41 untracked review shots in this worktree). That is 21 MB of PNG history sitting in a game repo. Mockups already live outside, in `/workspace/smw-mockups`.
- **Ten versioned plan docs** in `docs/` (ART_DIRECTION, CORE_LOOP, REVISION, V05–V09, including a 555-line polish doc and a 536-line v0.7 revision). Three current docs would do: `README.md`, `DESIGN.md`, and a short `CONTEXT.md` code map. Historical plans can leave the default branch (a `docs/archive/` tag, or just git history).
- **Five `wip: … (do not merge to main)` commits are already on `main`** (`7eebf28`, `ea04c07`, `4822a7b`, `401e5d4`, `d6f803e`). The warning was right; the merge happened anyway. That is the "haphazard" look, more than any one function.
- **214 source lines over 160 characters.** Dense, hard to read, expensive to diff.
- **A few oversized files:** `machines.ts` 788 lines, `arcade.ts` 491, `room.ts` 426. Those are the ones to split, not a blanket rewrite.

### What to do

**Move screenshots and mockups out of the repo.** Review shots and Toad's sheets stay in `/workspace/smw-mockups` (or another folder that is not this git tree). Delete `screenshots/` from the working tree in a normal commit. Stop committing PNGs "for the record." A Pages build does not need them. This is the biggest cheap win, and it does not rewrite history.

**Collapse the docs.** Keep `README.md` (how to run it, the live link, the leak rule in one line), `DESIGN.md` (what the game is: one night on Route 9, Sodium Night, currencies in a paragraph, v0.9 vs v1.0), and `CONTEXT.md` (file map: economy in `src/game/economy.ts`, knobs, sinks, rooms, UI entry points, `scripts/check.ts` leak words, current branch, "do not reopen" list). This plan (`V10_PLAN.md`) stays until v1.0, then its useful bits fold into DESIGN and CONTEXT and it can be archived too. Do not edit old V05–V09 docs in place; move them out of the way so agents stop treating them as current.

**Clean history, with a brake on force-push.** Safe anytime: the screenshot deletion, the doc collapse, ordinary commits that do not rewrite `main`. At the `v0.9` tag, offer Josh a **clean history plan** — squash the five WIP commits into the features they actually shipped, and optionally drop screenshot blobs from history so clones stay small. If that needs a force-push of `main` (or of `v09`), **stop and get Josh's approval first.** The alternative that never rewrites `main` is a fresh `release` branch (or an orphan) that becomes the default, with `v0.9` tagged there, and old `main` left as archive. Do not force-push as a courtesy; ask.

**Split the big files when the minigame rework touches them anyway**, and merge the crumbs at the same time. Do not spend a Tuesday on a pure move-only refactor; fold or split a file when you already have to touch it (D3 for games, A0/`CONTEXT.md` can list the target paths). That is also a usage cut (§5).

**Tiny files (under 50 lines): merge most, keep a few on purpose.**

| File | Lines | Call |
|---|---|---|
| `content/make.ts` | 7 | **Merge into `defs.ts`.** The `B` / `S` / `E` / `BOSS` constructors belong next to the types they build. Region files then import from `defs` only. |
| `rng.ts` | 13 | **Merge into `state.ts`.** The stream is `state.seed`; battle, room, bot, and sim can import it from there. |
| `art/font.ts` | 15 | **Merge into `art/grid.ts`.** The 3×5 glyphs are a grid-drawing primitive. |
| `art/logos.ts` | 17 | **Merge into `art/sign.ts`.** It is only the night-sky star tile; room logos are already PNGs. |
| `Speaker.tsx` | 17 | **Merge into `Pylon.tsx`** (and export it for the title screen). Mute already lives on the top bar. |
| `Calls.tsx` | 27 | **Merge into `Lot.tsx`.** Overtime is only rendered there. |
| `Receipt.tsx` | 43 | **Merge into `Pylon.tsx`.** The receipt is part of the top bar; only the pylon imports it. |
| `rates.ts` | 44 | **Merge into `economy.ts`.** Live +/s is the purse's display math, and economy already sits at 329 lines — still inside the 400-line cap. |
| `content/copy.ts` | 23 | **Keep.** Pre-dawn How to Play and story words. The leak check greps this file; do not fold it into `dawn.ts` or `Screens.tsx`. |
| `knobs.ts` | 49 | **Keep.** The seam `balance.ts --knob` patches. `defs.ts` already re-exports it. |
| `art/palette.ts` | 46 | **Keep.** Twenty-three colors, imported by almost every art and game file. A shared palette should stay one obvious module. |
| `ui/format.ts` | 29 | **Keep.** `fmt` / `fmtClock` are imported all over the UI and by `sim.ts`. A widely shared helper is cheaper as its own file than pulled through a screen. |

That drops about eight files and answers the "why so many" question without touching the leak boundary.

**Keep Bypass and dawn content separate.** `scripts/check.ts` allows post-dawn words only in `src/game/content/dawn.ts` and `src/game/content/bypass.ts` (plus `debug.ts`). Do not merge those two into `route9.ts`, `copy.ts`, or `defs.ts`. When M4 adds the Rolodex, it gets its own leak-gated file (`content/rolodex.ts`), same rule. Pre-dawn copy stays in `copy.ts`.

**Target folder layout**, grouped by thing, one file per venue or game, roughly 150–400 lines. Names can shift; the grouping is the point.

```
src/
  main.tsx, app.ts, debug.ts
  game/
    knobs.ts              # keep: balance seam
    defs.ts               # types, constructors (make.ts folded in), FIGHTS
    state.ts              # + rng
    economy.ts            # till, leases, training, live rates
    sinks.ts
    battle.ts
    sim.ts, bot.ts, save.ts
    room.ts               # shared payout, Attract, perks — stays thin
    content/
      copy.ts             # keep: pre-dawn words, leak-checked
      route9.ts           # Route 9 lots, shops, enemies
      battlers.ts         # shared / Route 9 roster (Bypass names belong in bypass.ts)
      dawn.ts             # keep separate (leak check)
      bypass.ts           # keep separate (leak check)
      rolodex.ts          # M4, also leak-gated
  art/
    palette.ts            # keep
    grid.ts               # + font
    sign.ts               # + star tile
    people.ts, storefronts.ts, field.ts, frames.ts, landmarks.ts
    cabinets.ts           # shrinks as rooms get their own art
  ui/
    format.ts, audio.ts, styles.css, lights.ts
    art.ts                # canvas cache, data URLs
    Pylon.tsx             # + Speaker + Receipt
    Lot.tsx               # + Calls (Overtime)
    Shops.tsx, Field.tsx, Roster.tsx, ZoneTrack.tsx
    BackOffice.tsx, Screens.tsx, TestPanel.tsx
    funzone/
      room.tsx            # 2.5D Fun Zone; click a machine to play
      pusher.ts, whac.ts, skee.ts, claw.ts, pinball.ts, cyclone.ts
    offramp/
      room.tsx            # 2.5D Off-Ramp
      darts.ts, pool.ts, poker.ts, foos.ts, shuffle.ts
      trivia.ts, tabs.ts, blackjack.ts, fairway.ts
```

`machines.ts`, `arcade.ts`, `bar3.ts`, `bargames.ts`, and `shuffle.ts` dissolve into those per-game files as D3 rewrites each one. `GameRoom.tsx` becomes the two `room.tsx` files. A trivia question bank can sit next to `trivia.ts` as data, not as a 1,200-entry wall inside the component.

**Line length and formatting.** Soft wrap around 100 columns; nothing casual over 160. No new one-line functions that bury a payout table. Match the file's existing style; do not run a repo-wide prettier pass that diffs every line unless Josh asks for it. A small format pass on a file you already split is fine.

**Delete dead code.** Find it with `rg` (unused exports, the duplicate walk-in formula vs `blitzWalkin`, stale How to Play lines, commented-out blocks, old cabinet paths, unused art). Delete, do not comment out. If the leak check or a unit test is the only justification for a helper, keep the test and the helper, or drop both.

**Comments only where the why is not obvious.** "Buffers do not take a slot" is worth a line. Restating the next line in English is not. Game copy does not belong in comments, and design-doc voice does not belong in tips.

**The test of done:** a human who was not in the chat can clone the repo, read README and CONTEXT, find the till logic, and change a payout without opening a 500-line plan or a folder of review screenshots. The game stays simple on the outside: one night, two roads, each currency with a job. That is also how usage stays cheap.

---

## Already decided, do not reopen

Fun Zone at Parking Lot fight 7 for $20,000. Off-Ramp at Exit 14 fight 4. Attract 5 / 3 / 2 minutes. Grapevine is the Off-Ramp's reward identity. Trivia 1,200+, pre-1998, no scraped sets. Fairway 9 is the third bar game. Rival buyouts are out. Blitzes are permanent and stacking. In-game currency only; no sweepstakes parlors. Test mode stays on the live site. Bypass M4 knobs in `V09_BYPASS.md` §12 (reno 1.50, 20 GW/EQ, 12h post-dawn cap, arcade resets on sale unless *Keep the Room*, Bypass hides until dawn, walls ≤60% / 30). Working titles: Sell to the REIT, Uncle Sal's Rolodex, Rolodex cards. v1.0 is the finished game with sound. From here, polish and cohesion, not new features.

---

## Josh's calls, 15 Nov (supersede anything above)

- **Patrols stay** (pre-dawn, lot track). Do NOT merge them into consultants (cancels B2). Consultants are the post-dawn cash sink, scoped **per lot** and covering that lot's 3–4 shops. Their extra job beyond patrols is auto-renovation (a second upgrade), so the two don't overlap.
- **1997 pass:** Vape Shop becomes Smoke Shop. Cell Phone Kiosk becomes a RadioShack-style electronics store (parody name, not the real brand). Full period check of every shop name, blurb, tip and How to Play line.
- **Achievements:** quietly count hidden stats from v0.9 (bulbs relit, non-autoplay pusher scores, random events clicked, etc.); the UI stays hidden until the first REIT sale.
- **Saves:** one clean save wipe is allowed at 1.0; no migration needed across reworks before then.
- **Minigames:** all 15 get the full rework for 1.0.
- **No reduce-flicker toggle.**
- **Balance:** add a skilled active-player simulation alongside the check-in bot.
- **Mobile:** 2.5D rooms are desktop first; portrait comes after 1.0.

## Cohesion calls, 15 Nov (supersede anything above)

- **Patrols cost Goodwill, not cash.** Without a patrol, a lot you can't beat keeps fighting and losing, earns no Goodwill, and never drops you back. With a patrol, a loss drops you to the highest fight you can win, which keeps paying Goodwill. Idle players farm their way to patrols; pushers trade that for progress. Training competing with patrols is intended. Price patrols in minutes of farming time and test them in both sims.
- **No Goodwill auto-spend before dawn.** A post-dawn "crew coach" consultant that auto-trains Route 9 is optional; discuss before building.
- **Minigames pay their room's currency** (Fun Zone tickets or Goodwill, Off-Ramp slips or Equity); cash only as an occasional jackpot.
- **Overtime: undecided.** Leave as is until Josh decides.
- **Cut crew contracts.** Stacking landmarks take the stat-sink job.
- **One short-boost type per room:** claw toys for Route 9, Grapevine slips for the Bypass. Video poker pays slips instead of its own buff. Cut the shot glass and the other separate timed buffs into these two.
- **Walk-ins pay a little Goodwill or a chance at a ticket**, not cash.
- **Bypass farming pays real Equity** (raise PAY_BASE so it's worth it under the patrol rule); GW-to-Equity conversion stays as a top-up.
- **Plaza Management folds into the Bypass landmarks.**
- **Fighter slots: Goodwill buys plus one room source** (pick the prize shelf or shuffleboard at build; drop the other).

## Bottleneck design, 15 Nov (supersedes overtime and the boss auto-overtime patch)

- **Cut overtime entirely**, including the M1 automatic boss overtime after two failed patrolled tries. Walls should be felt and solved, not bullied through.
- **Design spine:** the player hits a wall, works out why, breaks it, then hits the next. Resets and repaves break walls faster through buffs and the player's own knowledge.
- **Wall map (new design task before building):** list every boss and lot with its crew makeup, what it beats, what beats it, and which unlocked unit or role solves it. Walls should push the player to shift focus: upgrade one shop or role to pass a wall, then bench it and build another for the next wall. Strengths and weaknesses become the core of the puzzle, so check that the system has enough depth and make it readable on hovers and the roster.
- **The tools to break a wall** are farming Goodwill for training, cash for renovations, and changing the lineup. Patrols cost a bit more Goodwill, as a goal once the farm-versus-advance loop is understood. Auto lineup is a goal worth unlocking because crew makeup is a real bottleneck.
- **Balance:** re-run the check-in and skilled active sims without auto-overtime. Each wall should stop progress for a while but be breakable with the intended tools. Keep Route 9 near 15h±1, or retune and report.

## Josh notes, Nov 18 (playtest; supersede anything above where they conflict)

**Josh's calls, Nov 18 (decided; they settle items 4, 5, 11, 14 and 16 below):**
1. **Captured bosses:** every boss, the final two included, can be rematched at normal pay. The 25× pays only on the first capture.
2. **Bypass units:** add 5 new units, taking the Bypass from 16 to 21. Draft concepts are in item 11, for Josh to review.
3. **Consultant:** a post-dawn purchase per lot that auto-renovates that lot's shops. No patrol effect.
4. **Stepping down with ◂:** it pauses the patrol's climb until ▸ is pressed or a new fight is cleared.
5. **Bypass lots:** **9 lots, still 21 units.** The Bypass is the longer road (25–30h after dawn), so it gets more milestones, not fewer. Draft layout in item 11.

Read from the code on `v09` (same `src` as `main`), plus a probe run (seed 1991, check-in bot, first run, no asphalt, measured for 10 minutes on each fight with auto-advance off). No source changes yet. Each item: the problem, what the code does now, and the fix (delete before add).

1. **Walk-up and formations.**
   *Now:* `Field.tsx` walks every group in from one direction, the upper right (`x + k·70, y − k·46`). Enemies stand on a fixed grid of 3-high columns, 24 px apart (`enemySpot`). The waiting group is drawn on the same grid shifted by (+36, −20). Past 3 regulars the queue lands on the second column, and that is the overlap. Fallen enemies keep their spot (spots are indexed over every regular, dead or alive), so the back line never steps up.
   *Fix:* pick an entry lane per group from three: upper right (today), far right, or lower right (the mirror of upper right). Index spots over **living** enemies, so when a front-liner drops the back line tweens forward one spot. The waiting group never moves until the last man is down; that rule is already correct. Fix the queue's place: put the on-deck group behind the last column, not on top of it, and the in-the-hole group after that (3 fights visible at most). Give each spot a small seeded jitter (±3 px x, ±2 px y, from the unit's uid) so the line stays a line but stops looking stamped. No new art.

2. **Walk-ins.**
   *Now:* each unit has exactly one walk-in: one kind and one "who" line (`S(..., kind, who)` in `route9.ts` / `bypass.ts`). The item it brings is picked at random from a shared pool of 4–6 per kind (`WALKIN_NAMES`), so a Dentist walk-in can be "Woman with a Jet Ski Problem." A walk-in rolls every 90s (75 with the bell), at a random **leased** unit of the road you're viewing, and lasts 25s. **The scroll bug:** the popup is drawn inside that unit's storefront, so if the unit is scrolled off-screen you never see it and it times out.
   *Fix:* every walk-in belongs to its business (table below). Delete the shared item pools. Roll only among units **on screen**: `Shops.tsx` already measures the grid, so it can pass the visible ids to the roll, and if none are visible, skip the roll. No new indicator is needed. Kinds follow the 15 Nov call: walk-ins pay a little Goodwill (Equity on the Bypass), a chance at a ticket (a slip on the Bypass), or a rally, never cash. R = rally, G = Goodwill or Equity, T = ticket or slip chance.

   | Unit | Today | Proposed |
   |---|---|---|
   | Pawn Shop | rally · Wants to pawn | R Pawning a class ring · G Buying back his guitar · T Kid selling a Game Boy |
   | Dojo | rally · Sparring partner | R Sparring partner · R Just saw a Van Damme movie · G Birthday party, 12 kids |
   | Laundromat | cash · Found in a dryer | T Found in a dryer · G Needs quarters for the change machine |
   | Smoke Shop (was Vape) | cash · Reseller | G A carton and a scratch-off · T Won $2 on the scratch-off |
   | Fun Zone | cash · Needs change for a five | T Cup of 400 tickets · G Birthday party booking |
   | Security Office | referral · Retired cop | none (it doesn't make money) |
   | Video Rental | cash · Returning a tape | G Returned it rewound · T Late fee in pennies · R Wants the new Jackie Chan |
   | Payday Loans | cash · Borrower | G Paid on time, somehow · R Collections guy, off the clock |
   | Nail Salon | referral · Regular | G Regular · G Bridal party of six |
   | Tanning Salon | rally · Bronzed guy | R Bronzed guy · G Prom week |
   | Karaoke Bar | rally · Wants the mic | R Wants the mic · G Bachelorette party |
   | Check Cashing | cash · Cashing a check | G Cashing a check · T Tax-refund day |
   | Driving School | referral · Passed on the 4th try | G Passed on the 4th try · R Nervous teen (and his dad) |
   | Pet Grooming | rally · Very good dog | R Very good dog · G Show poodle |
   | Copy Center | referral · Needs 500 flyers | G Needs 500 flyers · G Thesis due at 9 a.m. |
   | Dentist | cash · Paying cash | G Paying cash · T Kid with a treasure-chest prize |
   | Mattress Store | cash · Just looking | G Just looking (lying down) · R Moving into his first apartment |
   | Electronics (was Kiosk) | referral · Answered the question | G Needs a pager · R Batteries for a Walkman |
   | Gym | rally · Spotter | R Spotter · G New Year's resolution |
   | Party Supply | cash · Needs 40 balloons | G Needs 40 balloons · T Leftover piñata candy |
   | Plaza Management | referral · Somebody with a complaint | none (office hours by appointment) |
   | Self Storage | cash · Unit 114, behind on rent | G Unit 114 pays up · T Auction find |
   | Car Wash | rally · Wants the hot wax | R Wants the hot wax · G A fleet of six vans |
   | The Off-Ramp | cash · Regular, wants his stool back | T Regular, wants his stool back · G Darts league night |
   | Dojo (Exit 14) | rally · Sparring partner | R Sparring partner · G Belt test day |
   | Urgent Care | referral · Got stitches, liked it | G Got stitches, liked it · R Sprained ankle, wants back in |
   | Security Office (Bypass) | referral · Retired cop | none |
   | Bail Bonds | referral · Somebody's cousin | G Somebody's cousin · R Skipped bail, came back |
   | Tax Prep | cash · Wants a bigger refund | G Wants a bigger refund · T Shoebox of receipts |
   | Wash-n-Fold | cash · Found in a dryer | T Found in a dryer · G Drop-off, 40 pounds |
   | Golf Superstore | rally · Practicing his swing | R Practicing his swing · G Corporate outing |
   | Payday Loans (Bypass) | cash · Borrower | G Borrower · R Collections guy |
   | Bridal Boutique | referral · Mother of the bride | G Mother of the bride · R Bride on a deadline |
   | Party Supply (Bypass) | cash · Needs 40 balloons | G Doug's brother's party · T Leftover confetti |
   | Cineplex | rally · Snuck in | R Snuck in · G Midnight premiere line |
   | Pet Grooming (Bypass) | rally · Very good dog | R Very good dog (he drove) · G Show poodle |
   | Pretzel Stand | cash · Wants the cinnamon one | G Wants the cinnamon one · T Free-sample guy |

3. **Renovations: cash-only vs cash and combat.**
   *Now:* every renovation does both: rent ×1.2 (`RENT_GROWTH`), plus a stat step in `statsOf`. Tanks get HP ×1.1; damage, heal and control units get their hit ×1.1 and HP ×1.08; buffers get only **+4% of base** on their aura (`AURA_STEP`). Nail Tech's haste, for example, goes from 20% to 20.8%. Three things make some read as cash-only: (a) the card's "▲ +X HP +Y DMG" line shows **+0 HP +0 DMG** for every buffer (Nail Tech, Karaoke Host, Notary, Copy Guy, Personal Trainer; Detailer and Wedding Planner on the Bypass), because the aura step isn't shown; (b) tanks show "+0 DMG"; (c) some main effects never scale at all: Tanning and Pretzel regen, and Bartender, Bondsman and LP Manager damage reduction. Units with no rent (both Security Offices, Plaza Management) are combat-only and say "no rent."
   *Fix:* one rule: **every renovation is +20% rent and +10% of the one thing this unit does.** Set the aura step to the same 10% (delete `AURA_STEP` and use `MAIN_GROWTH`), scale regen and damage reduction the same way, and have the card print that one thing in the unit's own words ("haste 20% → 22%", "HP 260 → 286"). Delete the generic HP/DMG pair from the card.

4. **Goodwill to Equity waters Equity down.**
   *Now:* the bank is 10 GW per EQ (`GOODWILL_PER_EQUITY`), one way, unlimited. Bypass wins pay `0.2 × 1.09^fight`, rounded, with a floor of 1. Because of that rounding, **every fight in the first two Bypass lots (about 24 fights) pays exactly 1 EQ**. The last regular fight pays 21 and the Chairman 572. Route 9 at the end (probe): Pinewood Commons fights farm **~400–1,500 GW/min**. That is ~2–9K EQ/hour at 10:1. The real leak is **re-farming a captured boss**. Bosses pay 25 wins' worth (`BOSS_PAY`) every time, and a finished crew beats an earlier boss in ~4 seconds: Regional Property Manager **49.3K GW/min** (0 losses), Building Manager 24.6K GW/min. At 10:1 that's **~150–300K EQ/hour**. Every Bypass lease combined costs ~143K EQ, so half an hour of boss farming buys the whole road. Bypass farming measured 1–23 EQ/min. Asphalt then multiplies all Route 9 Goodwill (+288% per pave).
   *Fix (delete first):* (a) **decided (call 1): a boss pays 25× only on its first capture;** every rematch, the final two bosses included, pays like a regular win of that fight. That one line removes the 50× spike. (b) 20 GW/EQ flat, as already decided. (c) Bypass wins pay real Equity, as already decided: drop the per-win rounding and floor, and raise `PAY_BASE[1]` so pay grows from the first fight. Target: Bypass farming at least matches the bank for a player who plays both roads. Re-run both sims and the guard. Conversion stays a top-up.

5. **Right side: lot skylines, the Back Office Plaza, consultants.**
   *Now:* each lot's skyline (`art/field.ts`, `SKYLINE`) is a few flat boxes and one text label. Only the office park has windows, and nothing is lit or alive, so it reads plainer than the storefronts. The Back Office **Plaza** block is a grid of identical dark cards: name and a "$" button. What each item does lives only in the hover, and bought items stay on the grid forever ("Bought"). Late game that is up to 6 consultants, 6 auto-renos, 3 landmarks, 3 blitzes and contracts.
   **What a consultant does, mechanically:** you hire one per lot, from that road's till, for 20 minutes of the road's **whole** rent (same price for every lot). It opens once the *next* lot is captured, pre-dawn included. Hiring does two things. (1) It counts as that lot's **patrol** (`autoCovers`): the crew climbs back up after 6 farmed wins, jumps to the new frontier after a clear, and (until overtime is cut) auto-buys overtime on a boss after two losses. (2) It unlocks a second purchase, **auto-renovation** (45 minutes of rent). After that, every 10 s, the road's single cheapest shop on any auto-reno lot is renovated if the till holds twice its price, fielded or benched. Consultants survive a pave; patrols don't. So today a consultant is a patrol that survives a pave, plus an optional auto-renovate button. "Keep the lights on" says none of that.
   *Conflict:* 15 Nov calls say consultants are **post-dawn**, per lot, and their job beyond patrols is auto-renovation, "so the two don't overlap." The code overlaps them.
   *Fix (decided, call 3):* make it **one purchase**: "*Lot* consultant: renovates this lot's shops for you whenever the till can cover it twice." Delete the hire step, the patrol effect (`autoCovers` checks patrols only), and the separate auto-reno card. Post-dawn only: hidden before dawn, and on a lot only once it is captured. Price stays in minutes of that road's rent; `tickSinks` keeps today's rule (cheapest shop on the lot, till at 2× its price). Consultants still persist through a pave. Plaza cards print their effect on the card. Bought one-time items leave the grid and show up as plaza furniture instead (landmarks already have sprites on the plaza title). Skylines: each lot gets one lit sign with a dead tube, plus one joke prop, built from the storefront sign and awning pieces so it matches the plaza. Keep the current gags (Circuit Barn's dead BARN, the aggressive fountain, COMING SOON).

6. **Title screen lease code.**
   *Now:* `Boot` always renders the full `SaveBox` (textarea, Copy, Load) in the menu, even on a first boot with no save. The game already autosaves to the browser; the code is only a backup or transfer. "Lease code" never says "save." How to Play still says the Back Office holds it (stale).
   *Fix:* delete the box from the menu. Add one small **Saves** button under How to Play that drops the same box down, with one line of copy: "Your save, as a lease code. Copy it to back up or move computers; paste one to load." The floppy popup uses the same line. Fix the How to Play row.

7. **Scoreboard W-L.**
   *Now:* the LED shows lifetime wins and losses for the road's crew since the last pave (`fmtWL`), e.g. 4,366 and 735 after 16h in the check-in sim, so it reads "4.3K-735." It only ever grows, and at that size it stops reading as a record.
   *Fix:* delete the lifetime cell. Show **this fight's win rate** over its last 20 fights ("86% WIN"). It never grows, and it's the number the farm choice needs. Lifetime totals move to the hover.

8. **Uncle's note hover.**
   *Now:* the note is the last thing in the plaza column, under every unit and the break room, often below the fold. Its hover ("Uncle's note — Taped to the register. Updated, somehow.") explains a note that explains itself. A few lines are stale ("Fifty bucks and the Parking Lot patrols itself.").
   *Fix:* delete the hover. Move the note to the top of the plaza, next to the plaza name. Fold its lines into the copy pass (C3).

9. **Route 9 North leftovers (all occurrences).**
   - `src/game/content/bypass.ts:37`: Bypass ending, "Route 9 North is still being surveyed."
   - `src/game/content/dawn.ts:20`: `hintDone`, "Somebody is surveying Route 9 North. Not yet."
   - `src/ui/Screens.tsx:258`: comment, "Nothing before it hints that there's a road north."
   - `src/ui/Screens.tsx:290`: the dawn card's **Drive north** button (it opens the Bypass; the label implies a north road).
   - `scripts/check.ts:334, 354`: "route 9 north" in the leak regexes. Keep these; they are the guard.
   - `docs/V10_PLAN.md` C2: "drive-north choice."
   *Fix:* rewrite the two lines as a plain ending. The button becomes the stranger/Bypass gate copy once that's decided. Leave the check regex.

10. **Overtime.**
   *Conflict:* already decided **cut entirely** (Bottleneck design, 15 Nov, which supersedes the earlier "undecided"). So buyable-and-stackable is moot.
   *Code still in:* `knobs.ts` (`OVERTIME_SECONDS`, `OVERTIME_FIGHTS`, `OVERTIME_BOOST`); `economy.ts` (`overtime`, `overtimeCost`, `overtimeFights`, the crew field); `sim.ts:32` (the auto-overtime on a patrolled boss after 2 losses); `battle.ts:85–87` (the boost); `state.ts:46, 76`; `ui/Calls.tsx` (the whole file is the button); `Field.tsx:205` ("OVERTIME" text); the How to Play row in `copy.ts`; the cash-till hover in `Pylon.tsx` ("…patrols, Overtime"); and on the prize shelf in `room.ts`, the Overtime coupon (`otCheap`), the Overtime punch card (`otLong`), and the Gold Watch claw toy (5 free overtime fights). Plus `bot.ts:119` and two checks in `check.ts`.
   *Fix:* delete all of it. Give the Gold Watch a different short boost from the Route 9 claw set, or drop it.

11. **Bypass unit count.**
   *Now:* confirmed. The Bypass has 4 lots and **16 units** (6 / 3 / 4 / 3). Route 9 has 6 lots and 21 units: 20 shops (6 / 2 / 4 / 4 / 4 / 0; Pinewood Commons has none) plus Plaza Management. The grid is either 7 or 3 per row (`plazaFit`), so 16 leaves a ragged row in both layouts. **18 fills 3-wide but not 7-wide** (7 + 7 + 4); only 21 fills both. The Bypass also has 56 fights to Route 9's 84 and is paced to take about twice as long.
   *Fix (decided, calls 2 and 5):* **9 lots, 21 units** (3 / 3 / 3 / 2 / 2 / 2 / 2 / 2 / 2). Rows of 3 and 7 fill off the road's total, so lots can hold different counts. The 4 existing lots and their bosses stay. 5 new lots are added, and the order follows the Bypass outward from the interchange: frontage road, office park, county seat, golf subdivision, mixed-use, a dying discount strip, the multiplex, and the Galleria last, so the Chairman stays the final boss (win condition 2). A new lot and boss lands about every 3h.

   **DRAFT, for Josh to review.** Walls use the four tells plus Crowd from `WALL_MAP.md` §2 (Thick, Hard hitter, Armored, Bruiser), and every counter is a unit you can own by then. Units are listed as *shop / hire [unlock fight]*; a unit's counter value carries into later lots. Times are check-in targets after dawn (*est.*), totalling about **27.5h**. Neither the Smoke Shop (was Vape Shop) nor the RadioShack-style electronics store (was the Cell Phone Kiosk) sits on the Bypass; both rename on Route 9 in the 1997 pass. Period flag: Exit 14's blurb says "Opened 1998" in a fall-1997 game. Make it "Opening 1998" or "Opened in May."

   | # | Lot | Fights | Units (3 / 3 / 3 / 2 …) | Boss · gimmick · joins as | Wall → counter | Skyline: lit sign · joke prop | Target (lot / total) |
   |---|---|---|---|---|---|---|---|
   | 1 | **Exit 14 Power Center** (existing) | 8 + boss | Self Storage / Auction Hunter [start] · Car Wash / Detailer [2] · The Off-Ramp / Bartender [4] | **Leasing Director** (existing): fourteen anchor tenants, no patience; joins as a heavy hitter | **Armored** regulars → the Auction Hunter you start with (slow, heavy). **Boss Bruiser** → Bartender up front | the green EXIT 14 highway sign, floodlit · a pallet of orange cones in the cart corral since opening day | 2h / 2h |
   | 2 | **Frontage Road** (new) | 9 + boss | Dojo (Exit 14) / Bouncer [1] · Urgent Care / Nurse [4] · Security Office (Bypass) / Watchman [boss] | **The Franchisee**: owns six of everything on this road and sends a manager to each fight; joins as control (enemies attack 10% slower) | **Hard hitters** (Motel Night Clerk, Tow Truck Driver, Billboard Installer) → Nurse + Bouncer. **Boss Thick** → Auction Hunter + Leasing Director, with the Watchman's mark arriving on capture | motel VACANCY sign, the NO tube dead · an "INJURED? CALL 1-800-…" lawyer billboard | 3h / 5h |
   | 3 | **Corporate Campus** (existing) | 10 + boss | Temp-Rite Staffing / Temp Worker [2] · Little Achievers Day Care / Day-Care Teacher [5] · Tax Prep / Tax Preparer [8] | **VP of Real Estate Strategy** (existing): circles back; joins as a buffer (crew +10% damage) | **Bruiser** (Shuttle Driver, Campus Security) → Temp Worker + Bouncer + Bartender, a two-tank front. **Boss Hard + Thick** → Tax Preparer weaken + Nurse + Day-Care Teacher | mirrored glass with a teal SYNERGEX logo, one letter out · geese on the aggressive fountain | 3h / 8h |
   | 4 | **County Center Drive** (new) | 10 + boss | Bail Bonds / Bondsman [2] · Payday Loans (Bypass) / Lawyer [6] | **County Commissioner**: votes on the zoning, votes on you, and his escorts are laminated; joins as control (enemies deal 10% less) | **Thick** (Zoning Clerk, Process Server, DMV Line Monitor: everything takes forever) → Lawyer + Watchman mark + Leasing Director. **Boss Armored** → Lawyer + Auction Hunter; bench any fast hitter | bank time-and-temperature sign stuck on 88° · a DMV line out the door and around the building | 3h / 11h |
   | 5 | **Fairway Pointe** (new) | 11 + boss | Golf Superstore / Golf Pro [3] · Pet Grooming (Bypass) / Groomer [7] | **The Club Treasurer**: audits your swing, then drives the cart through your front line; joins as a healer | **Hard hitters** (Golf Cart Ranger, Groundskeeper, Architectural Review Committee) → Nurse + Day-Care Teacher + Tax Preparer. **Boss Bruiser** → Bondsman + Temp Worker up front | FAIRWAY POINTE, HOMES FROM THE LOW $190s, lit · a golf ball through the sales-trailer window | 3h / 14h |
   | 6 | **Town Center, Phase II** (existing) | 11 + boss | Daily Grind Espresso / Barista [3] · Bridal Boutique / Wedding Planner [8] | **Managing Partner** (existing): has a boat; joins as a buffer (crew +15% HP) | **Crowd** (Construction Flagger, Brand Ambassador, Render Artist in numbers) → Golf Pro + Groomer + Barista + Detailer haste. **Boss Armored** → bench the fast build, go Lawyer + Wedding Planner | LIVE WORK PLAY banner with the PLAY tube dead · a cardboard family in the model unit's window | 3h / 17h |
   | 7 | **Bargain Square** (new) | 12 + boss | Party Supply (Bypass) / Party Clown [3] · Wash-n-Fold / Medic [8] | **The Liquidation Manager**: everything must go, including you, and he marks down your healer first; joins as a heavy hitter | **Thick** (Liquidation Crew, Clearance Shopper, Mall-Santa-in-July) → Lawyer + Golf Pro + Watchman mark + Planner. **Boss Hard hitter** → Medic + Nurse + Day-Care Teacher, a two-healer back line | EVERYTHING MUST GO banner, floodlit, on a dead VALU-MART ghost sign · shopping carts in the retention pond | 3h / 20h |
   | 8 | **Crossroads 16** (new) | 12 + boss | Cineplex / Usher [3] · Pretzel Stand / Pretzel Kid [8] | **The Megaplex GM**: opening night, so he brings the whole line as escorts; joins as a buffer (crew attacks 5% faster) | **Armored** (Ticket Taker, Popcorn Supervisor, Line Wrangler in laminated vests) → Lawyer + Auction Hunter + Usher mark. **Boss Crowd** (max escorts) → Golf Pro + Groomer + Barista haste + Clown confuse | chasing-bulb marquee, "NOW SHOWING: MEN IN BLAK" · a searchlight sweeping the sky | 3.5h / 23.5h |
   | 9 | **Bypass Galleria** (existing) | 14 + boss | Glamor Snaps Portraits / Photographer [4] · Disc Depot / Record Clerk [9] | **The Chairman** (existing): owns the mall and the chair; joins as a buffer (+10% pay per win) | **Rotating thirds** (Hard, Bruiser, Thick), as proposed for this lot → Photographer stun, Record Clerk speed, Pretzel-fed tank line, Usher mark. **Boss Thick with Bruiser escorts** | GALLERIA in tall letters, one always dead · a carousel horse behind the glass nobody is allowed to ride | 4h / 27.5h |

   **What this needs at build time:**
   - Content: 5 bosses, 15 regulars, 5 skylines and 5 boss sprites (Toad mockups first), plus the 5 new units from the table below.
   - Fight count: 97 regular fights + 9 bosses (106 total), up from 56. `FIGHT_GROWTH[1]`, `LOT_JUMP[1]` and the per-lot `patrol` prices need 9 entries.
   - Pay: `PAY_GROWTH[1]` has to be retuned with the Equity pay fix in item 4, or 1.09 over 106 fights runs away.
   - Balance: re-run both sims and the guard against the 27.5h target and ~3h per lot.
   - Wall map: `WALL_MAP.md` §4 and §5 now carry this layout.

   **The 5 new units (DRAFT).** Names are parodies of 1997 chains, never real brands. Walk-ins follow item 2's kinds.

   | Lot [fight] | Unit | Business | Hire (role) | Tagline | Walk-ins |
   |---|---|---|---|---|---|
   | Corporate Campus [2] | **Temp-Rite Staffing** | temp agency in the office-park strip | Temp Worker (tank): "Shows up. Stays all day. Nobody knows his last name." | "Here through Friday. Possibly forever." | G Needs a receptionist by Monday · R Data-entry temp, 90 wpm · T Free coffee mug |
   | Corporate Campus [5] | **Little Achievers Day Care** | corporate-park day care | Day-Care Teacher (heal): heals whoever is worst off, a little at a time, fast | "Pickup by 6. After 6, it's a dollar a minute." | G Late pickup, paid the fee · R Field-trip chaperone · T Lost-and-found mitten |
   | Town Center Phase II [3] | **Daily Grind Espresso** | the first espresso bar in the county | Barista (buffer): whole crew attacks a little faster | "Tall, grande, or a coffee." | R Triple-shot regular · G Book club of eight · T Punch card, tenth one free |
   | Bypass Galleria [4] | **Glamor Snaps Portraits** | mall glamour-portrait studio | Portrait Photographer (control): the flash, a chance an enemy loses its turn | "Soft focus. Hard sell." | G Family portrait, matching sweaters · R Wants the feather-boa shot · T Free 8×10 coupon |
   | Bypass Galleria [9] | **Disc Depot** | mall CD and tape store | Record Clerk (damage): quick, sharp hits | "Listening stations in back. Headphones mostly work." | R Wants the new Spice Girls CD · G Midnight release line · T Listening-station regular |

12. **Burnt-out unit signs.**
   *Now:* `deadTube(seed) = hash(seed, 7) < 0.6`, but the seed is `id.length × 7 + first char`, so ids collide. Result: **28 of 37 signs (76%) have one letter permanently dark** (Route 9 16/21, Bypass 12/16). Every 2–6 minutes one of them sputters, and 35% of those stay lit for 10–40 s. Bypass signs never sputter back (`candidates()` only reads Route 9 shops). Click-to-relight (A4) is **not built yet**, so it doesn't cover this today.
   *Fix:* seed from a hash of the full id, and drop the rate so about 1 in 4 signs is dark. A click relights a sign until its next burnout (A4). Include the Bypass. Once A4 ships, keep dead letters uncommon enough that the plaza reads clean and clicking feels like a find.

13. **The Plaza (cash sinks) is broken.** Found in code:
   - Crew contracts bought on the Bypass do **nothing**: the stat bonus only applies to Route 9 (`sinkStatMult` returns 1 for the Bypass), but the card is offered there.
   - Crew contracts were already **cut** (15 Nov) and are still sold.
   - Landmarks are one-time ("Bought"), but stacking was decided and the plaza title already counts copies (`×n`).
   - Consultants double as patrols and open pre-dawn (item 5).
   - Effects are only in hovers; the blitz text is vague ("A small, permanent bump…"). Bought cards never leave.
   - Prices are minutes of the road's **current** rent, so after a pave everything is cheap again.
   - Dead duplicate formulas: `sinkRentBonus`, `sinkStatBonus`, `blitzWalkin` and `landmarkHp` in `sinks.ts` are unused. The live math is `sinkRentMult` / `sinkStatMult` / `sinkHpBonus` in `economy.ts`, written a second time. Neither copy has a check in `scripts/check.ts`, and the bots never buy any of it, so nothing has tested it.

   *Fix:* delete contracts and the dead copies, keeping one set of formulas next to the purse. Then three sinks: consultant (item 5), stacking landmarks, and blitzes. Add one `check.ts` case per sink (buy it, the number moves on the right road). Visual: same card grid as the prize counter, effect printed on the card, bought items become plaza props. If "the gold sink shop" means Plaza Management instead: it works (40 EQ lease, $3B first renovation, +3% rent on both roads per level); it only needs the card fix from item 3.

14. **Final lots have no boss.**
   *Now:* all 10 lots have a boss, with sprites. Once a road is finished, its last boss is on your crew, so `topFight` caps the ladder at the fight before him. The last lot (Pinewood Commons, and Bypass Galleria) then stops at 18/18 or 16/16 with no boss. Every **earlier** captured boss stays re-fightable at 25× pay (item 4). Two rules for the same thing.
   *Fix (decided, call 1):* one rule for all 10. Once a road is finished, `topFight` stops capping at the fight before the last boss, so the Developer and the Chairman can be rematched like every other boss. Every rematch pays a regular win; only the first capture pays 25×. Also delete the "keeping the lights on" label on the last fight (`Lot.tsx:63`).

15. **Farm-rate info button.**
   *Now:* the only rate shown is the top bar's live 5-second window. Josh's read is right; the probe on the last lot: fight 8/18 1.49K GW/min, 14/18 927, 16/18 974, **17/18 381** (10 W, 11 L), 18/18 1.01K. Bypass: Exit 14 fight 1 **23 EQ/min**, fight 6 3.7, fight 8 1.1. Today the highest fight is often the worst farm.
   *Fix:* a small toggle in the sky of the lot canvas, top left (under ◂), saved locally. It shows **measured** GW/min (EQ/min on the Bypass) for the fight you're on. For each fight index, keep a running total of pay earned and seconds spent, from battle start through any smoke break until the next battle starts, losses included at 0 pay, over the last ~10 cycles. Fights you haven't run show "—", not an estimate. No sim, no guessing, and it already counts losses and smoke breaks. Per minute, not per second, so the numbers stay readable. This pairs with item 7's win-rate cell.

16. **Does a patrol stop you farming lower fights?**
   *Now:* yes. A patrol is a cash contract per lot ($50, $40K, $100K, $250K, $4M, $15M on Route 9; $500 to $2M on the Bypass), lost on a pave. A consultant counts as one too. On a patrolled lot, after **6 farmed wins** below the frontier (`RETRY_AFTER`), the crew climbs one fight by itself (`sim.ts:79`), and after a clear it jumps to the new frontier (`sim.ts:109`). So if you press ◂ to park on an easier fight, the patrol walks you back up in about 6 wins, every time. A fresh loss at the frontier drops back one fight **with or without** a patrol (`sim.ts:55`).
   *Conflict:* the 15 Nov call was: patrols cost **Goodwill**; **without** a patrol a lost wall keeps fighting and never drops back; **with** one, a loss drops to the highest fight you can win. The code does neither: patrols cost cash, and both cases drop back. This is not the "keep the lights on" consultant buff; consultants are item 5.
   *Fix:* patrols in Goodwill, the drop-back only with a patrol (as decided), and **◂ parks the crew** (decided, call 4): stepping down by hand pauses the patrol's climb until you press ▸ or a new fight is cleared. That's one flag on the crew, set by `advance(-1)` and cleared by `advance(+1)` or `clearFight`. While it's set, `sim.ts:79` doesn't climb and `sim.ts:109` doesn't jump. The ▸ hover says the patrol is paused. It pairs with the farm-rate button.
