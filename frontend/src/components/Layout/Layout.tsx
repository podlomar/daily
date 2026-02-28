import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import pkg from '../../../package.json';
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
        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.navLink}>history</Link>
          <Link to="/todos" className={styles.navLink}>todos</Link>
          <button className={styles.logout} onClick={handleLogout}>logout</button>
        </nav>
      </header>
      {children}
      <footer className={styles.footer}>v{pkg.version}</footer>
    </div>
  );
};
