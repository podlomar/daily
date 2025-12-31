import { initializeDatabase } from './db-init.js';

const db = initializeDatabase();

export const getAllTracks = () => {
  const stmt = db.prepare('SELECT * FROM running_tracks');
  return stmt.all();
};

export const getTrackById = (id: string) => {
  const stmt = db.prepare('SELECT * FROM running_tracks WHERE id = ?');
  return stmt.get(id);
};
