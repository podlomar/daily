import express, { Request, Response } from 'express';
import { getAllTracks, getTrackById } from './db.js';

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
