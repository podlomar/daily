-- Running tracks (reference data)
CREATE TABLE IF NOT EXISTS running_tracks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  length REAL NOT NULL,
  url TEXT NOT NULL,
  progress_unit TEXT CHECK(progress_unit IN ('km', 'flight', 'pole')) NOT NULL
);

-- Main daily entries table
CREATE TABLE IF NOT EXISTS daily_entries (
  date DATE PRIMARY KEY,
  week STRING NOT NULL,
  year INTEGER NOT NULL,
  month STRING NOT NULL CHECK(month IN ('jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec')),
  day STRING CHECK(day IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')) NOT NULL,

  -- Running data
  running_schedule TEXT NOT NULL CHECK(running_schedule IN ('regular', 'adhoc', 'legacy')),
  track_id TEXT,
  running_progress TEXT NOT NULL,
  running_performance INTEGER CHECK(running_performance >= 0 AND running_performance <= 5),

  -- Workout data
  workout_schedule TEXT CHECK(workout_schedule IN ('regular', 'adhoc', 'legacy')),
  workout_routine TEXT NOT NULL,

  -- General daily data
  weight REAL,
  last_meal TIME,
  stretching TEXT,
  stairs TEXT,

  -- Diary
  diary TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (track_id) REFERENCES running_tracks(id)
);

-- Workout results (individual exercise results)
CREATE TABLE IF NOT EXISTS workout_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  daily_entry_date DATE NOT NULL,
  exercise TEXT NOT NULL,
  reps TEXT,
  holds TEXT,
  FOREIGN KEY (daily_entry_date) REFERENCES daily_entries(date) ON DELETE CASCADE
);
