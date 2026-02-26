import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Token is required');
      return;
    }

    const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `token=${trimmed}; path=/; SameSite=Strict; expires=${expires}`;

    const res = await fetch('/api/stats', { credentials: 'same-origin' });
    if (res.status === 401) {
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
      setError('Invalid token');
      return;
    }

    navigate('/');
  };

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Daily Tracker</h1>
        <label className={styles.label}>Auth Token</label>
        <input
          className={styles.input}
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your token"
          autoFocus
        />
        <button className={styles.button} type="submit">
          Sign in
        </button>
        {error && <div className={styles.error}>{error}</div>}
      </form>
    </div>
  );
};
