import type { ApiEnvelope, DailyEntry, Stats, Meal, Track } from './types';

class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
  }
}

async function request<T>(path: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(path, { credentials: 'same-origin' });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  getStats: () => request<Stats>('/api/stats'),
  getEntries: () => request<DailyEntry[]>('/api/entries'),
  getEntry: (date: string) => request<DailyEntry>(`/api/entries/${date}`),
  getMeals: () => request<Meal[]>('/api/meals'),
  getTracks: () => request<Track[]>('/api/tracks'),
  createEntry: async (data: object): Promise<void> => {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    });
    if (res.status === 401) throw new UnauthorizedError();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `API error: ${res.status}`);
    }
  },
  updateEntry: async (date: string, data: object): Promise<void> => {
    const res = await fetch(`/api/entries/${date}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    });
    if (res.status === 401) throw new UnauthorizedError();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `API error: ${res.status}`);
    }
  },
};

export { UnauthorizedError };
