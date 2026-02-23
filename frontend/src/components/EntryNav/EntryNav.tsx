import { Link } from 'react-router-dom';
import styles from './EntryNav.module.css';

interface EntryNavProps {
  date: string;
  day: string;
  previous?: string;
  next?: string;
}

const toFrontendPath = (apiPath: string) =>
  apiPath.replace(/^\/entries\//, '/entry/');

export const EntryNav = ({ date, day, previous, next }: EntryNavProps) => (
  <nav className={styles.nav}>
    {previous ? (
      <Link to={toFrontendPath(previous)} className={styles.link}>&larr; prev</Link>
    ) : (
      <span />
    )}
    <div className={styles.dateHeader}>
      <div className={styles.date}>{date}</div>
      <div className={styles.day}>{day}</div>
    </div>
    {next ? (
      <Link to={toFrontendPath(next)} className={styles.link}>next &rarr;</Link>
    ) : (
      <span />
    )}
  </nav>
);
