---
name: run-supportgg
description: Build, run, and drive SupportGG (the League of Legends support-stats web app in this repo). Use when asked to start the app, run its tests, build it, take a screenshot of its UI, or interact with the running app (search a player, expand a match, open the minimap).
---

SupportGG is a Vite + React SPA (`diff/src`) with Vercel serverless
functions (`diff/api`) that call the Riot Games API. Drive it by
starting the dev server and piping commands to
`.claude/skills/run-supportgg/driver.mjs`, a small chromium-cli-style
Playwright REPL (chromium-cli itself isn't installed in this
container; the driver is the fallback the parent `/run` skill
recommends for that case).

All paths below are relative to `diff/` (the repo root only contains
`diff/` plus git/CI config — `diff/` is the actual app).

## Prerequisites

Playwright's Chromium needs these system libs on a bare Ubuntu
container (already present here; this is what got them there):

```bash
npx playwright install chromium
sudo npx playwright install-deps chromium
```

Node 20+, npm — already on PATH in this container.

## Setup

```bash
npm ci
```

No `.env` is required to view real data — see Run below, this is the
whole point of the recommended launch path.

(If you want the API routes to run *locally*, e.g. to test a backend
change, that's a separate, heavier path: `npx vercel link`, then
`npx vercel env pull .env.local` to get a real `RIOT_API_KEY`, then run
`npx vercel dev` instead of `vite`. Not needed just to view the app.)

## Build

```bash
npm run build
```

## Run (agent path)

```bash
npm run dev
```

Vite picks its own port (5173 unless it's busy). No `--port` pinning
needed — `src/services/riotClient.js` builds relative `/api/...` URLs,
which ride `vite.config.js`'s dev proxy to production on whatever port
Vite chose. **Unless a `.env.local` sets `VITE_API_URL`** — see
Gotchas; if one exists on this machine, add `-- --port 3000` instead.

Then drive it (adjust the port in `nav` to whatever `npm run dev`
printed):

```bash
cat <<'EOF' | node .claude/skills/run-supportgg/driver.mjs
nav http://localhost:5173/
wait-for text=Buscar Jugador
screenshot home
fill "placeholder=Ej: Faker" "Hide on bush"
fill "placeholder=Ej: KR1" "KR1"
select select asia
click "role=button:Buscar Jugador"
wait-for text=Historial de Partidas
screenshot player
click "role=button:Ver detalles de la partida"
wait-for text=Comparación de Supports
screenshot match-expanded
click "role=button:Minimapa"
wait-for "role=img:Minimapa de la partida en el instante 0:00"
sleep 1000
screenshot minimap
console errors
EOF
```

`Hide on bush` / `KR1` / region `asia` is a real, currently-active Riot
account confirmed to work against production — good for a repeatable
smoke test with real data.

Screenshots land in `.claude/skills/run-supportgg/screenshots/<name>.png`
(created on first run). `console errors` prints anything captured via
`console.error`/`pageerror` so far as a JSON array — `[]` means clean.

Command reference (see the driver's header comment for full detail):

| command | does |
|---|---|
| `nav <url>` | goto |
| `wait-for <target>` | wait until visible, 30s timeout |
| `click <target>` | click |
| `fill <target> <text>` | fill an input — **quote both args if either has a space** |
| `select <target> <value>` | `selectOption` on a `<select>` |
| `press <key>` | keyboard press |
| `screenshot [name]` | full-page PNG |
| `console errors` | dump collected console/page errors |
| `sleep <ms>` | only for animations/canvas redraws; prefer `wait-for` |

`<target>`: `text=<exact>`, `role=<role>:<exact accessible name>`,
`placeholder=<exact>`, or a raw CSS selector — all matched with
`exact: true`, so `text=Comparación de Supports` never accidentally
also matches a longer string containing it.

## Run (human path)

```bash
npm run dev
```

Open the printed `http://localhost:<port>/` in a browser. Ctrl-C to stop.

## Test

```bash
npm run test        # Vitest — 183 tests
npm run test:e2e    # Playwright — 10 specs, builds+previews the app itself
npm run lint
npm run ci           # all of the above, in the order CI runs them
```

All four pass clean as of this writing.

## Gotchas

- **If a `.env.local` exists** (from a prior `vercel env pull` — gitignored,
  so it won't exist on a fresh clone, but may on a machine that's been
  used for backend work) **it sets `VITE_API_URL=https://trashh.vercel.app`,
  which overrides the relative-URL default and makes the app fetch prod
  directly, cross-origin — and port 3000 becomes load-bearing again.**
  With `VITE_API_URL` set, the browser fetches the production URL
  directly instead of riding Vite's `/api` proxy. Production's
  `diff/vercel.json` sets a static `Access-Control-Allow-Origin:
  "http://localhost:3000 https://trashh.vercel.app"` header on every
  `/api/*` response — a single string with two space-separated origins,
  which is invalid CORS syntax (only one value or `*` is legal), and
  browsers correctly reject it. The *only* origin that avoids hitting
  that literal broken header is `http://localhost:3000`:
  `api/utils/api.js`'s `setCorsHeaders` recognizes that origin
  specifically and overwrites the header with a single valid value
  before the response goes out; every other origin falls through to
  the broken static one. Verified directly against prod:
  `curl -H "Origin: http://localhost:3000" ...` → one valid origin
  back; `curl -H "Origin: http://localhost:5173" ...` → the literal
  broken two-value string back. **Fix: run `npm run dev -- --port
  3000`** if `.env.local` is present, or just delete/comment out
  `VITE_API_URL` from it to get the simpler no-port-pinning path back.
  (`diff/vercel.json`'s header itself is a separate, still-open bug —
  out of scope here, not touched.)

- **`src/services/riotClient.js` used to hardcode a
  `'http://localhost:3000'` fallback** when `VITE_API_URL` was unset —
  broke every request on Vite's real default port (5173) with no
  visible error, just `ERR_CONNECTION_REFUSED` in the console. Fixed:
  the fallback is now `''` (relative URLs), which rides the dev proxy
  on any port and needs no env var in prod either (frontend + `/api`
  share an origin there). Mentioned here only because the `.env.local`
  gotcha above is the one remaining way to reintroduce the same class
  of failure.

- **jsdom / this driver won't render `<canvas>` content** — irrelevant
  here since the driver drives a real headless Chromium (not jsdom),
  but if you're instead looking at this app's own Vitest component
  tests for the minimap's heatmap canvas, they intentionally only
  assert "renders without throwing," not pixel content.

- **`fill`/`select` targets containing a space must be quoted** in the
  heredoc (`"placeholder=Ej: Faker"`, not `placeholder=Ej: Faker`) — the
  driver's tokenizer splits unquoted text on whitespace, so an unquoted
  placeholder gets truncated at its first space and the rest of the
  string leaks into the value argument. Single-target commands (`nav`,
  `click`, `wait-for`) reassemble a trailing multi-word target back
  into one string automatically, so they don't need quoting — only
  `fill`/`select`, which take two separate arguments, do.

## Troubleshooting

- **`ERR_CONNECTION_REFUSED` on every `/api/*` call, UI stuck on the
  search form** → a `.env.local` is setting `VITE_API_URL`, and Vite
  isn't on port 3000. Restart with `npm run dev -- --port 3000`, or
  remove `VITE_API_URL` from `.env.local`.
- **Browser console shows `Access-Control-Allow-Origin header contains
  multiple values`** → same cause, same fix (port 3000). This is what
  the failure looks like specifically when `.env.local` is present and
  pointing `VITE_API_URL` at production.
- **`driver.mjs` hangs with no output** → check `wait-for`'s target text
  actually appears verbatim (it's matched `exact: true`); a role name
  or button label that's off by a word (including trailing punctuation)
  will just time out silently for 30s per step.
- **Playwright launch fails with a missing `.so` error** → the
  `sudo npx playwright install-deps chromium` step under Prerequisites
  wasn't run on this machine yet.
