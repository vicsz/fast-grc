# fast-grc

A real GRC app, shipped fast and safely with AI: deterministic guardrails around a non-deterministic tool.

> Early days. A NestJS API and a React page, one deployable, growing one small step at a time.

**Stack:** TypeScript everywhere · NestJS · React (Vite) · Azure App Service · Bicep · GitHub Actions

## Run locally

Requires Node 24 (`.nvmrc`).

```bash
npm install
npm run dev     # API on :3000 and the React app on http://localhost:5173
```

- `/health` — liveness
- `/version` — what's running and who built it (also shown in the page footer)

## Check

```bash
npm run check   # type check, lint, format, tests — the same gate CI runs
```

## Build

```bash
npm run build   # API into dist/, React into dist/web (served by the API)
npm start
```

## Versioning

Every build stamps `build-info.json`, served at `/version`. Versions are semver, with major.minor from `package.json`:

| Built by    | Version                                              | Example                                     |
| ----------- | ---------------------------------------------------- | ------------------------------------------- |
| CI          | `<major>.<minor>.<run number>+<commit>`              | `0.1.42+a1b2c3d`                            |
| A developer | `<major>.<minor>.0-local.<user>.<UTC time>+<commit>` | `0.1.0-local.victor.20261028T1530Z+a1b2c3d` |

Local builds are pre-releases, so they sort below CI builds, and they are flagged `dirty` if built with uncommitted changes. `npm run package` produces the deployable `out/fast-grc-<version>.zip`.

## Deploy to Azure

Requires the Azure CLI, logged in (`az login`). No containers, no Kubernetes: a prebuilt zip on App Service.

```bash
npm run deploy -- dev   # package, provision (Bicep), deploy, wait until /version shows this build
npm run deploy -- dev out/fast-grc-<version>.zip   # deploy an existing artifact
npm run destroy         # delete the resource group and everything in it
```

Defaults: resource group `fast-grc-rg` in `canadacentral`; app `fast-grc-<env>` on a shared Free (F1) plan in `canadaeast` (where this subscription has F1 quota). Override with `FAST_GRC_RG`, `FAST_GRC_LOCATION`, `FAST_GRC_APP_PREFIX`. Local deploys target `dev` only.
