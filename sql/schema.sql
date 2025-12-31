-- Running tracks (reference data)
CREATE TABLE IF NOT EXISTS running_tracks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  length REAL NOT NULL,
  url TEXT NOT NULL,
  progress_unit TEXT CHECK(progress_unit IN ('km', 'flight')) NOT NULL
);

-- Main daily entries table
CREATE TABLE IF NOT EXISTS daily_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,

  -- Running data
  track_id TEXT,
  running_progress INTEGER,
  running_performance INTEGER CHECK(running_performance >= 1 AND running_performance <= 5),

  -- Workout data
  workout_type TEXT CHECK(workout_type IN ('predefined', 'adhoc')),
  workout_routine TEXT,

  -- General daily data
  weight REAL,
  last_meal TIME,
  stretching BOOLEAN,
  stairs TEXT,

  -- Diary
  diary TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (track_id) REFERENCES running_tracks(id)
);

-- Workout results (individual exercise results)
CREATE TABLE IF NOT EXISTS workout_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  daily_entry_id INTEGER NOT NULL,
  exercise_name TEXT NOT NULL,
  reps TEXT,
  holds TEXT,
  notes TEXT,
  FOREIGN KEY (daily_entry_id) REFERENCES daily_entries(id) ON DELETE CASCADE
);
