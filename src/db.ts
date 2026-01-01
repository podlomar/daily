import { initializeDatabase } from './db-init.js';
import type { DailyEntry, Track } from './db-model.js';
import dayjs from 'dayjs';

const db = initializeDatabase();

const rowToTrack = (row: any): Track => ({
  id: row.id,
  name: row.name,
  length: row.length,
  url: row.url,
  progressUnit: row.progress_unit
});

const rowToDailyEntry = (row: any): DailyEntry => {
  const track = row.track_id ? {
    id: row.track_id,
    name: row.track_name,
    length: row.track_length,
    url: row.track_url,
    progressUnit: row.track_progress_unit
  } : null;

  return {
    date: row.date,
    week: row.week,
    day: row.day,
    running: {
      schedule: row.running_schedule,
      track: track,
      progress: row.running_progress,
      performance: row.running_performance
    },
    workout: {
      schedule: row.workout_schedule,
      routine: row.workout_routine
    },
    weight: row.weight,
    lastMeal: row.last_meal,
    stretching: row.stretching,
    stairs: row.stairs,
    diary: row.diary
  };
};

export const getAllTracks = (): Track[] => {
  const stmt = db.prepare('SELECT * FROM running_tracks');
  return stmt.all().map(rowToTrack);
};

export const getTrackById = (id: string): Track | null => {
  const stmt = db.prepare('SELECT * FROM running_tracks WHERE id = ?');
  const row = stmt.get(id);
  return row ? rowToTrack(row) : null;
};

export const getAllDialyEntries = (): DailyEntry[] => {
  const stmt = db.prepare(`
    SELECT
      de.*,
      rt.id as track_id,
      rt.name as track_name,
      rt.length as track_length,
      rt.url as track_url,
      rt.progress_unit as track_progress_unit
    FROM daily_entries de
    LEFT JOIN running_tracks rt ON de.track_id = rt.id
    ORDER BY de.date DESC
  `);
  return stmt.all().map(rowToDailyEntry);
};

export const getDailyEntryByDate = (date: string): DailyEntry | null => {
  const stmt = db.prepare(`
    SELECT
      de.*,
      rt.id as track_id,
      rt.name as track_name,
      rt.length as track_length,
      rt.url as track_url,
      rt.progress_unit as track_progress_unit
    FROM daily_entries de
    LEFT JOIN running_tracks rt ON de.track_id = rt.id
    WHERE de.date = ?
  `);
  const row = stmt.get(date);
  return row ? rowToDailyEntry(row) : null;
};

export const updateDailyDiary = (date: string, diary: string | null): boolean => {
  const stmt = db.prepare('UPDATE daily_entries SET diary = ? WHERE date = ?');
  const info = stmt.run(diary, date);
  return info.changes > 0;
};

export const buildDiary = (): string => {
  const stmt = db.prepare('SELECT date, diary FROM daily_entries WHERE diary IS NOT NULL ORDER BY date ASC');

  let result = '';
  for (const row of stmt.iterate()) {
    const r = row as { date: string; diary: string };
    result += `${dayjs(r.date).toString()}\n${r.diary}\n\n`;
  }
  return result.trim();
}
