import * as z from 'zod';

// --- Response schemas ---

const ZSchedule = z.enum(['regular', 'adhoc', 'legacy', 'void']);

export type Schedule = z.infer<typeof ZSchedule>;

export const ZTrack = z.object({
  id: z.string(),
  name: z.string(),
  length: z.number().meta({ description: 'Track distance' }),
  url: z.url(),
  progressUnit: z.enum(['km', 'flight', 'pole']),
}).meta({ id: 'Track' });

export type Track = z.infer<typeof ZTrack>;

export const ZRunning = z.object({
  schedule: ZSchedule,
  track: ZTrack.nullable(),
  progress: z.string().nullable(),
  performance: z.int().min(0).max(5).nullable(),
}).meta({ id: 'Running' });

export type Running = z.infer<typeof ZRunning>;

export const ZWorkoutResult = z.object({
  exercise: z.string(),
  execution: z.string(),
  volume: z.string(),
}).meta({ id: 'WorkoutResult' });

export type WorkoutResult = z.infer<typeof ZWorkoutResult>;

export const ZWorkout = z.object({
  schedule: ZSchedule,
  routine: z.string().optional(),
  results: z.array(ZWorkoutResult).optional(),
}).meta({ id: 'Workout' });

export type Workout = z.infer<typeof ZWorkout>;

export const ZDailyEntry = z.object({
  date: z.string().meta({ format: 'date' }),
  week: z.string().meta({ description: 'ISO week as YYYY-WW' }),
  year: z.int(),
  month: z.enum(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']),
  day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  running: ZRunning,
  workout: ZWorkout,
  weight: z.number().nullable().optional(),
  lastMeal: z.string().nullable().optional(),
  stretching: z.string().nullable().optional(),
  stairs: z.string().nullable().optional(),
  diary: z.string().nullable().optional(),
}).meta({ id: 'DailyEntry' });

export type DailyEntry = z.infer<typeof ZDailyEntry>;

export const ZDailyEntryUpdate = z.object({
  weight: z.number().nullable().optional(),
  lastMeal: z.string().nullable().optional(),
  stretching: z.string().nullable().optional(),
  stairs: z.string().nullable().optional(),
  diary: z.string().nullable().optional(),
}).meta({ id: 'DailyEntryUpdate' });

export type DailyEntryUpdate = z.infer<typeof ZDailyEntryUpdate>;

export const ZStats = z.object({
  bestRunningStreak: z.object({ count: z.int(), distance: z.number() }),
  currentRunningStreak: z.object({ count: z.int(), distance: z.number() }),
  total: z.object({ count: z.int(), distance: z.number() }),
}).meta({ id: 'Stats' });

export const ZLinks = z.object({
  self: z.string(),
}).catchall(z.string()).meta({ id: 'Links' });

export const ZErrorResponse = z.object({
  error: z.string(),
  details: z.array(z.string()).optional(),
}).meta({ id: 'ErrorResponse' });

export interface WorkoutInput {
  schedule: Schedule;
  routine?: string;
  results?: string[];
}

// --- Input schemas ---

const ZRunningInput = z.strictObject({
  schedule: ZSchedule,
  trackId: z.string().optional(),
  progress: z.string().optional(),
  performance: z.number().min(0).max(4).optional(),
}).meta({ id: 'RunningInput' });

export type RunningInput = z.infer<typeof ZRunningInput>;

export const ZDailyEntryInput = z.strictObject({
  date: z.iso.date().optional().meta({ description: 'Defaults to today if omitted' }),
  running: ZRunningInput.optional(),
  workout: z.object({
    schedule: ZSchedule,
    routine: z.string().optional(),
    results: z.array(z.string()).optional().meta({
      description: 'Format: "exercise/execution volume", e.g. "squats/set3x 22+22+22"',
    }),
  }).optional(),
  weight: z.number().nullable().optional(),
  lastMeal: z.string().nullable().optional(),
  stretching: z.string().nullable().optional(),
  stairs: z.string().nullable().optional(),
  diary: z.string().nullable().optional(),
}).meta({ id: 'DailyEntryInput' });

export type DailyEntryInput = z.infer<typeof ZDailyEntryInput>;

export const ZDailyYamlInput = z.strictObject({
  date: z.string().optional(),
  run: z.string().optional(),
  workout: z.string().optional(),
  results: z.array(z.string()).optional(),
  weight: z.number().nullable().optional(),
  lastMeal: z.string().nullable().optional(),
  stretching: z.string().nullable().optional(),
  stairs: z.string().nullable().optional(),
  diary: z.string().nullable().optional(),
}).meta({ id: 'DailyYamlInput' });

export type DailyYamlInput = z.infer<typeof ZDailyYamlInput>;

export interface WeekSummary {
  week: string;
  regularRuns: number;
  regularWorkouts: number;
  diaryEntries: number;
  entries: DailyEntry[];
}
