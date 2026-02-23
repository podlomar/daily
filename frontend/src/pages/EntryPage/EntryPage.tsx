import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, UnauthorizedError } from '../../api';
import type { DailyEntry, Schedule } from '../../types';
import { Layout } from '../../components/Layout/Layout';
import { EntryNav } from '../../components/EntryNav/EntryNav';
import styles from './EntryPage.module.css';

const scheduleClass = (schedule: Schedule): string => styles[schedule] ?? '';

const Performance = ({ value }: { value: number | null }) => {
  if (value == null) return <span className={styles.value}>{'\u2014'}</span>;
  return (
    <span className={styles.performance}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < value ? styles.performanceFilled : styles.performanceDot}
        >
          {'\u25CF'}
        </span>
      ))}
    </span>
  );
};

export const EntryPage = () => {
  const { date } = useParams<{ date: string }>();
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [links, setLinks] = useState<{ previous?: string; next?: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!date) return;

    setLoading(true);
    setError('');

    api.getEntry(date)
      .then((res) => {
        setEntry(res.result);
        setLinks({
          previous: res.links.previous,
          next: res.links.next,
        });
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          navigate('/login');
          return;
        }
        setError('Entry not found');
      })
      .finally(() => setLoading(false));
  }, [date, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>Loading...</div>
      </Layout>
    );
  }

  if (error || !entry) {
    return (
      <Layout>
        <div className={styles.error}>{error || 'Entry not found'}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <EntryNav
        date={entry.date}
        day={entry.day}
        previous={links.previous}
        next={links.next}
      />

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Running</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>schedule</span>
            <span className={`${styles.value} ${scheduleClass(entry.running.schedule)}`}>
              {entry.running.schedule}
            </span>
          </div>
          {entry.running.track && (
            <>
              <div className={styles.field}>
                <span className={styles.label}>track</span>
                <span className={styles.value}>
                  <a href={entry.running.track.url} target="_blank" rel="noopener noreferrer">
                    {entry.running.track.name}
                  </a>
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>distance</span>
                <span className={styles.value}>
                  {entry.running.track.length} {entry.running.track.progressUnit}
                </span>
              </div>
            </>
          )}
          <div className={styles.field}>
            <span className={styles.label}>progress</span>
            <span className={styles.value}>{entry.running.progress ?? '\u2014'}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>performance</span>
            <Performance value={entry.running.performance} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Workout</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>schedule</span>
            <span className={`${styles.value} ${scheduleClass(entry.workout.schedule)}`}>
              {entry.workout.schedule}
            </span>
          </div>
          {entry.workout.routine && (
            <div className={styles.field}>
              <span className={styles.label}>routine</span>
              <span className={styles.value}>{entry.workout.routine}</span>
            </div>
          )}
        </div>
        {(entry.workout.results?.length ?? 0) > 0 && (
          <table className={styles.table} style={{ marginTop: 'var(--space-sm)' }}>
            <thead>
              <tr>
                <th>exercise</th>
                <th>execution</th>
                <th>volume</th>
              </tr>
            </thead>
            <tbody>
              {(entry.workout.results ?? []).map((r, i) => (
                <tr key={i}>
                  <td>{r.exercise}</td>
                  <td>{r.execution}</td>
                  <td>{r.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Body</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>weight</span>
            <span className={styles.value}>
              {entry.weight != null ? `${entry.weight} kg` : '\u2014'}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>last meal</span>
            <span className={styles.value}>{entry.lastMeal ?? '\u2014'}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>stretching</span>
            <span className={styles.value}>{entry.stretching ?? '\u2014'}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>stairs</span>
            <span className={styles.value}>{entry.stairs ?? '\u2014'}</span>
          </div>
        </div>
      </div>

      {entry.diary && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Diary</div>
          <div className={styles.diary}>{entry.diary}</div>
        </div>
      )}
    </Layout>
  );
};
