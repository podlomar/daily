import express, { Request, Response } from 'express';
import dayjs from 'dayjs';
import yaml from 'js-yaml';
import type { DailyEntryInput } from './db/entries.js';
import { getAllTracks, getTrackById, getAllDailyEntries, buildDiary, getDailyEntryByDate, updateDailyEntry, getWeekSummary, createDailyEntry, createTrack, getWorkoutResultsByDate, collectStats, workoutsSummary, getExercises } from './db/index.js';
import { parseDailyEntryYaml, parseDailyEntryJson } from './parsers/index.js';
import { getMeals } from './food/meals.js';
import { Result } from 'monadix/result';
import { openapiSpec } from './openapi.js';

const app = express();
const PORT = process.env.PORT || 4321;

const envelope = (req: Request, result: any, links?: Record<string, string>) => ({
  links: { self: req.originalUrl, ...links },
  result,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use((req: Request, res: Response, next) => {
  if (req.is('application/yaml')) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        req.body = yaml.load(data);
        next();
      } catch (err) {
        res.status(400).json({ error: 'Invalid YAML' });
      }
    });
  } else {
    next();
  }
});

app.get('/api', (req: Request, res: Response) => {
  res.status(200).json(openapiSpec);
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json(envelope(req, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));
});

app.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = collectStats();
    res.status(200).json(envelope(req, stats));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
    console.error(error);
  }
});

app.get('/summary', (req: Request, res: Response) => {
  try {
    const results = workoutsSummary();
    res.status(200).json(envelope(req, results));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve workouts summary' });
  }
});

app.get('/tracks', (req: Request, res: Response) => {
  try {
    const tracks = getAllTracks();
    res.status(200).json(envelope(req, tracks));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tracks' });
  }
});

app.get('/tracks/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const track = getTrackById(id);

    if (track) {
      res.status(200).json(envelope(req, track));
    } else {
      res.status(404).json({ error: 'Track not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve track' });
  }
});

app.post('/tracks', (req: Request, res: Response) => {
  try {
    const track = req.body;
    createTrack(track);
    res.status(201).json(envelope(req, { message: 'Track created successfully' }));
  } catch (error) {
    res.status(500).json({ error: 'Failed to create track' });
    console.error(error);
  }
});

app.get('/entries', (req: Request, res: Response) => {
  try {
    const entries = getAllDailyEntries();
    res.status(200).json(envelope(req, entries));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve daily entries' });
    console.error(error);
  }
});

app.post('/entries', (req: Request, res: Response) => {
  const entryInit = req.body;

  let result: Result<DailyEntryInput, string[]> | null = null;
  if (req.is('application/yaml')) {
    result = parseDailyEntryYaml(entryInit);
  } else if (req.is('application/json')) {
    result = parseDailyEntryJson(entryInit);
  }

  if (result === null) {
    return res.status(400).json({ error: 'Unsupported content type' });
  }

  if (result.isFail()) {
    return res.status(400).json({
      error: 'Invalid daily entry input',
      details: result.err(),
    });
  }

  const createResult = createDailyEntry(result.get());
  if (createResult.isFail()) {
    return res.status(400).json({
      error: 'Failed to create daily entry',
      details: createResult.err(),
    });
  } else {
    res.status(201).json(envelope(req, {
      message: 'Daily entry created successfully',
      report: createResult.get(),
    }));
  }
});


app.get('/entries/:date', (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const queryDate = date === 'today' ? dayjs().format('YYYY-MM-DD') : date;
    const entry = getDailyEntryByDate(queryDate);

    if (entry) {
      res.status(200).json(envelope(req, entry, {
        previous: `/entries/${dayjs(queryDate).subtract(1, 'day').format('YYYY-MM-DD')}`,
        next: `/entries/${dayjs(queryDate).add(1, 'day').format('YYYY-MM-DD')}`,
      }));
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve daily entry' });
  }
});

app.patch('/entries/:date', (req: Request, res: Response) => {
  try {
    const date = req.params.date;
    const entryUpdate = req.body;

    const success = updateDailyEntry(date, entryUpdate);
    if (success) {
      res.status(200).json(envelope(req, { message: 'Daily entry updated successfully' }));
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update daily entry' });
  }
});

app.post('/entries/:date/diary', (req: Request, res: Response) => {
  try {
    const date = req.params.date;

    // Get the diary text from the request body as plain text
    const diaryText = req.body;
    console.log(`Received diary update for ${date}:`, diaryText);

    const success = updateDailyEntry(date, { diary: diaryText });
    if (success) {
      res.status(200).json(envelope(req, { message: `Diary updated successfully for ${date}` }));
    } else {
      console.log(success);
      res.status(404).json({ error: `Diary not found for ${date}` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update daily entry' });
  }
});

app.get('/workouts/:date', (req: Request, res: Response) => {
  try {
    const date = req.params.date;
    const results = getWorkoutResultsByDate(date);
    res.status(200).json(envelope(req, results));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve workout results' });
  }
});

app.get('/diary', (req: Request, res: Response) => {
  try {
    const diary = buildDiary();
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(diary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve diary' });
  }
});

app.get('/week/:week', (req: Request, res: Response) => {
  try {
    const { week } = req.params;
    const summary = getWeekSummary(week);

    if (summary) {
      res.status(200).json(envelope(req, summary));
    } else {
      res.status(404).json({ error: 'Week summary not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve week summary' });
  }
});

app.get('/meals', (req: Request, res: Response) => {
  try {
    const meals = getMeals();
    res.status(200).json(envelope(req, meals));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve meals' });
  }
});

app.get('/exercises', (req: Request, res: Response) => {
  try {
    const exercises = getExercises();
    res.status(200).json(envelope(req, exercises));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve exercises' });
  }
});

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export { app };
