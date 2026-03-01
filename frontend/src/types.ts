export type Schedule = 'regular' | 'adhoc' | 'legacy' | 'void';

export interface Track {
  id: string;
  name: string;
  length: number;
  url: string;
  progressUnit: 'km' | 'flight' | 'pole';
  lastUsed: string | null;
}

export interface Running {
  schedule: Schedule | null;
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
  schedule: Schedule | null;
  routine: string | null;
  results: WorkoutResult[];
}

export interface DailyEntry {
  date: string;
  week: string;
  year: number;
  month: string;
  day: string;
  running: Running;
  workout: Workout;
  weight: number | null;
  lastMeal: string | null;
  stretching: string | null;
  stairs: string | null;
  diary: string | null;
}

export interface Stats {
  bestRunningStreak: { count: number; distance: number };
  currentRunningStreak: { count: number; distance: number };
  total: { count: number; distance: number };
}

export interface Meal {
  id: string;
  name: string;
  kcal: number;
  ingredients: { id: string; name: string; quantity: string; kcal: number }[];
}

export interface Todo {
  id: string;
  text: string;
  createdAt: string;
  done: boolean;
}

export interface ApiEnvelope<T> {
  links: { self: string; previous?: string; next?: string };
  result: T;
}
