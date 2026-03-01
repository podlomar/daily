-- Migration 003: allow NULL for running_schedule (and workout_schedule already nullable)
--
-- SQLite does not support ALTER COLUMN, so we recreate the table.
-- Run once against the production database:
--   sqlite3 data/db.sqlite < migrations/003_nullable_schedules.sql

PRAGMA foreign_keys=OFF;

CREATE TABLE daily_entries_new (
  date DATE PRIMARY KEY,
  week STRING NOT NULL,
  year INTEGER NOT NULL,
  month STRING NOT NULL CHECK(month IN ('jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec')),
  day STRING CHECK(day IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')) NOT NULL,

  running_schedule TEXT CHECK(running_schedule IN ('regular', 'adhoc', 'legacy', 'void')),
  track_id TEXT,
  running_progress TEXT,
  running_performance INTEGER CHECK(running_performance >= 0 AND running_performance <= 5),

  workout_schedule TEXT CHECK(workout_schedule IN ('regular', 'adhoc', 'legacy', 'void')),
  workout_routine TEXT,

  weight REAL,
  last_meal TIME,
  stretching TEXT,
  stairs TEXT,
  diary TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (track_id) REFERENCES running_tracks(id)
);

INSERT INTO daily_entries_new SELECT * FROM daily_entries;

DROP TABLE daily_entries;
ALTER TABLE daily_entries_new RENAME TO daily_entries;

PRAGMA foreign_keys=ON;
