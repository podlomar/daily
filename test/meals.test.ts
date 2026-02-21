import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { request } from './setup.js';

describe('GET /meals', () => {
  it('returns 200 with array of meals', async () => {
    const res = await request.get('/meals');
    assert.equal(res.status, 200);
    assert.equal(res.body.links.self, '/meals');
    assert.ok(Array.isArray(res.body.result));
    assert.ok(res.body.result.length > 0);
  });

  it('computes calories correctly for known meal', async () => {
    const res = await request.get('/meals');
    const meal = res.body.result.find(
      (m: any) => m.id === 'medovy-jogurt-s-corn-flakes',
    );
    assert.ok(meal);
    assert.equal(meal.name, 'Medový jogurt s corn flakes');
    assert.equal(meal.kcal, 126);
    assert.equal(meal.ingredients.length, 3);
  });
});
