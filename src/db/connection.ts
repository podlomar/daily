import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'db.sqlite');
const db = new Database(dbPath);

const initializeSchema = () => {
  const schemaPath = path.join(process.cwd(), 'data', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database schema initialized successfully');
};

initializeSchema();

export { db };
