export interface Track {
  id: string;
  name: string;
  length: number;
  url: string;
  progressUnit: string;
}

export type Schedule = 'regular' | 'adhoc' | 'legacy';

export interface Running {
  schedule: Schedule;
  track: Track | null;
  progress: string;
  performance: number | null;
}

export interface WorkoutResult {
  exercise: string;
  reps: string | null;
  holds: string | null;
}

export interface Workout {
  schedule: Schedule;
  routine: string | null;
  results: WorkoutResult[];
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

export interface DailyEntryInit {
  date?: string;
  running?: {
    schedule: Schedule;
    trackId: string | null;
    progress: string;
    performance: number | null;
  };
  workout?: Workout;
  weight?: number;
  lastMeal?: string;
  stretching?: string;
  stairs?: string;
  diary?: string;
}

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
