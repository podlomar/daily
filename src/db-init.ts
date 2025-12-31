import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'db.local.sqlite');
const db = new Database(dbPath);

const initializeSchema = () => {
  const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  db.exec(schema);

  console.log('Database schema initialized successfully');
};

const loadTracks = () => {
  const tracksPath = path.join(process.cwd(), 'sql', 'tracks.sql');
  const tracks = fs.readFileSync(tracksPath, 'utf-8');

  db.exec(tracks);

  console.log('Tracks loaded successfully');
};

export const initializeDatabase = () => {
  initializeSchema();
  loadTracks();
  return db;
};
