import express, { Request, Response } from 'express';
import { initializeDatabase, getAllUsers, getUserById } from './db.js';

const app = express();
const PORT = process.env.PORT || 4321;

initializeDatabase();

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/users', (req: Request, res: Response) => {
  try {
    const users = getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

app.get('/users/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUserById(id);

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
