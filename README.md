# Genius Academy

Adaptive Year 4 KS2 learning adventure with a pannable 2D academy world, 10-question mission loops, KS2 Coin rewards, parent progress views and an optional AI tutor.

## Architecture

- Static HTML/CSS/JavaScript application built into `dist/` for Vercel.
- Learner progress/preferences are stored client-side in browser storage; there is no repository-owned learner database or account system.
- `/api/tutor` is the only current server-side capability. It is optional and fails closed when the provider is unavailable.
- The tutor does not send the learner display name to the provider; see `docs/PRIVACY_ENGINEERING.md`.
- Android is a thin wrapper for the deployed web experience and disables Android backup of learner state.

## Local verification

Requires Node 22.

```sh
npm ci
npm run check
```

`npm run check` performs zero-dependency production-safety checks, AI-tutor regression tests and the exact Vercel static build.

## Production verification

Release evidence is defined in:

- `docs/PRODUCTION_ACCEPTANCE.md`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/PRIVACY_ENGINEERING.md`

A successful preview build is useful evidence but is not, by itself, production acceptance. Child-data/privacy review, deployed learning-loop acceptance, Android physical-device testing and rollback evidence remain separate gates.

## Current production world

The main world uses the full-resolution `assets/genius-academy-reference-map.png` artwork as the rendered map surface. `world2d.js` layers player movement, camera panning, building hit-zones and subject entry on top.

The Vercel build copies the complete `assets/` directory into `dist/assets/`.
