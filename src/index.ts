import express, { Request, Response } from 'express';
import { getAllTracks, getTrackById, getAllDialyEntries, buildDiary, getDailyEntryByDate, updateDailyDiary } from './db.js';

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

app.get('/entries', (req: Request, res: Response) => {
  try {
    const entries = getAllDialyEntries();
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve daily entries' });
  }
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

app.post('/entries/:date', (req: Request, res: Response) => {
  try {
    const date = req.params.date;
    const { diary } = req.body;

    const success = updateDailyDiary(date, diary);
    if (success) {
      res.status(200).json({ message: 'Diary updated successfully' });
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update daily diary' });
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
