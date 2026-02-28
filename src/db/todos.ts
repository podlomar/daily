import * as z from 'zod';
import { nanoid } from 'nanoid';
import { db } from './connection.js';
import dayjs from 'dayjs';

export const ZTodo = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string().meta({ format: 'date-time' }),
  done: z.boolean(),
}).meta({ id: 'Todo' });

export type Todo = z.infer<typeof ZTodo>;

export const ZTodoInput = z.strictObject({
  text: z.string().min(1),
}).meta({ id: 'TodoInput' });

export type TodoInput = z.infer<typeof ZTodoInput>;

const rowToTodo = (row: any): Todo => ({
  id: row.id,
  text: row.text,
  createdAt: row.created_at,
  done: row.done === 1,
});

export const getAllTodos = (): Todo[] => {
  const stmt = db.prepare('SELECT * FROM todos ORDER BY done ASC, created_at DESC');
  return stmt.all().map(rowToTodo);
};

export const ZTodoPatch = z.strictObject({
  done: z.boolean(),
}).meta({ id: 'TodoPatch' });

export type TodoPatch = z.infer<typeof ZTodoPatch>;

export const updateTodo = (id: string, patch: TodoPatch): boolean => {
  const stmt = db.prepare('UPDATE todos SET done = ? WHERE id = ?');
  const info = stmt.run(patch.done ? 1 : 0, id);
  return info.changes > 0;
};

export const createTodo = (input: TodoInput): Todo => {
  const id = nanoid(8);
  const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const stmt = db.prepare('INSERT INTO todos (id, text, created_at, done) VALUES (?, ?, ?, 0)');
  stmt.run(id, input.text, createdAt);

  return { id, text: input.text, createdAt, done: false };
};
