import * as z from 'zod';
import { db } from './connection.js';
import { getTrackById, ZRunning } from './tracks.js';
import { createWorkoutResults, validateWorkout, ZWorkout, type WorkoutInput, type WorkoutResult } from './workouts.js';
import { ZSchedule } from './schema.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import { Result } from 'monadix/result';

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

dayjs.extend(isoWeek);

const rowToWorkoutResult = (row: any): WorkoutResult => ({
  exercise: row.exercise,
  execution: row.execution,
  volume: row.volume,
});

const rowToDailyEntry = (row: any, workoutResults?: WorkoutResult[]): DailyEntry => {
  const track = row.track_id ? {
    id: row.track_id,
    name: row.track_name,
    length: row.track_length,
    url: row.track_url,
    progressUnit: row.track_progress_unit
  } : null;

  const workout: any = {
    schedule: row.workout_schedule,
    routine: row.workout_routine
  };

  if (workoutResults && workoutResults.length > 0) {
    workout.results = workoutResults;
  }

  return {
    date: row.date,
    week: row.week,
    year: row.year,
    month: row.month,
    day: row.day,
    running: {
      schedule: row.running_schedule,
      track: track,
      progress: row.running_progress,
      performance: row.running_performance
    },
    workout,
    weight: row.weight,
    lastMeal: row.last_meal,
    stretching: row.stretching,
    stairs: row.stairs,
    diary: row.diary
  };
};

export const getAllDailyEntries = (): DailyEntry[] => {
  const stmt = db.prepare(`
    SELECT
      de.*,
      rt.id as track_id,
      rt.name as track_name,
      rt.length as track_length,
      rt.url as track_url,
      rt.progress_unit as track_progress_unit
    FROM daily_entries de
    LEFT JOIN running_tracks rt ON de.track_id = rt.id
    ORDER BY de.date DESC
  `);
  const rows = stmt.all();

  const resultsStmt = db.prepare(`
    SELECT daily_entry_date, exercise, execution, volume
    FROM workout_results
    ORDER BY daily_entry_date
  `);
  const allResults = resultsStmt.all();

  const resultsByDate = new Map<string, WorkoutResult[]>();
  for (const result of allResults) {
    const r = result as any;
    const date = r.daily_entry_date;
    if (!resultsByDate.has(date)) {
      resultsByDate.set(date, []);
    }
    resultsByDate.get(date)!.push(rowToWorkoutResult(r));
  }

  return rows.map((row: any) => {
    const results = resultsByDate.get(row.date) || [];
    return rowToDailyEntry(row, results);
  });
};

export const getDailyEntryByDate = (date: string): DailyEntry | null => {
  const queryDate = date === 'today' ? dayjs().format('YYYY-MM-DD') : date;

  const stmt = db.prepare(`
    SELECT
      de.*,
      rt.id as track_id,
      rt.name as track_name,
      rt.length as track_length,
      rt.url as track_url,
      rt.progress_unit as track_progress_unit
    FROM daily_entries de
    LEFT JOIN running_tracks rt ON de.track_id = rt.id
    WHERE de.date = ?
  `);
  const row = stmt.get(queryDate);
  if (!row) {
    return null;
  }

  const resultsStmt = db.prepare(`
    SELECT exercise, execution, volume
    FROM workout_results
    WHERE daily_entry_date = ?
  `);
  const results = resultsStmt.all(queryDate).map(rowToWorkoutResult);

  return rowToDailyEntry(row, results);
};

export const createDailyEntry = (input: DailyEntryInput): Result<string[], string[]> => {
  const stmt = db.prepare(`
    INSERT INTO daily_entries
    (date, week, year, month, day, track_id, running_schedule, running_progress, running_performance,
     workout_schedule, workout_routine, weight, last_meal, stretching, stairs, diary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const date = input.date ?? dayjs().format('YYYY-MM-DD');
  const week = `${dayjs(date).isoWeekYear()}-${String(dayjs(date).isoWeek()).padStart(2, '0')}`;
  const month = dayjs(date).format('MMM').toLowerCase();
  const day = dayjs(date).format('ddd').toLowerCase();
  const running: RunningInput = input.running ?? { schedule: 'void' };

  if (running.trackId !== undefined) {
    const track = getTrackById(running.trackId);
    if (!track) {
      return Result.fail([`Running track with ID ${running.trackId} does not exist`]);
    }
  }

  const workout: WorkoutInput = input.workout ?? { schedule: 'void' };
  const workoutValidation = validateWorkout(workout);
  if (workoutValidation.isFail()) {
    return Result.fail(workoutValidation.err());
  }

  const report: string[] = [];

  try {
    stmt.run(
      date,
      week,
      dayjs(date).year(),
      month,
      day,
      running.trackId,
      running.schedule,
      running.progress,
      running.performance,
      input.workout?.schedule ?? 'adhoc',
      input.workout?.routine ?? 'rest',
      input.weight ?? null,
      input.lastMeal ?? null,
      input.stretching ?? null,
      input.stairs ?? null,
      input.diary ?? null
    );

    if (
      input.workout !== undefined
      && input.workout.routine !== 'rest'
      && input.workout.results !== undefined
      && input.workout.results.length > 0
    ) {
      const count = createWorkoutResults(date, input.workout.results);
      report.push(`Recorded ${count} workout results`);
    } else {
      report.push('No workout results to record');
    }
  } catch (error) {
    return Result.fail([`Failed to create daily entry: ${(error as Error).message}`]);
  }

  return Result.success(report);
};

export const updateDailyEntry = (date: string, entryUpdate: DailyEntryUpdate): boolean => {
  const updates: string[] = [];
  const values: any[] = [];

  if (entryUpdate.weight !== undefined) {
    updates.push('weight = ?');
    values.push(entryUpdate.weight);
  }
  if (entryUpdate.lastMeal !== undefined) {
    updates.push('last_meal = ?');
    values.push(entryUpdate.lastMeal);
  }
  if (entryUpdate.stretching !== undefined) {
    updates.push('stretching = ?');
    values.push(entryUpdate.stretching);
  }
  if (entryUpdate.stairs !== undefined) {
    updates.push('stairs = ?');
    values.push(entryUpdate.stairs);
  }
  if (entryUpdate.diary !== undefined) {
    updates.push('diary = ?');
    values.push(entryUpdate.diary);
  }

  console.log(`Updating daily entry for ${date} with:`, entryUpdate);

  if (updates.length === 0) {
    return false;
  }

  const queryDate = date === 'today' ? dayjs().format('YYYY-MM-DD') : date;
  values.push(queryDate);

  const stmt = db.prepare(`
    UPDATE daily_entries
    SET ${updates.join(', ')}
    WHERE date = ?
  `);
  const info = stmt.run(...values);
  console.log(`Updated daily entry for ${queryDate}:`, entryUpdate, 'Changes:', info.changes);
  return info.changes > 0;
};

export const buildDiary = (): string => {
  const stmt = db.prepare('SELECT date, diary FROM daily_entries WHERE diary IS NOT NULL ORDER BY date ASC');

  let result = '';
  for (const row of stmt.iterate()) {
    const r = row as { date: string; diary: string };
    result += `${dayjs(r.date).toString()}\n${r.diary}\n\n`;
  }
  return result.trim();
};

export const getWeekSummary = (week: string): DailyEntry[] | null => {
  const stmt = db.prepare(`
    SELECT
      de.*,
      rt.id as track_id,
      rt.name as track_name,
      rt.length as track_length,
      rt.url as track_url,
      rt.progress_unit as track_progress_unit
    FROM daily_entries de
    LEFT JOIN running_tracks rt ON de.track_id = rt.id
    WHERE de.week = ?
  `);

  const rows = stmt.all(week);
  if (rows.length === 0) {
    return null;
  }

  const resultsStmt = db.prepare(`
    SELECT wr.daily_entry_date, wr.exercise, wr.execution, wr.volume
    FROM workout_results wr
    JOIN daily_entries de ON wr.daily_entry_date = de.date
    WHERE de.week = ?
    ORDER BY wr.daily_entry_date
  `);
  const allResults = resultsStmt.all(week);

  const resultsByDate = new Map<string, WorkoutResult[]>();
  for (const result of allResults) {
    const r = result as any;
    const date = r.daily_entry_date;
    if (!resultsByDate.has(date)) {
      resultsByDate.set(date, []);
    }
    resultsByDate.get(date)!.push(rowToWorkoutResult(r));
  }

  return rows.map((row: any) => {
    const results = resultsByDate.get(row.date) || [];
    return rowToDailyEntry(row, results);
  });
};
