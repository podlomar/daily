# Frontend Implementation Plan

## Overview

A minimalist dark-mode React SPA for the Daily Fitness Tracker API. Lives in `frontend/` within the existing repo. Served from the same domain via Express static middleware.

## Tech Stack

- **React 19** with TypeScript
- **Webpack 5** for bundling (dev server + production build)
- **CSS Modules** for scoped styling
- **React Router** for client-side navigation

No UI library — hand-crafted minimalist dark theme.

## Pages & Routes

### 1. Login (`/login`)
Single input field for the auth token. On submit, sets `document.cookie = "token=<value>"` and redirects to the dashboard. No server-side session — just the cookie the API already expects.

### 2. Dashboard (`/`)
The main view. Shows:

- **Stats card** — current running streak, best streak, total runs/distance (from `GET /stats`)
- **Today's entry** — summary of today's data or a "no entry yet" placeholder (from `GET /entries/today`)
- **Recent entries list** — last 7-14 entries as a compact table/list (from `GET /entries`, most recent first)
- **Quick nav** — click any entry row to go to its detail page

### 3. Entry Detail (`/entries/:date`)
Full view of a single daily entry. Shows:

- Date header with day-of-week, navigation arrows (previous/next using the `links` from the API response)
- **Running section** — schedule, track name + link, progress, performance rating (0-5 as dots/stars)
- **Workout section** — schedule, routine name, results table (exercise, execution, volume)
- **Body section** — weight, last meal time, stretching, stairs
- **Diary section** — diary text (if present)

## Project Structure

```
frontend/
├── webpack.config.js
├── tsconfig.json
├── package.json
├── public/
│   └── index.html
└── src/
    ├── index.tsx              # Entry point, React root
    ├── App.tsx                # Router setup, auth guard
    ├── api.ts                 # API client (fetch wrapper with error handling)
    ├── types.ts               # TypeScript types matching API schemas
    ├── styles/
    │   ├── global.css         # CSS reset, dark theme variables, typography
    │   └── tokens.css         # Design tokens (colors, spacing, fonts)
    ├── components/
    │   ├── Layout/
    │   │   ├── Layout.tsx
    │   │   └── Layout.module.css
    │   ├── StatsCard/
    │   │   ├── StatsCard.tsx
    │   │   └── StatsCard.module.css
    │   ├── EntryRow/
    │   │   ├── EntryRow.tsx
    │   │   └── EntryRow.module.css
    │   └── EntryNav/
    │       ├── EntryNav.tsx
    │       └── EntryNav.module.css
    └── pages/
        ├── LoginPage/
        │   ├── LoginPage.tsx
        │   └── LoginPage.module.css
        ├── DashboardPage/
        │   ├── DashboardPage.tsx
        │   └── DashboardPage.module.css
        └── EntryPage/
            ├── EntryPage.tsx
            └── EntryPage.module.css
```

## Design Tokens (Dark Theme)

```css
:root {
  /* Background */
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #21262d;

  /* Text */
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #484f58;

  /* Accent */
  --accent: #58a6ff;
  --accent-subtle: #1f6feb33;

  /* Status */
  --success: #3fb950;
  --warning: #d29922;
  --danger: #f85149;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;

  /* Borders */
  --border: 1px solid #30363d;
  --radius: 6px;
}
```

## API Client (`api.ts`)

A thin `fetch` wrapper. All functions return typed data.

```ts
const API_BASE = '/api-prefix-or-empty';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...options });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.result;
}

export const api = {
  getStats: () => request<Stats>('/stats'),
  getEntries: () => request<DailyEntry[]>('/entries'),
  getEntry: (date: string) => request<DailyEntry>(`/entries/${date}`),
  getMeals: () => request<Meal[]>('/meals'),
  getExercises: () => request<Exercise[]>('/exercises'),
};
```

## TypeScript Types (`types.ts`)

Derived from the Zod schemas / OpenAPI spec:

```ts
interface Track {
  id: string;
  name: string;
  length: number;
  url: string;
  progressUnit: 'km' | 'flight' | 'pole';
}

interface Running {
  schedule: 'regular' | 'adhoc' | 'legacy' | 'void';
  track: Track | null;
  progress: string | null;
  performance: number | null;
}

interface WorkoutResult {
  exercise: string;
  execution: string;
  volume: string;
}

interface Workout {
  schedule: 'regular' | 'adhoc' | 'legacy' | 'void';
  routine: string | null;
  results: WorkoutResult[];
}

interface DailyEntry {
  date: string;
  week: string;
  year: number;
  month: string;
  day: string;
  running: Running;
  workout: Workout;
  weight: number | null;
  lastMeal: string | null;
  stretching: string | null;
  stairs: string | null;
  diary: string | null;
}

interface Stats {
  bestRunningStreak: { count: number; distance: number };
  currentRunningStreak: { count: number; distance: number };
  total: { count: number; distance: number };
}

interface Meal {
  id: string;
  name: string;
  kcal: number;
  ingredients: { id: string; name: string; quantity: string; kcal: number }[];
}
```

## Serving from Express

Add static file serving in `src/index.ts` to serve the built frontend. The frontend build output goes to `frontend/dist/`.

```ts
import path from 'path';
import express from 'express';

// Serve frontend static files
app.use(express.static(path.join(process.cwd(), 'frontend', 'dist')));

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'frontend', 'dist', 'index.html'));
});
```

This should be added **after** all API routes so API paths take priority.

## Webpack Configuration

```js
// frontend/webpack.config.js
module.exports = (env, argv) => ({
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\.module\.css$/,
        use: ['style-loader', { loader: 'css-loader', options: { modules: true } }],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devServer: {
    port: 3000,
    proxy: [{ context: ['/stats', '/entries', '/tracks', '/meals', '/health', '/api', '/exercises', '/workouts', '/diary', '/week', '/summary'], target: 'http://localhost:4321' }],
    historyApiFallback: true,
  },
});
```

## Deploy Integration

Update `deploy/deploy.sh` to include the frontend build:

```bash
# Build frontend
(cd frontend && npm run build)

# Existing rsync + frontend dist
rsync -avz frontend/dist/ "$REMOTE/frontend/dist/"
```

Update `package.json` deploy script to also build the frontend.

## Implementation Order

1. **Scaffold** — `frontend/` directory with webpack, TypeScript, React, CSS Modules setup
2. **Global styles** — dark theme tokens, CSS reset, base typography
3. **API client + types** — `api.ts` and `types.ts`
4. **Layout component** — app shell with header/nav
5. **Login page** — token input, cookie setter, redirect
6. **Dashboard page** — stats card, today's entry, recent entries list
7. **Entry detail page** — full entry view with prev/next navigation
8. **Express integration** — static file serving + SPA fallback
9. **Deploy update** — include frontend in deploy script

## Design Principles

- **Monospace-forward** — use monospace font for data values (dates, numbers, distances)
- **Information density** — compact layout, no wasted whitespace, data at a glance
- **Subtle borders** — card boundaries via thin borders, not heavy shadows
- **Color-coded schedules** — `regular` = accent blue, `adhoc` = warning yellow, `void` = muted gray
- **No loading spinners** — use skeleton placeholders or simply show content when ready
- **Responsive** — works on mobile but optimized for desktop
