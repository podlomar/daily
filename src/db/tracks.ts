import * as z from 'zod';
import { db } from './connection.js';
import { ZSchedule } from './schema.js';

export const ZTrack = z.object({
  id: z.string(),
  name: z.string(),
  length: z.number().meta({ description: 'Track distance' }),
  url: z.url(),
  progressUnit: z.enum(['km', 'flight', 'pole']),
}).meta({ id: 'Track' });

export type Track = z.infer<typeof ZTrack>;

export const ZRunning = z.object({
  schedule: ZSchedule,
  track: ZTrack.nullable(),
  progress: z.string().nullable(),
  performance: z.int().min(0).max(5).nullable(),
}).meta({ id: 'Running' });

export type Running = z.infer<typeof ZRunning>;

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
