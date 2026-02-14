import assert from 'node:assert/strict';
import { describe, it, before } from 'mocha';
import { request } from './setup.js';

const testDate = '2026-01-15';

const sampleTrack = {
  id: 'entry-test-track',
  name: 'Entry Test Track',
  length: 3.0,
  url: 'https://example.com/entry-track',
  progressUnit: 'km',
};

const sampleEntry = {
  date: testDate,
  running: {
    schedule: 'regular' as const,
    trackId: 'entry-test-track',
    progress: 'full',
    performance: 3,
  },
  workout: {
    schedule: 'void' as const,
  },
  weight: 75.5,
  lastMeal: '19:00',
};

describe('Entries API', () => {
  before(async () => {
    await request.post('/tracks').send(sampleTrack);
  });

  describe('POST /entries (JSON)', () => {
    it('creates an entry and returns 201', async () => {
      const res = await request
        .post('/entries')
        .set('Content-Type', 'application/json')
        .send(sampleEntry);
      assert.equal(res.status, 201);
      assert.equal(res.body.links.self, '/entries');
      assert.equal(res.body.result.message, 'Daily entry created successfully');
    });

    it('rejects invalid input with 400', async () => {
      const res = await request
        .post('/entries')
        .set('Content-Type', 'application/json')
        .send({ date: 'not-a-date' });
      assert.equal(res.status, 400);
      assert.ok(res.body.error);
    });

    it('rejects unknown track ID with 400', async () => {
      const res = await request
        .post('/entries')
        .set('Content-Type', 'application/json')
        .send({
          date: '2026-02-20',
          running: {
            schedule: 'regular',
            trackId: 'nonexistent-track',
            progress: 'full',
            performance: 3,
          },
        });
      assert.equal(res.status, 400);
      assert.ok(res.body.error);
      assert.ok(Array.isArray(res.body.details));
    });
  });

  describe('GET /entries/:date', () => {
    it('returns the created entry with navigation links', async () => {
      const res = await request.get(`/entries/${testDate}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.links.self, `/entries/${testDate}`);
      assert.ok(res.body.links.previous);
      assert.ok(res.body.links.next);
      assert.equal(res.body.result.date, testDate);
      assert.equal(res.body.result.weight, 75.5);
      assert.equal(res.body.result.lastMeal, '19:00');
      assert.equal(res.body.result.running.track.id, 'entry-test-track');
    });

    it('returns 404 for unknown date', async () => {
      const res = await request.get('/entries/1999-01-01');
      assert.equal(res.status, 404);
    });
  });

  describe('PATCH /entries/:date', () => {
    it('updates entry fields', async () => {
      const res = await request
        .patch(`/entries/${testDate}`)
        .send({ weight: 76.0, stretching: 'yes' });
      assert.equal(res.status, 200);
      assert.equal(res.body.links.self, `/entries/${testDate}`);

      const check = await request.get(`/entries/${testDate}`);
      assert.equal(check.body.result.weight, 76.0);
      assert.equal(check.body.result.stretching, 'yes');
    });

    it('returns 404 for unknown date', async () => {
      const res = await request
        .patch('/entries/1999-01-01')
        .send({ weight: 80 });
      assert.equal(res.status, 404);
    });
  });

  describe('GET /entries', () => {
    it('returns all entries', async () => {
      const res = await request.get('/entries');
      assert.equal(res.status, 200);
      assert.equal(res.body.links.self, '/entries');
      assert.ok(Array.isArray(res.body.result));
      assert.ok(res.body.result.length >= 1);
    });
  });
});
