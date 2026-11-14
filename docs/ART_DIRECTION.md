# Art direction: "Sodium Night"

**Mood:** 1997, about 10:40 pm, a strip mall that peaked in 1991. One working lamp post, faded stall lines, signs with one tube burnt out. Dry, specific, a little sad, never cartoonish. Nothing is shiny except the neon and the walk-ins.

## Palette: 23 colors + transparent (`src/art/palette.ts`)
| # | name | hex | use |
|---|---|---|---|
| 1 | ink | `#1a1420` | outlines, deepest shadow |
| 2 | night | `#24222b` | sky, glass, UI background |
| 3 | asphalt | `#3a3941` | lot surface |
| 4 | concrete | `#5f5c66` | sidewalks, poles, UI frames |
| 5 | stone | `#8f8a86` | trim, faded paint, dim text |
| 6 | bone | `#cfc6b0` | stucco, body text |
| 7 | paper | `#f2ecdc` | highlights, hit flash, signage |
| 8 | sodium | `#e39a3b` | lamp light, UI accent |
| 9 | sodiumLight | `#f6d27a` | lamp bulb, walk-ins, gold |
| 10 | brick | `#7d3528` | fake brick, red shade |
| 11 | red | `#c4553f` | Bouncers, Dojo, damage |
| 12 | navy | `#2c3858` | uniforms, blue shade |
| 13 | blue | `#4d73a6` | Medics, Laundromat, rent-a-cops |
| 14 | teal | `#367470` | code enforcement |
| 15 | mint | `#6fb3a2` | outlet trim, cans, glints |
| 16 | forest | `#3c5a34` | Payday sign, trees |
| 17 | green | `#6a9150` | Lawyers, HP bars |
| 18 | plum | `#4f3a6b` | Vape sign, violet shade |
| 19 | violet | `#8261a8` | Hustlers |
| 20 | skin | `#e2a77f` | |
| 21 | tan | `#a8694a` | skin shade, warm light pool |
| 22 | umber | `#5a3a28` | leather, wood, sodium pool dither |
| 23 | neon | `#e0588c` | OPEN signs, vape neon |

**Crew identity colors are fixed everywhere** (sprites, badges, buttons): Bouncer red, Hustler violet, Medic blue, Fixer sodium, Lawyer green.

## Grids and scale
- People: **16×24** cells, drawn facing right, enemies mirrored. Bosses use the same cell drawn at 2×.
- Storefront facades: **64×56** (parapet, sign band, awning, window + door, sidewalk), shown at 2×.
- Battlefield: **320×150** logical, shown at 2×. One per lot, with that lot's building on the horizon.
- Font: a 3×5 pixel font for everything drawn into sprites (signs, damage numbers). UI text uses VT323, headers Pixelify Sans (both OFL).
- Integer scaling only, `image-rendering: pixelated`, no smoothing.

## Rules
1. **Outline:** every character and object gets a 1px `ink` outline (auto-generated). Scenes use `boxed` frames instead.
2. **Light:** a single source, the sodium lamp, upper left. Shading is one step down the color's ramp on the right edge. No gradients: falloff is 50% or 25% checker dither (the light pool on the asphalt).
3. **Decay:** one sign letter is always dimmer, stucco gets grime pixels, vacant units are whitewashed with a FOR LEASE card and the ghost of "VIDEO".
4. **Materials say where a building came from:** home = tan stucco; Parking Lot capture = video-store navy and yellow; Big-Box = beige panel with red trim; Outlet = white stucco with mint; Lifestyle = fake brick.
5. **Motion is tiny and readable:** 0.6px idle bob, a 3px lunge on attack, knockback plus a 1-frame paper silhouette on hit, a rising damage number (yellow = weak hit, grey = resisted, "C&D" for a Lawyer landing one), and downed units lie flat at 45% opacity.

## The page around the game (v0.4)
The page uses the same palette and the same frame rules; there are no default HTML boxes. Every frame is a generated sprite installed as a CSS `border-image` at 2×.
- **Top bar = the roadside pylon sign.** A cabinet with the title, then three stacked tenant panels (cash on paper, Heat on red, asphalt on navy), on two concrete legs in the grass by Rt. 9. W/L, clock and lots are on a rented red **LED board** with an unlit-dot background. The speaker toggle sits next to it.
- **Plaza = painted cinderblock** behind the strip, with an aluminum cap.
- **Lot = storefront glass:** an aluminum mullion frame with one bright glint pixel in the corner.
- **Log = the receipt printer:** a plastic printer head with a green status light, and a paper tape with a torn edge. Losses print in red ink, like a real two-color printer.
- **Title, how-to, story and dialogs = brick** frames. **Hover cards, notes and walk-ins = price tags** (paper, ink outline). The **sample book** is a navy binder with paper pages.
- Zone cards are bolted lot signs: grey for future lots, sodium for the current one, green once captured.

## No real brands
Parody names only: Circuit **Barn** (with the second word's tubes out), Foodway, Pine Creek Outlets, The Promenade. Walk-in items are generic ("a 4-Cell Flashlight", "a Chirp Phone").

## Where it lives
`src/art/` (palette, grid, font, people, scenes; scenes also holds the title scene, scaffolding, sign samples, page frames and tiles) is pure data and code shared by the game and `scripts/spritesheet.ts`, which writes `docs/spritesheet.png`. Nothing is hand-painted, so every sprite stays on-palette.
