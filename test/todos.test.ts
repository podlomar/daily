import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { request } from './setup.js';

describe('Todos API', () => {
  describe('POST /todos', () => {
    it('creates a todo and returns 201', async () => {
      const res = await request.post('/api/todos').send({ text: 'Buy groceries' });
      assert.equal(res.status, 201);
      assert.equal(res.body.links.self, '/api/todos');
      assert.ok(typeof res.body.result.id === 'string');
      assert.equal(res.body.result.id.length, 6);
      assert.equal(res.body.result.text, 'Buy groceries');
      assert.match(res.body.result.createdAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(res.body.result.done, false);
    });

    it('accepts a custom createdAt date', async () => {
      const res = await request.post('/api/todos').send({ text: 'Old task', createdAt: '2025-01-15' });
      assert.equal(res.status, 201);
      assert.equal(res.body.result.createdAt, '2025-01-15');
    });

    it('returns 400 for missing text', async () => {
      const res = await request.post('/api/todos').send({});
      assert.equal(res.status, 400);
    });

    it('returns 400 for empty text', async () => {
      const res = await request.post('/api/todos').send({ text: '' });
      assert.equal(res.status, 400);
    });
  });

  describe('GET /todos', () => {
    it('returns all todos', async () => {
      const res = await request.get('/api/todos');
      assert.equal(res.status, 200);
      assert.equal(res.body.links.self, '/api/todos');
      assert.ok(Array.isArray(res.body.result));
      assert.ok(res.body.result.length >= 2);

      const todo = res.body.result.find((t: any) => t.text === 'Buy groceries');
      assert.ok(todo);
      assert.equal(todo.done, false);
    });

    it('returns pending todos before done todos', async () => {
      const res = await request.get('/api/todos');
      assert.equal(res.status, 200);
      const todos = res.body.result;
      const firstDoneIndex = todos.findIndex((t: any) => t.done === true);
      const lastPendingIndex = todos.findLastIndex((t: any) => t.done === false);
      if (firstDoneIndex !== -1 && lastPendingIndex !== -1) {
        assert.ok(lastPendingIndex < firstDoneIndex);
      }
    });
  });
});
