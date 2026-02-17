# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run start      # Run the compiled server
npm run dev        # Development mode: watch TypeScript + auto-restart server
npm test           # Run API integration tests (Mocha + Supertest, in-memory SQLite)
```

## Architecture Overview

This is a personal fitness tracking REST API built with Express 5 and TypeScript. It uses SQLite (better-sqlite3) for data persistence.

### Core Concepts

- **Daily Entries**: Central entity tracking daily fitness data including running, workouts, weight, meals, stretching, stairs, and diary notes
- **Running Tracks**: Reference data for running routes with distance and progress units (km, flight, pole)
- **Workout Results**: Individual exercise results linked to daily entries with exercise name, execution type, and volume
- **Schedules**: Activities are classified as `regular`, `adhoc`, `legacy`, or `void`

### File Structure

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
- [sql/schema.sql](sql/schema.sql) - Database schema definition
- [test/](test/) - Mocha + Supertest API integration tests

### Key Patterns

- Zod schemas are the single source of truth for both validation and OpenAPI spec generation
- Uses `monadix/result` for Result type error handling
- Supports both JSON and YAML request bodies (Content-Type: application/yaml)
- YAML input format uses compact strings (e.g., `run: "regular track-id 5.2 3"`)
- Database file: `db.local.sqlite` in project root (overridden by `DB_PATH` env var, `:memory:` for tests)
- API responses wrapped in envelope: `{ links: { self, ... }, result }` for success, `{ error, details? }` for errors

### API Endpoints

- `GET /api` - OpenAPI 3.1 spec (JSON)
- `GET /entries`, `GET /entries/:date`, `POST /entries`, `PATCH /entries/:date`
- `GET /tracks`, `GET /tracks/:id`, `POST /tracks`
- `GET /workouts/:date`, `GET /week/:week`
- `GET /stats`, `GET /summary`, `GET /exercises`
- `GET /diary`, `POST /entries/:date/diary`
- `GET /health`
