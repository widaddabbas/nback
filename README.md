# N–Back

A highly configurable browser-based n-back task designed to live at **https://widaddabbas.github.io/nback/**.

The visual design deliberately follows the palette and typography of `widaddabbas.github.io`, while the homepage-only sparkle cursor is **not** included.

## What is implemented

- Spatial, auditory, colour, shape and number stimulus streams.
- Any combination of streams at the same time.
- Independent n-level for every stream (for example spatial 4-back + audio 2-back + colour 3-back).
- Independent target, n−1 lure and n+1 lure probabilities.
- Remappable keyboard responses plus on-screen/touch controls.
- Arbitrary spatial grids from 2×2 to 8×8, optional centre exclusion and subtle guides.
- Spoken-token or pure-tone auditory tasks.
- Custom spoken token, tone-frequency, colour, shape and number/symbol pools.
- Adjustable stimulus time, blank interval and response window.
- Reproducible seeded sequences.
- Built-in presets plus locally saved custom presets.
- Import/export of configurations as JSON.
- Session results: hits, misses, false alarms, correct rejections, accuracy, precision, sensitivity, specificity, d′, mean/median/90th-percentile hit RT.
- Local browser history, n-level trend plot, summary CSV export and full raw JSON export.
- Each completed session stores its generated seed and actual trial sequence for reproducibility.
- Optional between-session adaptive n-levels.
- Responsive desktop/mobile layout and reduced-motion support.
- No server, account, database, analytics or tracking required.
- Automated tests and GitHub Pages deployment through GitHub Actions.

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Test and build

```bash
npm test
npm run build
```

The production build appears in `dist/`.

## Publish on GitHub Pages

1. Create a **public** repository named `nback` under the `widaddabbas` GitHub account.
2. Put the contents of this repository at its root and push to `main`.
3. On GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions** as the source.
5. The included `.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`.
6. The configured Vite base path is `/nback/`, so the intended URL is:
   `https://widaddabbas.github.io/nback/`

If the repository is given a different name, change `base: '/nback/'` in `vite.config.ts` to match it.

## Link it from the main homepage

A simple link in `widaddabbas.github.io` is enough:

```html
<a class="but" href="https://widaddabbas.github.io/nback/">N-Back</a>
```

The two codebases remain completely independent.

## Intended use

This is a configurable training/experiment interface, not a diagnostic or validated clinical assessment. If results are used for research, the task parameters, browser/device conditions and scoring choices should be documented explicitly.

## Data and privacy

Settings, custom presets and session history use browser `localStorage`. Nothing leaves the device unless the user explicitly exports a JSON/CSV file. Clearing site data clears stored n-back data.

## Scoring note

For each modality, d′ is computed from hit and false-alarm rates. A log-linear correction is used:

- hit rate = `(hits + 0.5) / (targets + 1)`
- false-alarm rate = `(false alarms + 0.5) / (non-targets + 1)`

This keeps d′ finite when a session has a perfect hit rate or zero false alarms.

## Architecture

```text
src/
├── components/    React interface and task screens
├── engine/        Sequence generation, audio, scoring, adaptation
├── storage/       Local history and presets
├── styles/        Homepage-matched visual system
├── utils/         JSON/CSV export helpers
├── defaults.ts    Built-in configurations
├── types.ts       Core data model
└── App.tsx        Application flow
```

The engine is UI-independent enough that additional modalities or alternative adaptive rules can be added without rewriting the core task.

## Deliberate visual choice

The main personal homepage's cursor sparkle is intentionally absent here. During an n-back task, cursor particles would add an uncontrolled visual stimulus and could interfere with the spatial task.
