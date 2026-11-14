# Strip Mall Warlord

An idle tycoon about a dying 1990s strip mall on Route 9. Storefronts pay rent and each one sends a person to the crew, and the crew fights its own way across six parking lots. Then comes the Bypass. The Fun Zone arcade and the Off-Ramp bar are playable rooms of big pixel cabinets. Current design: [docs/V06_DESIGN.md](docs/V06_DESIGN.md). Also see [DESIGN.md](DESIGN.md), [docs/CORE_LOOP.md](docs/CORE_LOOP.md), [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) and [docs/REVISION.md](docs/REVISION.md). All art is generated pixel art in `src/art/`.

Stack: TypeScript (strict) + Preact + Vite. The simulation in `src/game` is DOM-free (`step()` / `simulateAway()`), the UI is in `src/ui`, and saves go to localStorage (a save from an older version resets, with a notice on the title screen).

```sh
npm ci
npm run dev            # play
npm run build          # tsc --noEmit + vite build
bun scripts/check.ts   # invariant checks
bun scripts/balance.ts 50 1991 [--active --every=10] [--room] [--idle] [--pave=H] [--convert=0.5] [--quiet]
bun scripts/spritesheet.ts   # docs/spritesheet.png: every sprite + the palette
```

Debug URL params: `?fresh=1`, `?speed=20`, `?seed=1991`, `?advance=300` (bot plays 300s first, `&active=1` to play actively), `?midbattle=1`, `?roster=full` (Route 9 done, 25 battlers), `?win=1` (the dawn card), `?region=1` (the Bypass), `?away=3600`, `?oldsave=1`, `?pause=1`, `?screen=boot|howto|story|game|room`, `?room=full` (every arcade machine; with `roster=full&region=1` the bar), `?story=all`, `?walkin=1`.

Audio is synthesized with WebAudio in `src/ui/audio.ts` (no sound files). It starts after the first click or key press; mute is saved in localStorage.

## GitHub Pages
`.github/workflows/deploy.yml` builds `main` at the site root, and every `v*` tag under `/vX.Y/` (each with its own save). Pushing a tag re-runs the deploy on `main` (the `github-pages` environment only accepts `main`), which rebuilds every tagged version. Local equivalent: `npm run build:pages`.

## Screenshots
`npm run build && npx vite preview &` then `node scripts/screenshots.mjs`, which needs `npx playwright install chromium` once. Output goes to `screenshots/v6/` (`OUT=` to change), and older versions are in `screenshots/`.

Live: https://sp-cem-n.github.io/strip-mall-warlord/ (older builds: `/v0.1/` … `/v0.6/`)
