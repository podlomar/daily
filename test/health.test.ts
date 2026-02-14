import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { request } from './setup.js';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request.get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.links.self, '/health');
    assert.equal(res.body.result.status, 'ok');
    assert.ok(res.body.result.timestamp);
    assert.ok(typeof res.body.result.uptime === 'number');
  });
});
