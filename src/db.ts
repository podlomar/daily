import { create } from 'node:domain';
import { initializeDatabase } from './db-init.js';
import type { DailyEntry, DailyEntryInit, DailyEntryUpdate, Running, Track, WeekSummary, WorkoutResult } from './db-model.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';

dayjs.extend(isoWeek);

const db = initializeDatabase();

const rowToTrack = (row: any): Track => ({
  id: row.id,
  name: row.name,
  length: row.length,
  url: row.url,
  progressUnit: row.progress_unit
});

const rowToWorkoutResult = (row: any) => ({
  exercise: row.exercise,
  reps: row.reps ?? undefined,
  holds: row.holds ?? undefined
});

const rowToDailyEntry = (row: any, workoutResults?: any[]): DailyEntry => {
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

export const getAllTracks = (): Track[] => {
  const stmt = db.prepare('SELECT * FROM running_tracks');
  return stmt.all().map(rowToTrack);
};

export const getTrackById = (id: string): Track | null => {
  const stmt = db.prepare('SELECT * FROM running_tracks WHERE id = ?');
  const row = stmt.get(id);
  return row ? rowToTrack(row) : null;
};

export const createTrack = (track: Track): void => {
  const stmt = db.prepare(`
    INSERT INTO running_tracks (id, name, length, url, progress_unit)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(track.id, track.name, track.length, track.url, track.progressUnit);
};

export const getAllDialyEntries = (): DailyEntry[] => {
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

  // Fetch all workout results in one query
  const resultsStmt = db.prepare(`
    SELECT daily_entry_date, exercise, reps, holds
    FROM workout_results
    ORDER BY daily_entry_date
  `);
  const allResults = resultsStmt.all();

  // Group results by date
  const resultsByDate = new Map<string, any[]>();
  for (const result of allResults) {
    const r = result as any;
    const date = r.daily_entry_date;
    if (!resultsByDate.has(date)) {
      resultsByDate.set(date, []);
    }
    resultsByDate.get(date)!.push(rowToWorkoutResult(r));
  }

  // Create entries with workout results
  return rows.map((row: any) => {
    const results = resultsByDate.get(row.date) || [];
    return rowToDailyEntry(row, results);
  });
};

export const getDailyEntryByDate = (date: string): DailyEntry | null => {
  let queryDate = date;

  if (date === 'today') {
    queryDate = dayjs().format('YYYY-MM-DD');
  }

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

  // Fetch workout results
  const resultsStmt = db.prepare(`
    SELECT exercise, reps, holds
    FROM workout_results
    WHERE daily_entry_date = ?
  `);
  const results = resultsStmt.all(queryDate).map(rowToWorkoutResult);

  return rowToDailyEntry(row, results);
};

export const getWorkoutResultsByDate = (date: string): WorkoutResult[] => {
  const queryDate = date === 'today' ? dayjs().format('YYYY-MM-DD') : date;
  const stmt = db.prepare(`
    SELECT exercise, reps, holds
    FROM workout_results
    WHERE daily_entry_date = ?
  `);
  return stmt.all(queryDate).map(rowToWorkoutResult);
};

export const createWorkoutResults = (date: string, results: WorkoutResult[]): void => {
  const stmt = db.prepare(`
    INSERT INTO workout_results (daily_entry_date, exercise, reps, holds)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((results: WorkoutResult[]) => {
    for (const result of results) {
      stmt.run(date, result.exercise, result.reps ?? null, result.holds ?? null);
    }
  });

  insertMany(results);
};

export const createDailyEntry = (entryInit: DailyEntryInit): void => {
  const stmt = db.prepare(`
    INSERT INTO daily_entries
    (date, week, year, month, day, track_id, running_schedule, running_progress, running_performance,
     workout_schedule, workout_routine, weight, last_meal, stretching, stairs, diary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const date = entryInit.date ?? dayjs().format('YYYY-MM-DD');
  const week = `${dayjs(date).isoWeekYear()}-${String(dayjs(date).isoWeek()).padStart(2, '0')}`;
  const month = dayjs(date).format('MMM').toLowerCase();
  const day = dayjs(date).format('ddd').toLowerCase();
  const running = entryInit.running ?? {
    schedule: 'adhoc',
    trackId: null,
    progress: null,
    performance: null
  };

  if (running.trackId !== null) {
    const track = getTrackById(running.trackId);
    if (!track) {
      throw new Error(`Track with id ${running.trackId} does not exist`);
    }
  }

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
    entryInit.workout?.schedule ?? 'adhoc',
    entryInit.workout?.routine ?? 'rest',
    entryInit.weight ?? null,
    entryInit.lastMeal ?? null,
    entryInit.stretching ?? null,
    entryInit.stairs ?? null,
    entryInit.diary ?? null
  );

  if (entryInit.workout !== undefined && entryInit.workout.results.length > 0) {
    createWorkoutResults(date, entryInit.workout.results);
  }
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

export const getWeekSummary = (week: string): WeekSummary | null => {
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

  // Fetch workout results for this week
  const resultsStmt = db.prepare(`
    SELECT wr.daily_entry_date, wr.exercise, wr.reps, wr.holds
    FROM workout_results wr
    JOIN daily_entries de ON wr.daily_entry_date = de.date
    WHERE de.week = ?
    ORDER BY wr.daily_entry_date
  `);
  const allResults = resultsStmt.all(week);

  // Group results by date
  const resultsByDate = new Map<string, any[]>();
  for (const result of allResults) {
    const r = result as any;
    const date = r.daily_entry_date;
    if (!resultsByDate.has(date)) {
      resultsByDate.set(date, []);
    }
    resultsByDate.get(date)!.push(rowToWorkoutResult(r));
  }

  let regularRuns = 0;
  let regularWorkouts = 0;
  let diaryEntries = 0;

  const entries: DailyEntry[] = [];
  for (const row of rows) {
    const r = row as any;
    const results = resultsByDate.get(r.date) || [];
    const entry = rowToDailyEntry(r, results);

    entries.push(entry);
    if (entry.running.schedule === 'regular') {
      regularRuns += 1;
    }
    if (entry.workout.schedule === 'regular') {
      regularWorkouts += 1;
    }
    if (entry.diary) {
      diaryEntries += 1;
    }
  }

  return {
    week,
    regularRuns,
    regularWorkouts,
    diaryEntries,
    entries,
  };
}
