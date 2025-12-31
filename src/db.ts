import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db.local.sqlite');
const db = new Database(dbPath);

export const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    insert.run('Alice Johnson', 'alice@example.com');
    insert.run('Bob Smith', 'bob@example.com');
    insert.run('Charlie Brown', 'charlie@example.com');
    console.log('Sample data inserted');
  }
};

export const getAllUsers = () => {
  return db.prepare('SELECT * FROM users').all();
};

export const getUserById = (id: number) => {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
};

export default db;
