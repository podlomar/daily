import * as z from 'zod';
import { createDocument } from 'zod-openapi';
import pkg from '../package.json' with { type: 'json' };
import { ZLinks, ZErrorResponse } from './db/schema.js';
import { ZTrack, ZRunning } from './db/tracks.js';
import { ZWorkoutResult, ZWorkout } from './db/workouts.js';
import { ZDailyEntry, ZDailyEntryInput, ZDailyEntryUpdate } from './db/entries.js';
import { ZStats } from './db/stats.js';
import { ZMeal } from './food/meals.js';

const envelopeOf = (resultSchema: z.ZodType) => z.object({
  links: ZLinks,
  result: resultSchema,
});

const jsonEnvelope = (resultSchema: z.ZodType) => ({
  content: { 'application/json': { schema: envelopeOf(resultSchema) } },
});

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ZErrorResponse } },
});

const dateParam = {
  name: 'date',
  in: 'path' as const,
  required: true,
  schema: { type: 'string' as const },
  description: 'Date in YYYY-MM-DD format, or "today"',
};

export const openapiSpec = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Daily Fitness Tracker API',
    version: pkg.version,
    description: 'Personal fitness tracking REST API for daily entries including running, workouts, weight, meals, stretching, stairs, and diary notes.',
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service status',
            ...jsonEnvelope(z.object({
              status: z.literal('ok'),
              timestamp: z.string().meta({ format: 'date-time' }),
              uptime: z.number(),
            })),
          },
        },
      },
    },
    '/stats': {
      get: {
        summary: 'Running statistics and streaks',
        operationId: 'getStats',
        responses: {
          '200': {
            description: 'Running stats',
            ...jsonEnvelope(ZStats),
          },
        },
      },
    },
    '/summary': {
      get: {
        summary: 'Workout exercise progression summary',
        operationId: 'getSummary',
        responses: {
          '200': {
            description: 'Map of exercise names to their volume history',
            ...jsonEnvelope(z.record(z.string(), z.array(z.number()))),
          },
        },
      },
    },
    '/tracks': {
      get: {
        summary: 'List all running tracks',
        operationId: 'getTracks',
        responses: {
          '200': {
            description: 'List of tracks',
            ...jsonEnvelope(z.array(ZTrack)),
          },
        },
      },
      post: {
        summary: 'Create a running track',
        operationId: 'createTrack',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ZTrack } },
        },
        responses: {
          '201': {
            description: 'Track created',
            ...jsonEnvelope(z.object({ message: z.string() })),
          },
          '500': errorResponse('Server error'),
        },
      },
    },
    '/tracks/{id}': {
      get: {
        summary: 'Get a running track by ID',
        operationId: 'getTrackById',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Track details',
            ...jsonEnvelope(ZTrack),
          },
          '404': errorResponse('Track not found'),
        },
      },
    },
    '/entries': {
      get: {
        summary: 'List all daily entries',
        operationId: 'getEntries',
        responses: {
          '200': {
            description: 'List of daily entries',
            ...jsonEnvelope(z.array(ZDailyEntry)),
          },
        },
      },
      post: {
        summary: 'Create a daily entry',
        operationId: 'createEntry',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: ZDailyEntryInput },
            'application/yaml': {
              schema: {
                type: 'object',
                description: 'YAML format with compact strings. run: "schedule trackId progress performance", workout: "schedule routine"',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Entry created',
            ...jsonEnvelope(z.object({
              message: z.string(),
              report: z.array(z.string()),
            })),
          },
          '400': errorResponse('Validation error'),
        },
      },
    },
    '/entries/{date}': {
      get: {
        summary: 'Get a daily entry by date',
        operationId: 'getEntryByDate',
        parameters: [dateParam],
        responses: {
          '200': {
            description: 'Daily entry with navigation links (previous, next)',
            ...jsonEnvelope(ZDailyEntry),
          },
          '404': errorResponse('Entry not found'),
        },
      },
      patch: {
        summary: 'Update a daily entry',
        operationId: 'updateEntry',
        parameters: [dateParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ZDailyEntryUpdate } },
        },
        responses: {
          '200': {
            description: 'Entry updated',
            ...jsonEnvelope(z.object({ message: z.string() })),
          },
          '404': errorResponse('Entry not found'),
        },
      },
    },
    '/entries/{date}/diary': {
      post: {
        summary: 'Update diary text for a daily entry',
        operationId: 'updateDiary',
        parameters: [dateParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: z.object({ diary: z.string() }) } },
        },
        responses: {
          '200': {
            description: 'Diary updated',
            ...jsonEnvelope(z.object({ message: z.string() })),
          },
          '404': errorResponse('Entry not found'),
        },
      },
    },
    '/workouts/{date}': {
      get: {
        summary: 'Get workout results for a date',
        operationId: 'getWorkoutsByDate',
        parameters: [dateParam],
        responses: {
          '200': {
            description: 'Workout results',
            ...jsonEnvelope(z.array(ZWorkoutResult)),
          },
        },
      },
    },
    '/diary': {
      get: {
        summary: 'Get all diary entries as plain text',
        operationId: 'getDiary',
        responses: {
          '200': {
            description: 'Diary text',
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/week/{week}': {
      get: {
        summary: 'Get weekly summary of daily entries',
        operationId: 'getWeekSummary',
        parameters: [{ name: 'week', in: 'path', required: true, schema: { type: 'string' }, description: 'ISO week as YYYY-WW, e.g. 2026-07' }],
        responses: {
          '200': {
            description: 'Week summary with all daily entries for that week',
            ...jsonEnvelope(z.array(ZDailyEntry)),
          },
          '404': errorResponse('Week not found'),
        },
      },
    },
    '/meals': {
      get: {
        summary: 'List all meals with computed calories',
        operationId: 'getMeals',
        responses: {
          '200': {
            description: 'List of meals',
            ...jsonEnvelope(z.array(ZMeal)),
          },
        },
      },
    },
    '/exercises': {
      get: {
        summary: 'List all available exercises',
        operationId: 'getExercises',
        responses: {
          '200': {
            description: 'List of exercises',
            ...jsonEnvelope(z.array(z.object({ name: z.string() }))),
          },
        },
      },
    },
  },
});
