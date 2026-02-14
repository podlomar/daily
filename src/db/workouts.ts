import { db } from './connection.js';
import type { Workout, WorkoutResult } from '../db-model.js';
import { Result } from 'monadix/result';

export interface Exercise {
  name: string;
  regexp: RegExp;
}

const executionToRegExp = (execution: string): RegExp => {
  if (execution === 'set3x') {
    return /^(\d+)(\+\d+){2}$/;
  }
  if (execution === 'hold3x') {
    return /^(\d+s)(\+\d+s){2}$/;
  }
  if (execution === 'maxset') {
    return /^\d+$/;
  }
  if (execution === 'maxhold') {
    return /^\d+s$/;
  }

  throw new Error(`Unknown execution type: ${execution}`);
};

const rowToWorkoutResult = (row: any): WorkoutResult => ({
  exercise: row.exercise,
  execution: row.execution,
  volume: row.volume,
});

export const getExercises = (): Exercise[] => {
  const stmt = db.prepare('SELECT name FROM exercises');
  const rows = stmt.all().map((row: any) => ({
    name: row.name,
    regexp: executionToRegExp(row.name.split('/')[1]),
  }));
  return rows;
};

export const validateWorkout = (workout: Workout): Result<void, string[]> => {
  const errors: string[] = [];
  const exercises = getExercises();
  const results = workout.results ?? [];

  for (const result of results) {
    const parts = result.split(' ');
    if (parts.length !== 2) {
      errors.push(`Invalid workout result format: ${result}`);
      continue;
    }

    const [exerciseId, volume] = parts;
    const exercise = exercises.find(e => e.name === exerciseId);
    if (!exercise) {
      errors.push(`Unknown exercise/execution: ${exerciseId}`);
      continue;
    }

    if (!exercise.regexp.test(volume)) {
      errors.push(`Invalid volume format for ${exerciseId}: ${volume}`);
    }
  }

  if (errors.length > 0) {
    return Result.fail(errors);
  }

  return Result.success(undefined);
};

export const getWorkoutResultsByDate = (date: string): WorkoutResult[] => {
  const stmt = db.prepare(`
    SELECT exercise, execution, volume
    FROM workout_results
    WHERE daily_entry_date = ?
  `);
  return stmt.all(date).map(rowToWorkoutResult);
};

export const createWorkoutResults = (date: string, results: string[]): number => {
  const stmt = db.prepare(`
    INSERT INTO workout_results (daily_entry_date, exercise, execution, volume)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((results: string[]) => {
    for (const result of results) {
      const [exercise, execution, volume] = result.split(' ');
      stmt.run(date, exercise, execution, volume);
    }
  });

  insertMany(results);
  return results.length;
};

const parseHolds = (holds: string): number[] => {
  return holds.split('+').map(h => parseInt(h.replace('s', ''), 10));
};

const parseReps = (reps: string): number[] => {
  return reps.split('+').map(r => parseInt(r, 10));
};

export const workoutsSummary = (): Record<string, number[]> => {
  const stmt = db.prepare(`
    SELECT *
    FROM workout_results
    ORDER BY daily_entry_date ASC
  `);
  const results = stmt.all().map(rowToWorkoutResult);

  const exercises: Record<string, number[]> = {};

  for (const result of results) {
    const exercise = `${result.exercise}/${result.execution}`;
    let values = exercises[exercise];
    if (values === undefined) {
      values = [];
      exercises[exercise] = values;
    }

    if (result.execution.startsWith('set')) {
      const parsedReps = parseReps(result.volume);
      const averageReps = Math.round(parsedReps.reduce((a, b) => a + b, 0) / parsedReps.length);
      values.push(averageReps);
    } else if (result.execution.startsWith('hold')) {
      const parsedHolds = parseHolds(result.volume);
      const averageHolds = Math.round(parsedHolds.reduce((a, b) => a + b, 0) / parsedHolds.length);
      values.push(averageHolds);
    } else if (result.execution === 'maxset') {
      const maxReps = parseInt(result.volume, 10);
      values.push(maxReps);
    } else if (result.execution === 'maxhold') {
      const maxHold = parseInt(result.volume.replace('s', ''), 10);
      values.push(maxHold);
    }
  }

  return exercises;
};
