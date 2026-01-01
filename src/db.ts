import { initializeDatabase } from './db-init.js';
import type { Track } from './db-model.js';
import dayjs from 'dayjs';

const db = initializeDatabase();

const rowToTrack = (row: any): Track => ({
  id: row.id,
  name: row.name,
  length: row.length,
  url: row.url,
  progressUnit: row.progress_unit
});

export const getAllTracks = (): Track[] => {
  const stmt = db.prepare('SELECT * FROM running_tracks');
  return stmt.all().map(rowToTrack);
};

export const getTrackById = (id: string): Track | null => {
  const stmt = db.prepare('SELECT * FROM running_tracks WHERE id = ?');
  const row = stmt.get(id);
  return row ? rowToTrack(row) : null;
};

export const getAllDialyEntries = () => {
  const stmt = db.prepare('SELECT * FROM daily_entries');
  return stmt.all();
};

export const getDailyEntryByDate = (date: string) => {
  const stmt = db.prepare('SELECT * FROM daily_entries WHERE date = ?');
  return stmt.get(date);
};

export const updateDailyDiary = (date: string, diary: string | null): boolean => {
  const stmt = db.prepare('UPDATE daily_entries SET diary = ? WHERE date = ?');
  const info = stmt.run(diary, date);
  return info.changes > 0;
};

export const buildDiary = () => {
  const stmt = db.prepare('SELECT date, diary FROM daily_entries WHERE diary IS NOT NULL ORDER BY date ASC');

  let result = '';
  for (const row of stmt.iterate()) {
    const r = row as { date: string; diary: string };
    result += `${dayjs(r.date).toString()}\n${r.diary}\n\n`;
  }
  return result.trim();
}
