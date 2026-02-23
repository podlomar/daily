import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, UnauthorizedError } from '../../api';
import type { DailyEntry, Track, Schedule } from '../../types';
import { Layout } from '../../components/Layout/Layout';
import styles from './HomePage.module.css';

const today = (): string => new Date().toISOString().slice(0, 10);

export const HomePage = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null | 'none'>(null);

  const [date, setDate] = useState(today());
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [trackId, setTrackId] = useState('');
  const [progress, setProgress] = useState('');
  const [performance, setPerformance] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.getTracks(),
      api.getEntry('today').catch(() => null),
    ]).then(([tracksRes, todayRes]) => {
      setTracks(tracksRes.result);
      setTodayEntry(todayRes ? todayRes.result : 'none');
    }).catch((err) => {
      if (err instanceof UnauthorizedError) navigate('/login');
    });
  }, [navigate]);

  const handleSave = async () => {
    if (!schedule) return;
    if (schedule !== 'void' && !trackId) {
      setError('Please select a track');
      return;
    }

    setSaving(true);
    setError('');

    const running: Record<string, unknown> = { schedule };
    if (schedule !== 'void' && trackId) running.trackId = trackId;
    if (progress.trim()) running.progress = progress.trim();
    if (performance != null) running.performance = performance;

    try {
      await api.createEntry({ date, running, workout: { schedule: 'void' } });
      navigate(`/entry/${date}`);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        navigate('/login');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save');
        setSaving(false);
      }
    }
  };

  if (todayEntry === null) {
    return (
      <Layout>
        <div className={styles.loading}>Loading...</div>
      </Layout>
    );
  }

  // Already tracked today
  if (todayEntry !== 'none') {
    const entry = todayEntry;
    const run = entry.running;
    const runSummary = run.schedule === 'void'
      ? 'rest'
      : [run.schedule, run.track?.name, run.progress].filter(Boolean).join(' · ');

    return (
      <Layout>
        <div className={styles.date}>{entry.date} · {entry.day}</div>
        <div className={styles.tracked}>
          <div className={styles.trackedLabel}>✓ tracked</div>
          <div className={styles.trackedSummary}>{runSummary}</div>
          <div className={styles.trackedActions}>
            <Link to={`/entry/${entry.date}`} className={styles.linkButton}>view entry</Link>
            <Link to="/dashboard" className={styles.linkButton}>history</Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Form for new entry
  const showFields = schedule === 'regular' || schedule === 'adhoc';
  const canSave = schedule !== null && (schedule === 'void' || !!trackId);

  return (
    <Layout>
      <div className={styles.date}>
        <input
          type="date"
          className={styles.dateInput}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className={styles.form}>
        <div className={styles.scheduleRow}>
          <button
            className={`${styles.scheduleBtn} ${styles.scheduleBtnVoid} ${schedule === 'void' ? styles.active : ''}`}
            onClick={() => setSchedule('void')}
          >
            void
          </button>
          <button
            className={`${styles.scheduleBtn} ${styles.scheduleBtnRegular} ${schedule === 'regular' ? styles.active : ''}`}
            onClick={() => setSchedule('regular')}
          >
            regular
          </button>
          <button
            className={`${styles.scheduleBtn} ${styles.scheduleBtnAdhoc} ${schedule === 'adhoc' ? styles.active : ''}`}
            onClick={() => setSchedule('adhoc')}
          >
            adhoc
          </button>
        </div>

        {showFields && (
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.label}>track</label>
              <select
                className={styles.select}
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              >
                <option value="">— select —</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>progress</label>
              <input
                className={styles.input}
                type="text"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                placeholder="full / 4.5 / …"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>performance</label>
              <div className={styles.dots}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`${styles.dot} ${n <= (performance ?? 0) ? styles.dotFilled : styles.dotEmpty}`}
                    onClick={() => setPerformance(performance === n ? null : n)}
                  >
                    ●
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? 'saving…' : 'save'}
        </button>
      </div>
    </Layout>
  );
};
