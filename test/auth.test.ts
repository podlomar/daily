import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { unauthRequest } from './setup.js';

describe('Authentication', () => {
  it('allows /health without cookie', async () => {
    const res = await unauthRequest.get('/health');
    assert.equal(res.status, 200);
  });

  it('allows /api without cookie', async () => {
    const res = await unauthRequest.get('/api');
    assert.equal(res.status, 200);
  });

  it('rejects protected endpoint without cookie', async () => {
    const res = await unauthRequest.get('/entries');
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Unauthorized');
  });

  it('rejects protected endpoint with wrong cookie', async () => {
    const res = await unauthRequest
      .get('/entries')
      .set('Cookie', 'token=wrong-value');
    assert.equal(res.status, 401);
  });
});
