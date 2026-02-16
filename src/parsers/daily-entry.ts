import { Result } from 'monadix/result';
import { ZDailyEntryInput, ZDailyYamlInput, type DailyEntryInput, type RunningInput } from '../db/entries.js';
import type { WorkoutInput } from '../db/workouts.js';

export const parseDailyEntryYaml = (input: unknown): Result<DailyEntryInput, string[]> => {
  console.log('Parsing daily entry input from YAML data:', input);
  const parsedInput = ZDailyYamlInput.safeParse(input);
  if (!parsedInput.success) {
    const err = parsedInput.error.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`);
    return Result.fail(err);
  }

  const { data } = parsedInput;

  let runningInput: RunningInput | null = null;
  if (data.run !== undefined) {
    const runParts = data.run.split(' ');
    if (runParts.length === 4) {
      runningInput = {
        schedule: runParts[0] as RunningInput['schedule'],
        trackId: runParts[1],
        progress: runParts[2],
        performance: Number(runParts[3]),
      };
    }
  }

  let workout: WorkoutInput | null = null;
  if (data.workout !== undefined) {
    const workoutParts = data.workout.split(' ');
    if (workoutParts.length === 2) {
      workout = {
        schedule: workoutParts[0] as WorkoutInput['schedule'],
        routine: workoutParts[1],
        results: data.results,
      };
    }
  }

  const entryInput: DailyEntryInput = {
    date: data.date,
    running: runningInput ?? undefined,
    workout: workout ?? undefined,
    weight: data.weight,
    lastMeal: data.lastMeal,
    stretching: data.stretching,
    stairs: data.stairs,
    diary: data.diary,
  };

  return Result.success(entryInput);
};

export const parseDailyEntryJson = (input: unknown): Result<DailyEntryInput, string[]> => {
  const parsedInput = ZDailyEntryInput.safeParse(input);
  if (!parsedInput.success) {
    const err = parsedInput.error.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`);
    return Result.fail(err);
  }

  return Result.success(parsedInput.data);
};
