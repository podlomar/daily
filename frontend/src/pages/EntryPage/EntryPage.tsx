import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, UnauthorizedError } from '../../api';
import type { DailyEntry, Schedule, Track } from '../../types';
import { Layout } from '../../components/Layout/Layout';
import { EntryNav } from '../../components/EntryNav/EntryNav';
import styles from './EntryPage.module.css';

const today = (): string => new Date().toISOString().slice(0, 10);

const nowTime = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const scheduleClass = (schedule: Schedule | null): string =>
  schedule ? styles[schedule] ?? '' : '';

const scheduleBtnClass = (
  btnType: 'void' | 'regular' | 'adhoc',
  active: boolean,
): string => {
  const variant =
    btnType === 'void'
      ? styles.scheduleBtnVoid
      : btnType === 'regular'
        ? styles.scheduleBtnRegular
        : styles.scheduleBtnAdhoc;
  return [styles.scheduleBtn, variant, active ? styles.active : ''].filter(Boolean).join(' ');
};

const isNumeric = (s: string): boolean => /^\d+(\.\d+)?$/.test(s.trim());

const Performance = ({ value }: { value: number | null }) => {
  if (value == null) return <span className={styles.value}>{'\u2014'}</span>;
  return (
    <span className={styles.performance}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < value ? styles.performanceFilled : styles.performanceDot}>
          {'\u25CF'}
        </span>
      ))}
    </span>
  );
};

export const EntryPage = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<DailyEntry | null | 'none'>(null);
  const [links, setLinks] = useState<{ previous?: string; next?: string }>({});
  const [tracks, setTracks] = useState<Track[]>([]);

  // Running edit state
  const [runEditMode, setRunEditMode] = useState(false);
  const [runSchedule, setRunSchedule] = useState<Schedule | null>(null);
  const [runTrackId, setRunTrackId] = useState('');
  const [runProgress, setRunProgress] = useState('');
  const [runPerformance, setRunPerformance] = useState<number | null>(null);
  const [runSaving, setRunSaving] = useState(false);
  const [runError, setRunError] = useState('');

  // Diary edit state
  const [diaryEditMode, setDiaryEditMode] = useState(false);
  const [diaryText, setDiaryText] = useState('');
  const [diaryPhotoUrl, setDiaryPhotoUrl] = useState('');
  const [diarySaving, setDiarySaving] = useState(false);
  const [diaryError, setDiaryError] = useState('');

  // Body edit state
  const [bodyEditMode, setBodyEditMode] = useState(false);
  const [weight, setWeight] = useState('');
  const [editLastMeal, setEditLastMeal] = useState('');
  const [bodySaving, setBodySaving] = useState(false);

  // Create form state (when entry doesn't exist)
  const [createDate, setCreateDate] = useState(today());
  const [createWeight, setCreateWeight] = useState('');
  const [createSchedule, setCreateSchedule] = useState<Schedule | null>(null);
  const [createTrackId, setCreateTrackId] = useState('');
  const [createProgress, setCreateProgress] = useState('');
  const [createPerformance, setCreatePerformance] = useState<number | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const populateEditState = (e: DailyEntry) => {
    setRunSchedule(e.running.schedule);
    setRunTrackId(e.running.track?.id ?? '');
    setRunProgress(e.running.progress ?? '');
    setRunPerformance(e.running.performance);
    setWeight(e.weight != null ? String(e.weight) : '');
    setEditLastMeal(e.lastMeal ?? '');
    setDiaryText(e.diary ?? '');
    setDiaryPhotoUrl(e.photoUrl ?? '');
  };

  const loadEntry = async (entryDate: string) => {
    const res = await api.getEntry(entryDate);
    setEntry(res.result);
    setLinks({ previous: res.links.previous, next: res.links.next });
    populateEditState(res.result);
  };

  useEffect(() => {
    if (!date) return;

    setEntry(null);
    setRunEditMode(false);
    setBodyEditMode(false);
    Promise.all([
      api.getEntry(date).catch((err) => {
        if (err instanceof UnauthorizedError) throw err;
        return null;
      }),
      api.getTracks(),
    ]).then(([entryRes, tracksRes]) => {
      setTracks(tracksRes.result);
      if (entryRes === null) {
        setEntry('none');
        if (date !== 'today' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          setCreateDate(date);
        }
      } else {
        const e = entryRes.result;
        setEntry(e);
        setLinks({ previous: entryRes.links.previous, next: entryRes.links.next });
        populateEditState(e);
      }
    }).catch((err) => {
      if (err instanceof UnauthorizedError) navigate('/login');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, navigate]);

  const handleSaveRunning = async () => {
    if (!entry || entry === 'none' || runSchedule === null) return;
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
      await api.updateEntry(entry.date, { running });
      await loadEntry(entry.date);
      setRunEditMode(false);
    } catch (err) {
      if (err instanceof UnauthorizedError) navigate('/login');
      else setRunError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setRunSaving(false);
    }
  };

  const handleCancelRunning = () => {
    if (!entry || entry === 'none') return;
    setRunSchedule(entry.running.schedule);
    setRunTrackId(entry.running.track?.id ?? '');
    setRunProgress(entry.running.progress ?? '');
    setRunPerformance(entry.running.performance);
    setRunError('');
    setRunEditMode(false);
  };

  const handleSaveBody = async () => {
    if (!entry || entry === 'none') return;
    setBodySaving(true);
    try {
      await api.updateEntry(entry.date, {
        weight: weight === '' ? null : parseFloat(weight),
        lastMeal: editLastMeal === '' ? null : editLastMeal,
      });
      await loadEntry(entry.date);
      setBodyEditMode(false);
    } catch (err) {
      if (err instanceof UnauthorizedError) navigate('/login');
    } finally {
      setBodySaving(false);
    }
  };

  const handleCancelBody = () => {
    if (!entry || entry === 'none') return;
    setWeight(entry.weight != null ? String(entry.weight) : '');
    setEditLastMeal(entry.lastMeal ?? '');
    setBodyEditMode(false);
  };

  const handleSaveDiary = async () => {
    if (!entry || entry === 'none') return;
    setDiarySaving(true);
    setDiaryError('');
    try {
      await api.postDiary(entry.date, diaryText);
      await api.updateEntry(entry.date, { photoUrl: diaryPhotoUrl.trim() || null });
      await loadEntry(entry.date);
      setDiaryEditMode(false);
    } catch (err) {
      if (err instanceof UnauthorizedError) navigate('/login');
      else setDiaryError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setDiarySaving(false);
    }
  };

  const handleCancelDiary = () => {
    if (!entry || entry === 'none') return;
    setDiaryText(entry.diary ?? '');
    setDiaryPhotoUrl(entry.photoUrl ?? '');
    setDiaryError('');
    setDiaryEditMode(false);
  };

  const handleCreate = async () => {
    const hasWeight = createWeight !== '';
    if (!hasWeight && createSchedule === null) return;
    if (createSchedule !== null && createSchedule !== 'void' && !createTrackId) {
      setCreateError('Please select a track');
      return;
    }
    setCreateSaving(true);
    setCreateError('');
    const body: Record<string, unknown> = { date: createDate };
    if (hasWeight) body.weight = parseFloat(createWeight);
    if (createSchedule !== null) {
      const running: Record<string, unknown> = { schedule: createSchedule };
      if (createSchedule !== 'void' && createTrackId) running.trackId = createTrackId;
      if (createProgress.trim()) running.progress = createProgress.trim();
      if (createPerformance != null) running.performance = createPerformance;
      body.running = running;
    }
    try {
      await api.createEntry(body);
      await loadEntry(createDate);
    } catch (err) {
      if (err instanceof UnauthorizedError) navigate('/login');
      else {
        setCreateError(err instanceof Error ? err.message : 'Failed to create');
        setCreateSaving(false);
      }
    }
  };

  if (entry === null) {
    return (
      <Layout>
        <div className={styles.loading}>Loading...</div>
      </Layout>
    );
  }

  // Entry does not exist → creation form
  if (entry === 'none') {
    const showCreateFields = createSchedule === 'regular' || createSchedule === 'adhoc';
    const canCreate = createWeight !== '' || createSchedule !== null;
    const selectedCreateTrack = tracks.find((t) => t.id === createTrackId) ?? null;

    return (
      <Layout>
        <div className={styles.dateRow}>
          <input
            type="date"
            className={styles.dateInput}
            value={createDate}
            onChange={(e) => setCreateDate(e.target.value)}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Body</div>
          <div className={styles.field}>
            <label className={styles.label}>weight (kg)</label>
            <input
              className={styles.input}
              type="number"
              step="0.1"
              value={createWeight}
              onChange={(e) => setCreateWeight(e.target.value)}
              placeholder="75.5"
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Running</div>
          <div className={styles.scheduleRow}>
            {(['void', 'regular', 'adhoc'] as const).map((s) => (
              <button
                key={s}
                className={scheduleBtnClass(s, createSchedule === s)}
                onClick={() => setCreateSchedule(s)}
              >
                {s}
              </button>
            ))}
          </div>
          {showCreateFields && (
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>track</label>
                <select
                  className={styles.select}
                  value={createTrackId}
                  onChange={(e) => setCreateTrackId(e.target.value)}
                >
                  <option value="">— select —</option>
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {selectedCreateTrack && (
                  <div className={styles.trackInfo}>
                    <span>{selectedCreateTrack.length} km</span>
                    {selectedCreateTrack.lastUsed && (
                      <span>last run {selectedCreateTrack.lastUsed}</span>
                    )}
                    <a
                      href={selectedCreateTrack.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.trackInfoLink}
                    >
                      map
                    </a>
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>progress</label>
                <input
                  className={styles.input}
                  type="text"
                  value={createProgress}
                  onChange={(e) => setCreateProgress(e.target.value)}
                  placeholder="full / 4.5 / …"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>performance</label>
                <div className={styles.dots}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={`${styles.dot} ${n <= (createPerformance ?? 0) ? styles.dotFilled : styles.dotEmpty}`}
                      onClick={() => setCreatePerformance(createPerformance === n ? null : n)}
                    >
                      ●
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {createError && <div className={styles.error}>{createError}</div>}

        <button
          className={styles.saveBtn}
          onClick={handleCreate}
          disabled={!canCreate || createSaving}
        >
          {createSaving ? 'saving…' : 'save'}
        </button>
      </Layout>
    );
  }

  // Entry exists → view with section-level edit mode
  const showRunFields = runSchedule === 'regular' || runSchedule === 'adhoc';
  const canSaveRunning = runSchedule !== null && (runSchedule === 'void' || !!runTrackId);
  const selectedRunTrack = tracks.find((t) => t.id === runTrackId) ?? null;

  return (
    <Layout>
      <EntryNav
        date={entry.date}
        day={entry.day}
        previous={links.previous}
        next={links.next}
      />

      {/* Running section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Running</div>
          {!runEditMode && (
            <button className={styles.editBtn} onClick={() => setRunEditMode(true)}>edit</button>
          )}
        </div>

        {runEditMode ? (
          <>
            <div className={styles.scheduleRow}>
              {(['void', 'regular', 'adhoc'] as const).map((s) => (
                <button
                  key={s}
                  className={scheduleBtnClass(s, runSchedule === s)}
                  onClick={() => setRunSchedule(s)}
                >
                  {s}
                </button>
              ))}
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
                      <span>{selectedRunTrack.length} km</span>
                      {selectedRunTrack.lastUsed && (
                        <span>last run {selectedRunTrack.lastUsed}</span>
                      )}
                      <a
                        href={selectedRunTrack.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.trackInfoLink}
                      >
                        map
                      </a>
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
            <div className={styles.editActions}>
              <button
                className={styles.saveBtn}
                onClick={handleSaveRunning}
                disabled={!canSaveRunning || runSaving}
              >
                {runSaving ? 'saving…' : 'save'}
              </button>
              <button className={styles.cancelBtn} onClick={handleCancelRunning}>
                cancel
              </button>
            </div>
          </>
        ) : (
          <div className={styles.grid}>
            <div className={styles.field}>
              <span className={styles.label}>schedule</span>
              <span className={`${styles.value} ${scheduleClass(entry.running.schedule)}`}>
                {entry.running.schedule ?? '\u2014'}
              </span>
            </div>
            {entry.running.track && (
              <>
                <div className={styles.field}>
                  <span className={styles.label}>track</span>
                  <span className={styles.value}>
                    <a
                      href={entry.running.track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {entry.running.track.name}
                    </a>
                  </span>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>distance</span>
                  <span className={styles.value}>
                    {entry.running.track.length} km
                  </span>
                </div>
              </>
            )}
            <div className={styles.field}>
              <span className={styles.label}>progress</span>
              <span className={styles.value}>
                {entry.running.progress != null
                  ? isNumeric(entry.running.progress) && entry.running.track
                    ? `${entry.running.progress} ${entry.running.track.progressUnit}`
                    : entry.running.progress
                  : '\u2014'}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>performance</span>
              <Performance value={entry.running.performance} />
            </div>
          </div>
        )}
      </div>

      {/* Body section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Body</div>
          {!bodyEditMode && (
            <button className={styles.editBtn} onClick={() => setBodyEditMode(true)}>edit</button>
          )}
        </div>

        {bodyEditMode ? (
          <>
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
            <div className={styles.field}>
              <label className={styles.label}>last meal</label>
              <div className={styles.timeRow}>
                <input
                  className={styles.input}
                  type="time"
                  value={editLastMeal}
                  onChange={(e) => setEditLastMeal(e.target.value)}
                />
                <button
                  className={styles.nowBtn}
                  onClick={() => setEditLastMeal(nowTime())}
                >
                  now
                </button>
              </div>
            </div>
            <div className={styles.editActions}>
              <button
                className={styles.saveBtn}
                onClick={handleSaveBody}
                disabled={bodySaving}
              >
                {bodySaving ? 'saving…' : 'save'}
              </button>
              <button className={styles.cancelBtn} onClick={handleCancelBody}>
                cancel
              </button>
            </div>
          </>
        ) : (
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
            {entry.stretching && (
              <div className={styles.field}>
                <span className={styles.label}>stretching</span>
                <span className={styles.value}>{entry.stretching}</span>
              </div>
            )}
            {entry.stairs && (
              <div className={styles.field}>
                <span className={styles.label}>stairs</span>
                <span className={styles.value}>{entry.stairs}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Workout section — read-only */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Workout</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.label}>schedule</span>
            <span className={`${styles.value} ${scheduleClass(entry.workout.schedule)}`}>
              {entry.workout.schedule ?? '\u2014'}
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

      {/* Diary section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Diary</div>
          {!diaryEditMode && (
            <button className={styles.editBtn} onClick={() => setDiaryEditMode(true)}>edit</button>
          )}
        </div>
        {diaryEditMode ? (
          <>
            <textarea
              className={styles.textarea}
              value={diaryText}
              onChange={(e) => setDiaryText(e.target.value)}
              rows={6}
              placeholder="Write your diary entry…"
            />
            <div className={styles.field}>
              <label className={styles.label}>photo url</label>
              <input
                className={styles.input}
                type="url"
                value={diaryPhotoUrl}
                onChange={(e) => setDiaryPhotoUrl(e.target.value)}
                placeholder="https://photos.app.goo.gl/…"
              />
            </div>
            {diaryError && <div className={styles.error}>{diaryError}</div>}
            <div className={styles.editActions}>
              <button
                className={styles.saveBtn}
                onClick={handleSaveDiary}
                disabled={diarySaving}
              >
                {diarySaving ? 'saving…' : 'save'}
              </button>
              <button className={styles.cancelBtn} onClick={handleCancelDiary}>
                cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {entry.diary ? (
              <div className={styles.diary}>{entry.diary}</div>
            ) : (
              <div className={styles.empty}>no entry</div>
            )}
            {entry.photoUrl && (
              <a href={entry.photoShareUrl ?? entry.photoUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={entry.photoUrl.replace(
                    /(lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_-]+)(?:=[^?]*)?(\?.*)?$/,
                    '$1=w900$2'
                  )}
                  alt="diary photo"
                  className={styles.diaryPhoto}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    (e.currentTarget.nextSibling as HTMLElement).style.display = 'inline';
                  }}
                />
                <span className={styles.photoLink} style={{ display: 'none' }}>
                  view photo ↗
                </span>
              </a>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
