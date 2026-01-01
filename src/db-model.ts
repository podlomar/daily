export interface Track {
  id: string;
  name: string;
  length: number;
  url: string;
  progressUnit: string;
}

export interface Running {
  schedule: 'regular' | 'adhoc' | 'legacy';
  track: Track | null;
  progress: string;
  performance: number | null;
}

export interface Workout {
  schedule: 'regular' | 'adhoc' | 'legacy';
  routine: string | null;
}

export interface DailyEntry {
  date: string;
  week: number;
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  running: Running;
  workout: Workout;
  weight: number | null;
  lastMeal: string | null;
  stretching: string | null;
  stairs: string | null;
  diary: string | null;
}
