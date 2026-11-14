# Strip Mall Warlord

An idle tycoon about a dying 1990s strip mall. Shops earn money and train a crew, and the crew fights its own way across the parking lot. Prototype. See [DESIGN.md](DESIGN.md).

Stack: TypeScript (strict) + Preact + Vite. The simulation in `src/game` is DOM-free (`step()` / `tick()` / `simulateAway()`), the UI is in `src/ui`, and saves go to localStorage (a corrupt save falls back to a new game).

```sh
npm ci
npm run dev            # play
npm run build          # tsc --noEmit + vite build
bun scripts/check.ts   # invariant checks
bun scripts/balance.ts 60 1991 --every=10 [--prestige] [--no-payday]
```

Debug URL params: `?fresh=1`, `?speed=20`, `?seed=1991`, `?advance=300` (bot plays 300s first), `?bot=1`, `?midbattle=1`, `?away=3600`, `?pause=1`.

## GitHub Pages
`.github/workflows/deploy.yml` builds on push to `main` with `BASE_PATH=/<repo>/` and deploys `dist/` to Pages. In the repo, set Settings → Pages → Source to **GitHub Actions**. Local equivalent: `npm run build:pages`.

## Screenshots
`npm run build && npx vite preview &` then `npm run screenshots` (needs `npx playwright install chromium` once). Output goes to `screenshots/`.
