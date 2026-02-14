import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'db.local.sqlite');
const db = new Database(dbPath);

const initializeSchema = () => {
  const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database schema initialized successfully');
};

initializeSchema();

export { db };
