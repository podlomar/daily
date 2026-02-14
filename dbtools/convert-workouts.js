import Database from 'better-sqlite3';

const db = new Database('./db.local.sqlite', { readonly: true });

const rows = db.prepare('SELECT * FROM workout_results').all();

const set3x = ['kneePushUps', 'squats', 'ringRows'];
const hold3x = ['sidePlanks', 'gluteBridges'];
const hold1x = ['frontPlank', 'barHang', 'ringsHold'];

const parseReps = (repsStr) => {
  return repsStr
    .split('+')
    .map(part => parseInt(part.trim(), 10))
    .filter(num => !isNaN(num));
};

const parseHolds = (holdsStr) => {
  return holdsStr
    .split('+')
    .map(part => {
      const match = part.trim().match(/(\d+)s/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(num => num !== null);
};

for (const row of rows) {
  if (set3x.includes(row.exercise)) {
    if (row.reps === null || row.reps === undefined) {
      throw new Error(`Missing reps for ${row.exercise} on ${row.daily_entry_date}`);
    }
    const reps = parseReps(row.reps);
    if (reps.length === 1) {
      console.log(`INSERT INTO workout_results_new (daily_entry_date, exercise, execution, volume) VALUES ('${row.daily_entry_date}', '${row.exercise}', 'set3x', '${reps[0]}+0+0');`);
    } else if (reps.length === 2) {
      console.log(`INSERT INTO workout_results_new (daily_entry_date, exercise, execution, volume) VALUES ('${row.daily_entry_date}', '${row.exercise}', 'set3x', '${reps[0]}+${reps[1]}+0');`);
    } else if (reps.length === 3) {
      console.log(`INSERT INTO workout_results_new (daily_entry_date, exercise, execution, volume) VALUES ('${row.daily_entry_date}', '${row.exercise}', 'set3x', '${reps[0]}+${reps[1]}+${reps[2]}');`);
    } else {
      throw new Error(`Unexpected number of reps for ${row.exercise} on ${row.daily_entry_date}: ${reps.length}`);
    }
  } else if (hold3x.includes(row.exercise)) {
    if (row.holds === null || row.holds === undefined) {
      throw new Error(`Missing holds for ${row.exercise} on ${row.daily_entry_date}`);
    }
    const holds = parseHolds(row.holds);
    if (holds.length !== 3) {
      throw new Error(`Unexpected number of holds for ${row.exercise} on ${row.daily_entry_date}: ${holds.length}`);
    }
    console.log(`INSERT INTO workout_results_new (daily_entry_date, exercise, execution, volume) VALUES ('${row.daily_entry_date}', '${row.exercise}', 'hold3x', '${holds[0]}s+${holds[1]}s+${holds[2]}s');`);
  } else if (hold1x.includes(row.exercise)) {
    if (row.holds === null || row.holds === undefined) {
      throw new Error(`Missing holds for ${row.exercise} on ${row.daily_entry_date}`);
    }
    const holds = parseHolds(row.holds);
    if (holds.length !== 1) {
      throw new Error(`Unexpected number of holds for ${row.exercise} on ${row.daily_entry_date}: ${holds.length}`);
    }
    console.log(`INSERT INTO workout_results_new (daily_entry_date, exercise, execution, volume) VALUES ('${row.daily_entry_date}', '${row.exercise}', 'hold1x', '${holds[0]}s');`);
  } else {
    throw new Error(`Unknown exercise: ${row.exercise}`);
  }
}

db.close();
