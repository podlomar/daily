# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run start      # Run the compiled server
npm run dev        # Development mode: watch TypeScript + auto-restart server
```

No tests are currently configured.

## Architecture Overview

This is a personal fitness tracking REST API built with Express 5 and TypeScript. It uses SQLite (better-sqlite3) for data persistence.

### Core Concepts

- **Daily Entries**: Central entity tracking daily fitness data including running, workouts, weight, meals, stretching, stairs, and diary notes
- **Running Tracks**: Reference data for running routes with distance and progress units (km, flight, pole)
- **Workout Results**: Individual exercise results linked to daily entries with exercise name, execution type, and volume
- **Schedules**: Activities are classified as `regular`, `adhoc`, `legacy`, or `void`

### File Structure

- [src/index.ts](src/index.ts) - Express server with REST endpoints, YAML/JSON body parsing middleware
- [src/db.ts](src/db.ts) - Database operations and business logic, validation with Zod
- [src/db-model.ts](src/db-model.ts) - TypeScript interfaces and Zod schemas for data models
- [src/db-init.ts](src/db-init.ts) - SQLite database initialization from schema
- [sql/schema.sql](sql/schema.sql) - Database schema definition

### Key Patterns

- Uses `monadix/result` for Result type error handling
- Supports both JSON and YAML request bodies (Content-Type: application/yaml)
- YAML input format uses compact strings (e.g., `run: "regular track-id 5.2 3"`)
- Database file: `db.local.sqlite` in project root
- API responses wrapped in `Payload` object with `url` and `result` fields

### API Endpoints

- `GET /entries`, `GET /entries/:date`, `POST /entries`, `PATCH /entries/:date`
- `GET /tracks`, `GET /tracks/:id`, `POST /tracks`
- `GET /workouts/:date`, `GET /week/:week`
- `GET /stats`, `GET /summary`, `GET /exercises`
- `GET /diary`, `POST /entries/:date/diary`
- `GET /health`
