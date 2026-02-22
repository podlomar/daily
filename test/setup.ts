process.env.AUTH_TOKEN = 'test-token';

import supertest, { type Test } from 'supertest';
import { app } from '../src/index.js';

export const unauthRequest = supertest(app);

const withAuth = (test: Test): Test => test.set('Cookie', 'token=test-token');

const base = supertest(app);

export const request = {
  get: (url: string) => withAuth(base.get(url)),
  post: (url: string) => withAuth(base.post(url)),
  patch: (url: string) => withAuth(base.patch(url)),
  put: (url: string) => withAuth(base.put(url)),
  delete: (url: string) => withAuth(base.delete(url)),
};
