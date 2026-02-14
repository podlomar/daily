import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { request } from './setup.js';

const sampleTrack = {
  id: 'test-track',
  name: 'Test Track',
  length: 2.5,
  url: 'https://example.com/track',
  progressUnit: 'km',
};

describe('Tracks API', () => {
  describe('POST /tracks', () => {
    it('creates a track and returns 201', async () => {
      const res = await request.post('/tracks').send(sampleTrack);
      assert.equal(res.status, 201);
      assert.equal(res.body.links.self, '/tracks');
      assert.equal(res.body.result.message, 'Track created successfully');
    });
  });

  describe('GET /tracks', () => {
    it('returns all tracks', async () => {
      const res = await request.get('/tracks');
      assert.equal(res.status, 200);
      assert.equal(res.body.links.self, '/tracks');
      assert.ok(Array.isArray(res.body.result));
      assert.ok(res.body.result.length >= 1);

      const track = res.body.result.find((t: any) => t.id === 'test-track');
      assert.ok(track);
      assert.equal(track.name, 'Test Track');
      assert.equal(track.length, 2.5);
    });
  });

  describe('GET /tracks/:id', () => {
    it('returns a specific track', async () => {
      const res = await request.get('/tracks/test-track');
      assert.equal(res.status, 200);
      assert.equal(res.body.links.self, '/tracks/test-track');
      assert.equal(res.body.result.id, 'test-track');
      assert.equal(res.body.result.progressUnit, 'km');
    });

    it('returns 404 for unknown track', async () => {
      const res = await request.get('/tracks/nonexistent');
      assert.equal(res.status, 404);
    });
  });
});
