# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run start      # Run the compiled server
npm run dev        # Development mode: watch TypeScript + auto-restart server
npm test           # Run API integration tests (Mocha + Supertest, in-memory SQLite)

cd frontend && npm run build   # Build React frontend (webpack)
cd frontend && npm run dev     # Frontend dev server on :3000 (proxies /api to :4321)
```

## Deploy

```bash
bash deploy/deploy.sh
```

Builds both backend and frontend locally, rsyncs to `podlomar@daily.podlomar.me`, runs `npm install --omit=dev` remotely, then restarts the `daily` systemd service via `sudo systemctl restart daily`.

To migrate the production database:
```bash
ssh podlomar@daily.podlomar.me "sqlite3 /var/www/daily.podlomar.me/data/db.sqlite < /dev/stdin" < migrations/<file>.sql
```

## Architecture Overview

This is a personal fitness tracking app with an Express 5 + TypeScript REST API backend and a React frontend. It uses SQLite (better-sqlite3) for data persistence.

### Core Concepts

- **Daily Entries**: Central entity tracking daily fitness data including running, workouts, weight, meals, stretching, stairs, and diary notes
- **Running Tracks**: Reference data for running routes with distance, progress unit (km, flight, pole), and `last_used` date (updated on each entry creation; used to sort tracks by recency)
- **Workout Results**: Individual exercise results linked to daily entries with exercise name, execution type, and volume
- **Schedules**: Activities are classified as `regular`, `adhoc`, `legacy`, or `void`

### File Structure — Backend

- [src/index.ts](src/index.ts) - Express server with REST endpoints, YAML/JSON body parsing middleware
- [src/openapi.ts](src/openapi.ts) - OpenAPI 3.1 spec generated from Zod schemas via `zod-openapi`
- [src/db/schema.ts](src/db/schema.ts) - Shared Zod schemas (Schedule, Links, ErrorResponse)
- [src/db/tracks.ts](src/db/tracks.ts) - Track CRUD operations and Zod schemas (ZTrack, ZRunning)
- [src/db/entries.ts](src/db/entries.ts) - Daily entry CRUD operations and Zod schemas (ZDailyEntry, ZDailyEntryInput, etc.)
- [src/db/workouts.ts](src/db/workouts.ts) - Workout operations, validation, and Zod schemas (ZWorkoutResult, ZWorkout)
- [src/db/stats.ts](src/db/stats.ts) - Running streak analytics and ZStats schema
- [src/db/connection.ts](src/db/connection.ts) - SQLite database initialization (configurable via `DB_PATH` env var)
- [src/db/index.ts](src/db/index.ts) - Re-exports from all db modules
- [src/parsers/daily-entry.ts](src/parsers/daily-entry.ts) - YAML/JSON input parsing for daily entries
- [src/food/meals.ts](src/food/meals.ts) - Meal calorie computation from ingredient JSON data
- [data/](data/) - JSON data files for ingredients/meals; `db.sqlite` lives here in production
- [data/schema.sql](data/schema.sql) - Database schema definition
- [migrations/](migrations/) - SQL migration scripts (run manually against production DB)
- [test/](test/) - Mocha + Supertest API integration tests

### File Structure — Frontend

- [frontend/src/App.tsx](frontend/src/App.tsx) - React Router routes
- [frontend/src/api.ts](frontend/src/api.ts) - Typed API client (fetch wrappers)
- [frontend/src/types.ts](frontend/src/types.ts) - Shared TypeScript types mirroring backend schemas
- [frontend/src/pages/HomePage/](frontend/src/pages/HomePage/) - Quick running entry form; last-meal one-click button
- [frontend/src/pages/DashboardPage/](frontend/src/pages/DashboardPage/) - Entry history list
- [frontend/src/pages/EntryPage/](frontend/src/pages/EntryPage/) - Single entry detail with prev/next nav
- [frontend/src/pages/LoginPage/](frontend/src/pages/LoginPage/) - Token login (14-day cookie)
- [frontend/src/components/Layout/](frontend/src/components/Layout/) - Shell with header nav and version footer
- [frontend/src/components/EntryNav/](frontend/src/components/EntryNav/) - Prev/next navigation for entries
- [frontend/webpack.config.js](frontend/webpack.config.js) - webpack 5 config (CSS Modules, ts-loader, dev proxy)

### Key Patterns

- Zod schemas are the single source of truth for both validation and OpenAPI spec generation
- Uses `monadix/result` for Result type error handling
- Supports both JSON and YAML request bodies (Content-Type: application/yaml)
- YAML input format uses compact strings (e.g., `run: "regular track-id 5.2 3"`)
- Database file: `data/db.sqlite` (overridden by `DB_PATH` env var; `:memory:` for tests)
- API responses wrapped in envelope: `{ links: { self, ... }, result }` for success, `{ error, details? }` for errors
- Cookie-based authentication: all data endpoints require a `token` cookie matching `AUTH_TOKEN` env var
- `.env` file loaded at startup via `process.loadEnvFile()`; server refuses to start without `AUTH_TOKEN`
- Public routes (`/health`, `/api`) are exempt from authentication
- All API routes are mounted under `/api` prefix; SPA fallback (`/{*path}`) is registered **after** `app.use('/api', router)` — order matters in Express 5
- CSS Modules: use `esModule: false` + `namedExport: false` in css-loader options (required for style-loader v4 compatibility)

### Authentication

The server requires a `.env` file with `AUTH_TOKEN=<secret>`. All data endpoints check for a `token` cookie matching this value. The `/health` and `/api` endpoints are public. The frontend sets the cookie with a 14-day expiry on login.

### API Endpoints

**Public (no auth required):**
- `GET /health` - Health check
- `GET /api` - OpenAPI 3.1 spec (JSON)

**Protected (require `token` cookie):**
- `GET /api/entries`, `GET /api/entries/:date`, `POST /api/entries`, `PATCH /api/entries/:date`
- `GET /api/tracks`, `GET /api/tracks/:id`, `POST /api/tracks`
- `GET /api/workouts/:date`, `GET /api/week/:week`
- `GET /api/stats`, `GET /api/summary`, `GET /api/exercises`
- `GET /api/meals`
- `GET /api/diary`, `POST /api/entries/:date/diary`
