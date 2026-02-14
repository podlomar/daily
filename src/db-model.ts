import * as z from 'zod';

export interface Track {
  id: string;
  name: string;
  length: number;
  url: string;
  progressUnit: string;
}

export type Schedule = 'regular' | 'adhoc' | 'legacy' | 'void';

export interface Running {
  schedule: Schedule;
  track: Track | null;
  progress: string | null;
  performance: number | null;
}

export interface WorkoutResult {
  exercise: string;
  execution: string;
  volume: string;
}

export interface Workout {
  schedule: Schedule;
  routine?: string;
  results?: string[];
}

export interface DailyEntry {
  date: string;
  week: string;
  year: number;
  month: 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  running: Running;
  workout: Workout;
  weight: number | null;
  lastMeal: string | null;
  stretching: string | null;
  stairs: string | null;
  diary: string | null;
}

const RunningInput = z.strictObject({
  schedule: z.enum(['regular', 'adhoc', 'legacy', 'void']),
  trackId: z.string().optional(),
  progress: z.string().optional(),
  performance: z.number().min(0).max(4).optional(),
});

export type RunningInput = z.infer<typeof RunningInput>;

export const ZDailyEntryInput = z.strictObject({
  date: z.iso.date().optional(),
  running: RunningInput.optional(),
  workout: z.object({
    schedule: z.enum(['regular', 'adhoc', 'legacy', 'void']),
    routine: z.string().optional(),
    results: z.array(z.string()).optional(),
  }).optional(),
  weight: z.number().nullable().optional(),
  lastMeal: z.string().nullable().optional(),
  stretching: z.string().nullable().optional(),
  stairs: z.string().nullable().optional(),
  diary: z.string().nullable().optional(),
});

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
});

export type DailyYamlInput = z.infer<typeof ZDailyYamlInput>;

export interface DailyEntryUpdate {
  weight?: number | null;
  lastMeal?: string | null;
  stretching?: string | null;
  stairs?: string | null;
  diary?: string | null;
}

export interface WeekSummary {
  week: string;
  regularRuns: number;
  regularWorkouts: number;
  diaryEntries: number;
  entries: DailyEntry[];
}
