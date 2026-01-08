import express, { Request, Response } from 'express';
import { getAllTracks, getTrackById, getAllDialyEntries, buildDiary, getDailyEntryByDate, updateDailyEntry, getWeekSummary, createDailyEntry, createTrack, getWorkoutResultsByDate } from './db.js';

const app = express();
const PORT = process.env.PORT || 4321;

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/tracks', (req: Request, res: Response) => {
  try {
    const tracks = getAllTracks();
    res.status(200).json(tracks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tracks' });
  }
});

app.get('/tracks/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const track = getTrackById(id);

    if (track) {
      res.status(200).json(track);
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
    res.status(201).json({ message: 'Track created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create track' });
    console.error(error);
  }
});

app.get('/entries', (req: Request, res: Response) => {
  try {
    const entries = getAllDialyEntries();
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve daily entries' });
    console.error(error);
  }
});

app.post('/entries', (req: Request, res: Response) => {
  try {
    const entryInit = req.body;
    createDailyEntry(entryInit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create daily entry' });
    console.error(error);
    return;
  }
  res.status(201).json({ message: 'Daily entry created successfully' });
});

app.get('/entries/:date', (req: Request, res: Response) => {
  try {
    const date = req.params.date;
    const entry = getDailyEntryByDate(date);

    if (entry) {
      res.status(200).json(entry);
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
      res.status(200).json({ message: 'Daily entry updated successfully' });
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update daily entry' });
  }
});

app.get('/workouts/:date', (req: Request, res: Response) => {
  try {
    const date = req.params.date;
    const results = getWorkoutResultsByDate(date);
    res.status(200).json(results);
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
      res.status(200).json(summary);
    } else {
      res.status(404).json({ error: 'Week summary not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve week summary' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
