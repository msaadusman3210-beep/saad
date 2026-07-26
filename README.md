# Press Shop Production Manager — React + Node rebuild

A real client/server version of the press shop production tool: a Node/Express
API backed by SQLite, and a React (Vite) frontend. Every daily entry, part,
process, and machine lives in an actual database file on disk, not in browser
storage.

## What's included in this build

- JWT-based login with bcrypt-hashed PINs (a genuine auth system, not the
  shared-storage PIN check from the earlier prototype)
- Parts + their process sequence (each part gets Blanking → Piercing → Bending
  by default, in order, with per-step cycle time and machine assignment)
- Machines master list
- Daily production entries
- Monthly production plan (day-by-day quantity per part)
- Dashboard: plan vs actual, achievement %, total WIP, per part
- WIP Report: the same stage-to-stage pending-inventory funnel as before,
  now computed server-side from real rows in SQLite

## What's *not* in this build yet

Sheet Issues, Department Stock/Transfers, Search, Settings/CSV export, and a
Users management screen didn't make it into this pass — the goal here was a
solid, verified core (auth + parts/processes + entries + plan + dashboard +
WIP) rather than a half-tested copy of every feature. Happy to port the rest
over next now that the foundation is in place.

## How this was tested

I don't have internet access in the environment I built this in, so I
could not run `npm install` here — meaning I never booted the actual
Express server or Vite dev server end-to-end before handing this to you.
What I *did* verify directly:

- Every backend `.js` file passes `node --check` (valid syntax)
- The core business logic (WIP calculation, plan-vs-actual aggregation) is
  in its own dependency-free module (`server/src/lib/calc.js`) and I ran
  real unit tests against it with plain Node — the math is confirmed correct
- Every React component was actually rendered (server-side, with React
  itself) to catch real JSX/logic errors, not just syntax-checked

What I could **not** test: the live HTTP round-trip between client and
server, SQLite file creation via `better-sqlite3`, or the Vite dev server
itself. Those depend on packages I can't download here. If something
doesn't start cleanly on your machine, tell me the exact error and I'll fix
it — treat this as a strong first draft that needs one real run-through on
your end.

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # edit JWT_SECRET to something random
npm run seed               # creates data/press_shop.db with dummy data
npm run dev                # starts the API on http://localhost:4000
```

The seed script creates:
- One admin login: **Admin** / PIN **1234**
- 10 press machines
- 12 dummy parts, each with the standard **Blanking → Piercing → Bending**
  sequence (in that order), reasonable dummy cycle times, and a machine
  assigned to each step
- A flat daily plan for the current month per part
- 5 days of dummy actual production entries per part, across all three
  processes, so the Dashboard and WIP Report aren't empty on first look

Re-running `npm run seed` wipes and rebuilds all the dummy data — don't run
it again once you've entered real data.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). It proxies
`/api/*` requests to the backend on port 4000 automatically in dev mode.

### 3. Sign in

Use **Admin / 1234**, or tap "Create an account" on the login screen to add
yourself.

## Project layout

```
server/
  src/
    index.js          Express app entry point
    db.js             SQLite connection + schema
    seed.js           Dummy data generator
    lib/calc.js        Pure WIP / plan-vs-actual math (unit-tested)
    middleware/auth.js JWT verification
    routes/            auth, parts, machines, entries, plans, dashboard
client/
  src/
    main.jsx, App.jsx
    api.js             Fetch wrapper for the backend
    components/        Sidebar, Login
    pages/              Dashboard, Parts, DailyEntry, Machines, WipReport
    styles.css
```

## Known limitations, plainly stated

- **No refresh-token / "remember me" flow** — the JWT lives in
  `localStorage` and expires after 12 hours; there's no `/auth/me` endpoint
  yet, so a page reload always re-shows the login screen even with a valid
  token still sitting in storage (harmless, just means you sign in again).
- **No role-gated UI yet** on this pass — every signed-in user sees every
  screen; the backend has an `adminOnly` middleware ready to use (currently
  applied to the users list) but the other admin-only actions from the
  original tool (like a data wipe) aren't rebuilt here.
- **SQLite, not Postgres/MySQL** — genuinely fine for one shop's worth of
  data and one server process, but if you ever need multiple app servers
  writing to the same database concurrently at scale, you'd want to swap in
  a real client/server database.
- **No deployment config** — this runs on `localhost`. Putting it on a real
  server (a VPS, Render, Railway, etc.) with HTTPS is a separate step I can
  help with once you've confirmed it runs locally.
