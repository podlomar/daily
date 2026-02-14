import { db } from './connection.js';
import type { Track } from '../db-model.js';

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

export const createTrack = (track: Track): void => {
  const stmt = db.prepare(`
    INSERT INTO running_tracks (id, name, length, url, progress_unit)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(track.id, track.name, track.length, track.url, track.progressUnit);
};
