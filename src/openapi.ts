const Schedule = {
  type: 'string',
  enum: ['regular', 'adhoc', 'legacy', 'void'],
};

const Track = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    length: { type: 'number', description: 'Track distance' },
    url: { type: 'string', format: 'uri' },
    progressUnit: { type: 'string', enum: ['km', 'flight', 'pole'] },
  },
  required: ['id', 'name', 'length', 'url', 'progressUnit'],
};

const Running = {
  type: 'object',
  properties: {
    schedule: Schedule,
    track: { oneOf: [{ $ref: '#/components/schemas/Track' }, { type: 'null' }] },
    progress: { type: ['string', 'null'] },
    performance: { type: ['integer', 'null'], minimum: 0, maximum: 5 },
  },
  required: ['schedule', 'track', 'progress', 'performance'],
};

const WorkoutResult = {
  type: 'object',
  properties: {
    exercise: { type: 'string' },
    execution: { type: 'string' },
    volume: { type: 'string' },
  },
  required: ['exercise', 'execution', 'volume'],
};

const Workout = {
  type: 'object',
  properties: {
    schedule: Schedule,
    routine: { type: 'string' },
    results: { type: 'array', items: { $ref: '#/components/schemas/WorkoutResult' } },
  },
  required: ['schedule'],
};

const DailyEntry = {
  type: 'object',
  properties: {
    date: { type: 'string', format: 'date' },
    week: { type: 'string', description: 'ISO week as YYYY-WW' },
    year: { type: 'integer' },
    month: { type: 'string', enum: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] },
    day: { type: 'string', enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
    running: { $ref: '#/components/schemas/Running' },
    workout: { $ref: '#/components/schemas/Workout' },
    weight: { type: ['number', 'null'] },
    lastMeal: { type: ['string', 'null'] },
    stretching: { type: ['string', 'null'] },
    stairs: { type: ['string', 'null'] },
    diary: { type: ['string', 'null'] },
  },
  required: ['date', 'week', 'year', 'month', 'day', 'running', 'workout'],
};

const DailyEntryInput = {
  type: 'object',
  properties: {
    date: { type: 'string', format: 'date', description: 'Defaults to today if omitted' },
    running: {
      type: 'object',
      properties: {
        schedule: Schedule,
        trackId: { type: 'string' },
        progress: { type: 'string' },
        performance: { type: 'integer', minimum: 0, maximum: 4 },
      },
      required: ['schedule'],
    },
    workout: {
      type: 'object',
      properties: {
        schedule: Schedule,
        routine: { type: 'string' },
        results: { type: 'array', items: { type: 'string' }, description: 'Format: "exercise/execution volume", e.g. "squats/set3x 22+22+22"' },
      },
      required: ['schedule'],
    },
    weight: { type: ['number', 'null'] },
    lastMeal: { type: ['string', 'null'] },
    stretching: { type: ['string', 'null'] },
    stairs: { type: ['string', 'null'] },
    diary: { type: ['string', 'null'] },
  },
};

const DailyEntryUpdate = {
  type: 'object',
  properties: {
    weight: { type: ['number', 'null'] },
    lastMeal: { type: ['string', 'null'] },
    stretching: { type: ['string', 'null'] },
    stairs: { type: ['string', 'null'] },
    diary: { type: ['string', 'null'] },
  },
};

const Stats = {
  type: 'object',
  properties: {
    bestRunningStreak: {
      type: 'object',
      properties: { count: { type: 'integer' }, distance: { type: 'number' } },
    },
    currentRunningStreak: {
      type: 'object',
      properties: { count: { type: 'integer' }, distance: { type: 'number' } },
    },
    total: {
      type: 'object',
      properties: { count: { type: 'integer' }, distance: { type: 'number' } },
    },
  },
};

const Links = {
  type: 'object',
  properties: {
    self: { type: 'string' },
  },
  required: ['self'],
  additionalProperties: { type: 'string' },
};

const ErrorResponse = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    details: { type: 'array', items: { type: 'string' } },
  },
  required: ['error'],
};

const envelopeOf = (resultSchema: object) => ({
  type: 'object',
  properties: {
    links: { $ref: '#/components/schemas/Links' },
    result: resultSchema,
  },
  required: ['links', 'result'],
});

const jsonEnvelope = (resultSchema: object) => ({
  content: { 'application/json': { schema: envelopeOf(resultSchema) } },
});

const errorRef = { $ref: '#/components/schemas/ErrorResponse' };

const dateParam = {
  name: 'date',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: 'Date in YYYY-MM-DD format, or "today"',
};

export const openapiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Daily Fitness Tracker API',
    version: '1.0.0',
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
            ...jsonEnvelope({
              type: 'object',
              properties: {
                status: { type: 'string', const: 'ok' },
                timestamp: { type: 'string', format: 'date-time' },
                uptime: { type: 'number' },
              },
            }),
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
            ...jsonEnvelope({ $ref: '#/components/schemas/Stats' }),
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
            ...jsonEnvelope({
              type: 'object',
              additionalProperties: { type: 'array', items: { type: 'number' } },
            }),
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
            ...jsonEnvelope({ type: 'array', items: { $ref: '#/components/schemas/Track' } }),
          },
        },
      },
      post: {
        summary: 'Create a running track',
        operationId: 'createTrack',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Track' } } },
        },
        responses: {
          '201': {
            description: 'Track created',
            ...jsonEnvelope({ type: 'object', properties: { message: { type: 'string' } } }),
          },
          '500': { description: 'Server error', content: { 'application/json': { schema: errorRef } } },
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
            ...jsonEnvelope({ $ref: '#/components/schemas/Track' }),
          },
          '404': { description: 'Track not found', content: { 'application/json': { schema: errorRef } } },
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
            ...jsonEnvelope({ type: 'array', items: { $ref: '#/components/schemas/DailyEntry' } }),
          },
        },
      },
      post: {
        summary: 'Create a daily entry',
        operationId: 'createEntry',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/DailyEntryInput' } },
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
            ...jsonEnvelope({
              type: 'object',
              properties: {
                message: { type: 'string' },
                report: { type: 'array', items: { type: 'string' } },
              },
            }),
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: errorRef } } },
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
            ...jsonEnvelope({ $ref: '#/components/schemas/DailyEntry' }),
          },
          '404': { description: 'Entry not found', content: { 'application/json': { schema: errorRef } } },
        },
      },
      patch: {
        summary: 'Update a daily entry',
        operationId: 'updateEntry',
        parameters: [dateParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DailyEntryUpdate' } } },
        },
        responses: {
          '200': {
            description: 'Entry updated',
            ...jsonEnvelope({ type: 'object', properties: { message: { type: 'string' } } }),
          },
          '404': { description: 'Entry not found', content: { 'application/json': { schema: errorRef } } },
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
          content: { 'application/json': { schema: { type: 'object', properties: { diary: { type: 'string' } } } } },
        },
        responses: {
          '200': {
            description: 'Diary updated',
            ...jsonEnvelope({ type: 'object', properties: { message: { type: 'string' } } }),
          },
          '404': { description: 'Entry not found', content: { 'application/json': { schema: errorRef } } },
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
            ...jsonEnvelope({ type: 'array', items: { $ref: '#/components/schemas/WorkoutResult' } }),
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
            ...jsonEnvelope({ type: 'array', items: { $ref: '#/components/schemas/DailyEntry' } }),
          },
          '404': { description: 'Week not found', content: { 'application/json': { schema: errorRef } } },
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
            ...jsonEnvelope({ type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } }),
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Links,
      ErrorResponse,
      Track,
      Running,
      WorkoutResult,
      Workout,
      DailyEntry,
      DailyEntryInput,
      DailyEntryUpdate,
      Stats,
    },
  },
};
