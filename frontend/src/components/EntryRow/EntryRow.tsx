import { Link } from 'react-router-dom';
import type { DailyEntry, Schedule } from '../../types';
import styles from './EntryRow.module.css';

interface EntryRowProps {
  entry: DailyEntry;
}

const scheduleClass = (schedule: Schedule | null): string => {
  return schedule ? styles[schedule] ?? '' : '';
};

const formatSchedule = (label: string, schedule: Schedule | null): string => {
  if (schedule == null || schedule === 'void') return '\u2014';
  return `${label}: ${schedule}`;
};

export const EntryRow = ({ entry }: EntryRowProps) => (
  <Link to={`/entry/${entry.date}`} className={styles.row}>
    <span className={styles.date}>{entry.date}</span>
    <span className={styles.day}>{entry.day}</span>
    <span className={`${styles.schedule} ${scheduleClass(entry.running.schedule)}`}>
      {formatSchedule('run', entry.running.schedule)}
    </span>
    <span className={`${styles.schedule} ${scheduleClass(entry.workout.schedule)}`}>
      {formatSchedule('wkt', entry.workout.schedule)}
    </span>
    <span className={styles.weight}>
      {entry.weight != null ? `${entry.weight} kg` : '\u2014'}
    </span>
  </Link>
);
