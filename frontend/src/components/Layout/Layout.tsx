import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Link to="/">Daily Tracker</Link>
        </h1>
        <button className={styles.logout} onClick={handleLogout}>
          logout
        </button>
      </header>
      {children}
    </div>
  );
};
