# fast-grc

A real GRC app, shipped fast and safely with AI: deterministic guardrails around a non-deterministic tool.

> Early days. Right now this is a hello-world NestJS app with health and version endpoints. It grows one small, deployable step at a time.

## Run locally

Requires Node 24 (`.nvmrc`).

```bash
npm install
npm run dev
```

- http://localhost:3000/health — liveness
- http://localhost:3000/version — what's running and who built it

## Build

```bash
npm run build
npm start
```

Every build stamps `build-info.json`: local builds are `local-<user>-<timestamp>+<commit>` (flagged `dirty` if there are uncommitted changes); CI builds are `<run number>+<commit>`.
