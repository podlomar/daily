import type { Stats } from '../../types';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  stats: Stats;
}

export const StatsCard = ({ stats }: StatsCardProps) => (
  <div className={styles.card}>
    <div className={styles.title}>Running</div>
    <div className={styles.grid}>
      <div className={styles.stat}>
        <div className={styles.label}>current streak</div>
        <div className={styles.value}>{stats.currentRunningStreak.count}</div>
        <div className={styles.sub}>{(stats.currentRunningStreak.distance ?? 0).toFixed(1)} km</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.label}>best streak</div>
        <div className={styles.value}>{stats.bestRunningStreak.count}</div>
        <div className={styles.sub}>{(stats.bestRunningStreak.distance ?? 0).toFixed(1)} km</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.label}>total</div>
        <div className={styles.value}>{stats.total.count}</div>
        <div className={styles.sub}>{(stats.total.distance ?? 0).toFixed(1)} km</div>
      </div>
    </div>
  </div>
);
