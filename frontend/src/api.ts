import type { ApiEnvelope, DailyEntry, Stats, Meal } from './types';

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
};

export { UnauthorizedError };
