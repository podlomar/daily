import supertest from 'supertest';
import { app } from '../src/index.js';

export const request = supertest(app);
