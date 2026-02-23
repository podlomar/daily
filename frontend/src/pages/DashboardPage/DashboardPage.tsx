import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, UnauthorizedError } from '../../api';
import type { DailyEntry, Stats } from '../../types';
import { Layout } from '../../components/Layout/Layout';
import { StatsCard } from '../../components/StatsCard/StatsCard';
import { EntryRow } from '../../components/EntryRow/EntryRow';
import styles from './DashboardPage.module.css';

export const DashboardPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [today, setToday] = useState<DailyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, entriesRes, todayRes] = await Promise.all([
          api.getStats(),
          api.getEntries(),
          api.getEntry('today').catch(() => null),
        ]);

        setStats(statsRes.result);

        const sorted = entriesRes.result
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 14);
        setEntries(sorted);

        if (todayRes) {
          setToday(todayRes.result);
        }
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          navigate('/login');
          return;
        }
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.error}>{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {stats && <StatsCard stats={stats} />}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Today</div>
        {today ? (
          <div className={styles.today}>
            <div className={styles.todayGrid}>
              <div>
                <div className={styles.todayLabel}>running</div>
                <div className={styles.todayValue}>
                  {today.running.schedule === 'void' ? '\u2014' : today.running.schedule}
                </div>
              </div>
              <div>
                <div className={styles.todayLabel}>workout</div>
                <div className={styles.todayValue}>
                  {today.workout.schedule === 'void' ? '\u2014' : today.workout.schedule}
                </div>
              </div>
              <div>
                <div className={styles.todayLabel}>weight</div>
                <div className={styles.todayValue}>
                  {today.weight != null ? `${today.weight} kg` : '\u2014'}
                </div>
              </div>
              <div>
                <div className={styles.todayLabel}>last meal</div>
                <div className={styles.todayValue}>
                  {today.lastMeal ?? '\u2014'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.noEntry}>No entry for today</div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Recent Entries</div>
        <div className={styles.entriesHeader}>
          <span>date</span>
          <span>day</span>
          <span>running</span>
          <span>workout</span>
          <span style={{ textAlign: 'right' }}>weight</span>
        </div>
        {entries.map((entry) => (
          <EntryRow key={entry.date} entry={entry} />
        ))}
      </div>
    </Layout>
  );
};
