import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { request } from './setup.js';

describe('GET /api', () => {
  it('returns a valid OpenAPI 3.1 spec', async () => {
    const res = await request.get('/api');
    assert.equal(res.status, 200);
    assert.equal(res.body.openapi, '3.1.0');
    assert.ok(res.body.info);
    assert.equal(res.body.info.title, 'Daily Fitness Tracker API');
    assert.ok(res.body.paths);
    assert.ok(res.body.components);
  });

  it('documents all endpoints', async () => {
    const res = await request.get('/api');
    const paths = Object.keys(res.body.paths);
    assert.ok(paths.includes('/health'));
    assert.ok(paths.includes('/entries'));
    assert.ok(paths.includes('/entries/{date}'));
    assert.ok(paths.includes('/tracks'));
    assert.ok(paths.includes('/tracks/{id}'));
    assert.ok(paths.includes('/workouts/{date}'));
    assert.ok(paths.includes('/diary'));
    assert.ok(paths.includes('/week/{week}'));
    assert.ok(paths.includes('/stats'));
    assert.ok(paths.includes('/summary'));
    assert.ok(paths.includes('/exercises'));
    assert.ok(paths.includes('/meals'));
  });

  it('includes component schemas', async () => {
    const res = await request.get('/api');
    const schemas = Object.keys(res.body.components.schemas);
    assert.ok(schemas.includes('Track'));
    assert.ok(schemas.includes('DailyEntry'));
    assert.ok(schemas.includes('DailyEntryInput'));
    assert.ok(schemas.includes('ErrorResponse'));
    assert.ok(schemas.includes('Meal'));
  });
});
