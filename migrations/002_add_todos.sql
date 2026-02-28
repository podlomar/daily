-- Migration 002: add todos table
--
-- Run once against the production database:
--   sqlite3 data/db.sqlite < migrations/002_add_todos.sql

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  created_at DATE NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
);
