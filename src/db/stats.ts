import * as z from 'zod';
import { db } from './connection.js';

export const ZStats = z.object({
  bestRunningStreak: z.object({ count: z.int(), distance: z.number() }),
  currentRunningStreak: z.object({ count: z.int(), distance: z.number() }),
  total: z.object({ count: z.int(), distance: z.number() }),
}).meta({ id: 'Stats' });

export type Stats = z.infer<typeof ZStats>;

export const collectStats = (): Stats => {
  const stmt = db.prepare(`
    SELECT de.track_id, de.date, rt.length, rt.progress_unit, de.running_progress
    FROM daily_entries de
    LEFT JOIN running_tracks rt ON de.track_id = rt.id
    ORDER BY de.date ASC
  `);

  let currentStreak = { count: 0, distance: 0 };
  let bestStreak = { count: 0, distance: 0 };
  let total = { count: 0, distance: 0 };

  for (const row of stmt.iterate()) {
    const r = row as any;
    const trackId: string | null = r.track_id;

    if (trackId === null) {
      if (currentStreak.count > bestStreak.count) {
        bestStreak = currentStreak;
      }
      currentStreak = { count: 0, distance: 0 };
    } else {
      let distance = 0;
      if (r.progress_unit === 'km' && r.running_progress !== 'full') {
        distance = Number(r.running_progress);
      } else {
        distance = r.length;
      }
      currentStreak.count += 1;
      currentStreak.distance += distance;
      total.count += 1;
      total.distance += distance;
    }
  }

  if (currentStreak.count > bestStreak.count) {
    bestStreak = currentStreak;
  }

  bestStreak.distance = Math.round(bestStreak.distance * 10) / 10;
  currentStreak.distance = Math.round(currentStreak.distance * 10) / 10;
  total.distance = Math.round(total.distance * 10) / 10;

  return {
    bestRunningStreak: bestStreak,
    currentRunningStreak: currentStreak,
    total,
  };
};
