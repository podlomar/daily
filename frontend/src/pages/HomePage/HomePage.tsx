import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, UnauthorizedError } from '../../api';
import type { DailyEntry, Track, Schedule } from '../../types';
import { Layout } from '../../components/Layout/Layout';
import styles from './HomePage.module.css';

const today = (): string => new Date().toISOString().slice(0, 10);

const nowTime = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const HomePage = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null | 'none'>(null);

  // New entry form state
  const [date, setDate] = useState(today());
  const [weight, setWeight] = useState('');
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [trackId, setTrackId] = useState('');
  const [progress, setProgress] = useState('');
  const [performance, setPerformance] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Running form state (for already-tracked entries)
  const [runSchedule, setRunSchedule] = useState<Schedule | null>(null);
  const [runTrackId, setRunTrackId] = useState('');
  const [runProgress, setRunProgress] = useState('');
  const [runPerformance, setRunPerformance] = useState<number | null>(null);
  const [runSaving, setRunSaving] = useState(false);
  const [runError, setRunError] = useState('');

  const [currentTime, setCurrentTime] = useState(nowTime());
  const [lastMealSaving, setLastMealSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.getTracks(),
      api.getEntry('today').catch(() => null),
    ]).then(([tracksRes, todayRes]) => {
      setTracks(tracksRes.result);
      const entry = todayRes ? todayRes.result : 'none';
      setTodayEntry(entry);
      if (entry !== 'none') {
        const run = entry.running;
        setRunSchedule(run.schedule);
        setRunTrackId(run.track?.id ?? '');
        setRunProgress(run.progress ?? '');
        setRunPerformance(run.performance ?? null);
      }
    }).catch((err) => {
      if (err instanceof UnauthorizedError) navigate('/login');
    });
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(nowTime()), 10_000);
    return () => clearInterval(id);
  }, []);

  const handleLastMeal = async () => {
    if (todayEntry === null || todayEntry === 'none') return;
    const time = nowTime();
    setLastMealSaving(true);
    try {
      await api.updateEntry(todayEntry.date, { lastMeal: time });
      setTodayEntry({ ...todayEntry, lastMeal: time });
    } catch (err) {
      if (err instanceof UnauthorizedError) navigate('/login');
    } finally {
      setLastMealSaving(false);
    }
  };

  const handleSaveRunning = async () => {
    if (todayEntry === null || todayEntry === 'none' || runSchedule === null) return;
    if (runSchedule !== 'void' && !runTrackId) {
      setRunError('Please select a track');
      return;
    }

    setRunSaving(true);
    setRunError('');

    const running: Record<string, unknown> = { schedule: runSchedule };
    if (runSchedule !== 'void' && runTrackId) running.trackId = runTrackId;
    if (runProgress.trim()) running.progress = runProgress.trim();
    if (runPerformance != null) running.performance = runPerformance;

    try {
      await api.updateEntry(todayEntry.date, { running });
      const refreshed = await api.getEntry('today');
      setTodayEntry(refreshed.result);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        navigate('/login');
      } else {
        setRunError(err instanceof Error ? err.message : 'Failed to save');
      }
    } finally {
      setRunSaving(false);
    }
  };

  const handleSave = async () => {
    const hasWeight = weight !== '';
    if (!schedule && !hasWeight) return;
    if (schedule !== null && schedule !== 'void' && !trackId) {
      setError('Please select a track');
      return;
    }

    setSaving(true);
    setError('');

    const body: Record<string, unknown> = { date };
    if (hasWeight) body.weight = parseFloat(weight);
    if (schedule !== null) {
      const running: Record<string, unknown> = { schedule };
      if (schedule !== 'void' && trackId) running.trackId = trackId;
      if (progress.trim()) running.progress = progress.trim();
      if (performance != null) running.performance = performance;
      body.running = running;
    }

    try {
      await api.createEntry(body);
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
    const showRunFields = runSchedule === 'regular' || runSchedule === 'adhoc';
    const canSaveRunning = runSchedule !== null && (runSchedule === 'void' || !!runTrackId);
    const selectedRunTrack = tracks.find((t) => t.id === runTrackId) ?? null;

    return (
      <Layout>
        <div className={styles.date}>{entry.date} · {entry.day}</div>
        <div className={styles.tracked}>
          <div className={styles.trackedLabel}>✓ tracked</div>
          <div className={styles.trackedActions}>
            <Link to={`/entry/${entry.date}`} className={styles.linkButton}>view entry</Link>
          </div>
          <div className={styles.mealRow}>
            <button
              className={styles.mealBtn}
              onClick={handleLastMeal}
              disabled={lastMealSaving}
            >
              last meal · {currentTime}
            </button>
            {entry.lastMeal && (
              <span className={styles.mealCurrent}>was {entry.lastMeal}</span>
            )}
          </div>

          <div className={styles.runForm}>
            <div className={styles.scheduleRow}>
              <button
                className={`${styles.scheduleBtn} ${styles.scheduleBtnVoid} ${runSchedule === 'void' ? styles.active : ''}`}
                onClick={() => setRunSchedule('void')}
              >
                void
              </button>
              <button
                className={`${styles.scheduleBtn} ${styles.scheduleBtnRegular} ${runSchedule === 'regular' ? styles.active : ''}`}
                onClick={() => setRunSchedule('regular')}
              >
                regular
              </button>
              <button
                className={`${styles.scheduleBtn} ${styles.scheduleBtnAdhoc} ${runSchedule === 'adhoc' ? styles.active : ''}`}
                onClick={() => setRunSchedule('adhoc')}
              >
                adhoc
              </button>
            </div>

            {showRunFields && (
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>track</label>
                  <select
                    className={styles.select}
                    value={runTrackId}
                    onChange={(e) => setRunTrackId(e.target.value)}
                  >
                    <option value="">— select —</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {selectedRunTrack && (
                    <div className={styles.trackInfo}>
                      <span>{selectedRunTrack.length} {selectedRunTrack.progressUnit}</span>
                      {selectedRunTrack.lastUsed && (
                        <span>last run {selectedRunTrack.lastUsed}</span>
                      )}
                      <a href={selectedRunTrack.url} target="_blank" rel="noopener noreferrer" className={styles.trackInfoLink}>map</a>
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>progress</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={runProgress}
                    onChange={(e) => setRunProgress(e.target.value)}
                    placeholder="full / 4.5 / …"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>performance</label>
                  <div className={styles.dots}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        className={`${styles.dot} ${n <= (runPerformance ?? 0) ? styles.dotFilled : styles.dotEmpty}`}
                        onClick={() => setRunPerformance(runPerformance === n ? null : n)}
                      >
                        ●
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {runError && <div className={styles.error}>{runError}</div>}

            <button
              className={styles.saveBtn}
              onClick={handleSaveRunning}
              disabled={!canSaveRunning || runSaving}
            >
              {runSaving ? 'saving…' : 'save running'}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Form for new entry
  const hasWeight = weight !== '';
  const showFields = schedule === 'regular' || schedule === 'adhoc';
  const canSave = (hasWeight || schedule !== null) && (schedule === null || schedule === 'void' || !!trackId);
  const selectedTrack = tracks.find((t) => t.id === trackId) ?? null;

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
        <div className={styles.field}>
          <label className={styles.label}>weight (kg)</label>
          <input
            className={styles.input}
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="75.5"
          />
        </div>

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
              {selectedTrack && (
                <div className={styles.trackInfo}>
                  <span>{selectedTrack.length} {selectedTrack.progressUnit}</span>
                  {selectedTrack.lastUsed && (
                    <span>last run {selectedTrack.lastUsed}</span>
                  )}
                  <a href={selectedTrack.url} target="_blank" rel="noopener noreferrer" className={styles.trackInfoLink}>map</a>
                </div>
              )}
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
