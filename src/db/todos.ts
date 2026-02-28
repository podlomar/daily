import * as z from 'zod';
import { nanoid } from 'nanoid';
import { db } from './connection.js';
import dayjs from 'dayjs';

export const ZTodo = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string().meta({ format: 'date' }),
  done: z.boolean(),
}).meta({ id: 'Todo' });

export type Todo = z.infer<typeof ZTodo>;

export const ZTodoInput = z.strictObject({
  text: z.string().min(1),
  createdAt: z.iso.date().optional().meta({ description: 'Defaults to today if omitted' }),
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

export const createTodo = (input: TodoInput): Todo => {
  const id = nanoid(6);
  const createdAt = input.createdAt ?? dayjs().format('YYYY-MM-DD');

  const stmt = db.prepare('INSERT INTO todos (id, text, created_at, done) VALUES (?, ?, ?, 0)');
  stmt.run(id, input.text, createdAt);

  return { id, text: input.text, createdAt, done: false };
};
