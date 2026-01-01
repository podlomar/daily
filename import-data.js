import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import Database from 'better-sqlite3';
import dayjs from 'dayjs';

const dbPath = path.join(process.cwd(), 'db.local.sqlite');
const db = new Database(dbPath);

const slugify = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const importData = (fileName, startDate) => {
  let currentDate = dayjs(startDate);
  const week = Number(fileName.split('-')[1].substring(0, 2));
  const yamlPath = path.join(process.cwd(), fileName);
  const fileContents = fs.readFileSync(yamlPath, 'utf8');
  const data = yaml.load(fileContents);

  console.log(`Loading ${data.length} daily entries...`);

  const insertEntry = db.prepare(`
    INSERT OR REPLACE INTO daily_entries (
      date, week, day, running_schedule, track_id,
      running_progress, running_performance,
      workout_schedule, workout_routine,
      weight, last_meal, stretching, stairs, diary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWorkoutResult = db.prepare(`
    INSERT INTO workout_results (daily_entry_date, exercise_name, reps, holds)
    VALUES (?, ?, ?, ?)
  `);

  const getTrack = db.prepare(`
    SELECT id FROM running_tracks WHERE id = ?
  `);

  const insertTrack = db.prepare(`
    INSERT INTO running_tracks (id, name, length, url, progress_unit)
    VALUES (?, ?, ?, ?, ?)
  `);

  let imported = 0;
  let skipped = 0;

  for (const entry of data.toReversed()) {
    const currentDateStr = currentDate.format('YYYY-MM-DD');
    if (entry.date !== currentDateStr) {
      throw new Error(`Date mismatch: expected ${currentDateStr}, got ${entry.date} at file ${fileName}`);
    }

    try {
      // Handle running data
      let runningSchedule = null;
      let trackId = null;
      let runningProgress = null;
      let runningPerformance = null;

      if (entry.running === 'rest') {
        runningSchedule = 'adhoc';
        runningProgress = 'rest';
      } else {
        const track = entry.running.track;
        trackId = slugify(track.name);

        // Ensure the track exists in the database
        const existingTrack = getTrack.get(trackId);
        if (!existingTrack) {
          insertTrack.run(
            trackId,
            track.name,
            track.length,
            track.url,
            track.progressUnit
          );
        }

        runningProgress = typeof entry.running.progress === 'number'
          ? entry.running.progress.toString()
          : entry.running.progress;
        runningPerformance = entry.running.performance === 'none' ? null : entry.running.performance;
        runningSchedule = entry.running.track.type ?? 'legacy';

        if (runningSchedule !== 'regular' && runningSchedule !== 'adhoc' && runningSchedule !== 'legacy') {
          throw new Error(`Invalid running schedule type: ${runningSchedule}`);
        }
      }

      // Handle weight (convert "none" to null)
      const weight = entry.weight === 'none' || entry.weight === undefined ? null : entry.weight;

      // Convert boolean to integer for SQLite

      let stretching = 0;
      let workoutSchedule = null;
      let workoutRoutine = null;
      let entryStairs = null;

      if (entry.stretching === false) {
        stretching = null;
      } else if (entry.stretching === true) {
        stretching = 'legacy';
      } else if (entry.stretching === 'none') {
        stretching = null;
      }

      if (entry.workout === 'rest') {
        workoutSchedule = 'adhoc';
        workoutRoutine = 'rest';
      } else {
        if (entry.workout.type === undefined) {
          workoutSchedule = 'legacy';
        } else {
          workoutSchedule = entry.workout.type === 'predefined' ? 'regular' : 'adhoc';
        }

        if (entry.workout.routine === undefined) {
          throw new Error('Workout routine is required');
        }

        workoutRoutine = entry.workout.routine;
      }

      if (entry.stairs === 'none' || entry.stairs === 'away') {
        entryStairs = entry.stairs;
      } else if (typeof entry.stairs === 'object') {
        entryStairs = `${entry.stairs.floors}/${entry.stairs.time}`;
      } else {
        throw new Error(`Invalid stairs entry: ${entry.stairs}`);
      }

      // Insert daily entry 
      insertEntry.run(
        entry.date,
        week,
        currentDate.format('ddd').toLowerCase(),
        runningSchedule,
        trackId,
        runningProgress,
        runningPerformance,
        workoutSchedule,
        workoutRoutine,
        weight,
        entry.lastMeal ?? null,
        stretching,
        entryStairs,
        entry.diary ?? null
      );

      // Insert workout results
      if (entry.workout?.results) {
        for (const result of entry.workout.results) {
          insertWorkoutResult.run(
            entry.date,
            result.id,
            result.reps ?? null,
            result.holds ?? null
          );
        }
      }

      imported++;
      currentDate = currentDate.add(1, 'day');
    } catch (error) {
      console.error(`Error importing entry for ${entry.date}:`, error);
      skipped++;
    }
  }

  console.log(`Import complete: ${imported} entries imported, ${skipped} skipped`);

  return currentDate.format('YYYY-MM-DD');
};

// List files in the data directory
const dataDir = path.join(process.cwd(), 'data');
const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.yml'));

let currentDate = '2025-07-17';
for (const file of files) {
  const filePath = path.join('data.local', file);
  console.log(`Importing data from ${filePath}...`);
  currentDate = importData(filePath, currentDate);
}

