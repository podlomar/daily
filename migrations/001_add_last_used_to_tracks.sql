-- Migration 001: add last_used to running_tracks
--
-- Backfills last_used from the most recent daily_entry that referenced each track.
-- Run once against the production database:
--   sqlite3 data/db.sqlite < migrations/001_add_last_used_to_tracks.sql

ALTER TABLE running_tracks ADD COLUMN last_used DATE;

UPDATE running_tracks
SET last_used = (
  SELECT MAX(de.date)
  FROM daily_entries de
  WHERE de.track_id = running_tracks.id
);
